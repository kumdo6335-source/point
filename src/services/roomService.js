import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
  writeBatch,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  START_POINTS,
  LAND_COUNT,
  EXPIRE_HOURS,
  ROOM_STATUS,
  LAND_STATUS,
  WIN_REASON,
  activeTeamIds,
} from '../lib/constants'
import { generateRoomCode } from '../lib/roomCode'
import { judgeAuction } from '../lib/auction'
import { findBingoLine } from '../lib/bingo'

// ── 경로 헬퍼 ────────────────────────────────────────────────
const roomRef = (code) => doc(db, 'rooms', code)
const teamsCol = (code) => collection(db, 'rooms', code, 'teams')
const teamRef = (code, teamId) => doc(db, 'rooms', code, 'teams', teamId)
const landsCol = (code) => collection(db, 'rooms', code, 'lands')
const landRef = (code, n) => doc(db, 'rooms', code, 'lands', String(n))

function expireTimestamp() {
  return Timestamp.fromMillis(Date.now() + EXPIRE_HOURS * 3600 * 1000)
}

// ── 방 생성 (PRD 4.1-1) ──────────────────────────────────────
// 코드 충돌 시 재시도하며 rooms/{code} + teams + lands 초기화
export async function createRoom(teamCount) {
  const expireAt = expireTimestamp()

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode()
    const existing = await getDoc(roomRef(code))
    if (existing.exists()) continue

    const batch = writeBatch(db)
    batch.set(roomRef(code), {
      teamCount,
      status: ROOM_STATUS.WAITING,
      phase: 'bidding', // bidding | revealing (status=playing 일 때)
      currentLand: 1,
      winners: [],
      winReason: null,
      winLine: null,
      history: null,
      createdAt: Timestamp.now(),
      expireAt,
    })

    for (const teamId of activeTeamIds(teamCount)) {
      batch.set(teamRef(code, teamId), {
        points: START_POINTS,
        ownedLands: [],
        connected: false,
        clientId: null,
        expireAt,
      })
    }

    for (let n = 1; n <= LAND_COUNT; n++) {
      batch.set(landRef(code, n), {
        owner: null,
        bids: {},
        winningAmount: 0,
        status: LAND_STATUS.PENDING, // 시작 시 1번 땅만 bidding 으로 전환
        expireAt,
      })
    }

    await batch.commit()
    return code
  }
  throw new Error('방코드 생성에 실패했습니다. 다시 시도해 주세요.')
}

// ── 모둠 입장/선점 (PRD 2, 4.2-1) ────────────────────────────
// 같은 clientId면 재접속 허용, 다른 client가 선점했으면 거부
export async function claimTeam(code, teamId, clientId) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(teamRef(code, teamId))
    if (!snap.exists()) throw new Error('존재하지 않는 모둠입니다.')
    const team = snap.data()
    if (team.clientId && team.clientId !== clientId) {
      throw new Error('이미 다른 기기가 선택한 모둠입니다.')
    }
    tx.update(teamRef(code, teamId), { connected: true, clientId })
  })
}

export async function roomExists(code) {
  const snap = await getDoc(roomRef(code))
  return snap.exists()
}

// ── 게임 시작 (PRD 4.1-2/3) ──────────────────────────────────
export async function startGame(code) {
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef(code))
    if (!roomSnap.exists()) throw new Error('방을 찾을 수 없습니다.')
    if (roomSnap.data().status !== ROOM_STATUS.WAITING) return
    tx.update(roomRef(code), {
      status: ROOM_STATUS.PLAYING,
      phase: 'bidding',
      currentLand: 1,
    })
    tx.update(landRef(code, 1), { status: LAND_STATUS.BIDDING })
  })
}

// ── 입찰 제출 (PRD 4.2-3) ────────────────────────────────────
// 제출 후 수정 불가: 이미 key가 있으면 거부
export async function submitBid(code, landNumber, teamId, amount) {
  const bid = Math.max(0, Math.floor(Number(amount) || 0))
  await runTransaction(db, async (tx) => {
    const teamSnap = await tx.get(teamRef(code, teamId))
    const landSnap = await tx.get(landRef(code, landNumber))
    if (!teamSnap.exists() || !landSnap.exists()) throw new Error('데이터 오류')

    const team = teamSnap.data()
    const land = landSnap.data()

    if (land.status !== LAND_STATUS.BIDDING) throw new Error('입찰이 마감되었습니다.')
    if (Object.prototype.hasOwnProperty.call(land.bids || {}, teamId)) {
      throw new Error('이미 제출했습니다.')
    }
    if (bid > team.points) throw new Error('잔여 포인트를 초과했습니다.')

    tx.update(landRef(code, landNumber), {
      bids: { ...(land.bids || {}), [teamId]: bid },
    })
  })
}

// ── 경매 마감·낙찰 판정 (PRD 3.2, 4.1-4/5) ──────────────────
// force=true: 미제출 모둠은 0으로 처리(강제 마감)
// force=false: 전원 제출된 경우에만 마감(자동 마감)
export async function closeAuction(code, { force = false } = {}) {
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef(code))
    if (!roomSnap.exists()) throw new Error('방을 찾을 수 없습니다.')
    const room = roomSnap.data()
    if (room.status !== ROOM_STATUS.PLAYING) return

    const n = room.currentLand
    const landSnap = await tx.get(landRef(code, n))
    const land = landSnap.data()
    if (!land || land.status !== LAND_STATUS.BIDDING) return // 이미 마감됨

    const teams = activeTeamIds(room.teamCount)
    const teamSnaps = {}
    for (const t of teams) {
      teamSnaps[t] = await tx.get(teamRef(code, t))
    }

    const submittedBids = land.bids || {}

    // 자동 마감(force=false)은 전원 제출 시에만
    if (!force) {
      const allSubmitted = teams.every((t) =>
        Object.prototype.hasOwnProperty.call(submittedBids, t)
      )
      if (!allSubmitted) return
    }

    // 미제출 → 0 처리한 유효 입찰표
    const effectiveBids = {}
    for (const t of teams) {
      effectiveBids[t] = Object.prototype.hasOwnProperty.call(submittedBids, t)
        ? Number(submittedBids[t])
        : 0
    }

    const { winner, amount, passed } = judgeAuction(effectiveBids)

    // ── undo용 스냅샷 (변경 전 상태) ──
    const teamsBefore = {}
    for (const t of teams) {
      const d = teamSnaps[t].data()
      teamsBefore[t] = { points: d.points, ownedLands: d.ownedLands || [] }
    }
    const history = {
      land: n,
      teams: teamsBefore,
      roomBefore: {
        status: room.status,
        phase: room.phase,
        currentLand: room.currentLand,
        winners: room.winners || [],
        winReason: room.winReason,
        winLine: room.winLine,
      },
    }

    // ── 포인트 차감 (투자액 전액 소멸, 낙찰 무관) ──
    for (const t of teams) {
      const before = teamsBefore[t]
      const newPoints = before.points - effectiveBids[t]
      const patch = { points: newPoints }
      if (t === winner) {
        patch.ownedLands = [...before.ownedLands, n]
      }
      tx.update(teamRef(code, t), patch)
    }

    // ── 땅 결과 기록 ──
    tx.update(landRef(code, n), {
      owner: passed ? null : winner,
      status: passed ? LAND_STATUS.PASSED : LAND_STATUS.SOLD,
      bids: effectiveBids,
      winningAmount: passed ? 0 : amount,
    })

    // ── 종료 판정 ──
    let winLine = null
    let ended = false
    let winners = []
    let winReason = null

    if (winner) {
      const winnerLands = [...teamsBefore[winner].ownedLands, n]
      winLine = findBingoLine(winnerLands)
      if (winLine) {
        ended = true
        winners = [winner]
        winReason = WIN_REASON.BINGO
      }
    }

    if (!ended && n >= LAND_COUNT) {
      // 마지막 땅까지 완료 → 최다 땅 승리
      const landCount = {}
      for (const t of teams) {
        landCount[t] = teamsBefore[t].ownedLands.length + (t === winner ? 1 : 0)
      }
      const max = Math.max(...Object.values(landCount))
      winners = teams.filter((t) => landCount[t] === max && max > 0)
      winReason = winners.length > 1 ? WIN_REASON.TIE : WIN_REASON.MOST_LANDS
      ended = true
    }

    if (ended) {
      tx.update(roomRef(code), {
        status: ROOM_STATUS.FINISHED,
        winners,
        winReason,
        winLine,
        history,
      })
    } else {
      // 결과 공개 단계로 전환 (다음 땅은 교사가 "다음 땅" 클릭 시 진행)
      tx.update(roomRef(code), { phase: 'revealing', history })
    }
  })
}

// ── 다음 땅으로 진행 (PRD 4.1-5 "다음 땅") ───────────────────
export async function nextLand(code) {
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef(code))
    if (!roomSnap.exists()) throw new Error('방을 찾을 수 없습니다.')
    const room = roomSnap.data()
    if (room.status !== ROOM_STATUS.PLAYING || room.phase !== 'revealing') return

    const next = room.currentLand + 1
    tx.update(landRef(code, next), { status: LAND_STATUS.BIDDING })
    tx.update(roomRef(code), { currentLand: next, phase: 'bidding' })
  })
}

// ── 되돌리기 (PRD 4.1-6) — 직전 경매 1회 ─────────────────────
export async function undoLastAuction(code) {
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef(code))
    if (!roomSnap.exists()) throw new Error('방을 찾을 수 없습니다.')
    const room = roomSnap.data()
    const history = room.history
    if (!history) throw new Error('되돌릴 경매가 없습니다.')

    const n = history.land
    const teams = Object.keys(history.teams)

    // 모둠 포인트·소유 땅 복원
    for (const t of teams) {
      tx.update(teamRef(code, t), {
        points: history.teams[t].points,
        ownedLands: history.teams[t].ownedLands,
      })
    }

    // 현재 진행 중이던(다음) 땅이 있으면 pending 으로 되돌림
    if (room.currentLand && room.currentLand !== n) {
      tx.update(landRef(code, room.currentLand), { status: LAND_STATUS.PENDING })
    }

    // 해당 땅 재경매 상태로 초기화
    tx.update(landRef(code, n), {
      owner: null,
      status: LAND_STATUS.BIDDING,
      bids: {},
      winningAmount: 0,
    })

    // 방 상태 복원 (빙고로 종료됐던 경우도 playing 으로)
    tx.update(roomRef(code), {
      status: ROOM_STATUS.PLAYING,
      phase: 'bidding',
      currentLand: n,
      winners: [],
      winReason: null,
      winLine: null,
      history: null,
    })
  })
}

// ── 게임 종료·데이터 삭제 (PRD 4.1-7, 5.2) ──────────────────
export async function deleteRoom(code) {
  const [teamDocs, landDocs] = await Promise.all([
    getDocs(teamsCol(code)),
    getDocs(landsCol(code)),
  ])
  const batch = writeBatch(db)
  teamDocs.forEach((d) => batch.delete(d.ref))
  landDocs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  await deleteDoc(roomRef(code))
}
