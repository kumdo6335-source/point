import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../../hooks/useRoom'
import Board from '../../components/Board'
import RulesModal from '../../components/RulesModal'
import BidDetailModal from '../../components/BidDetailModal'
import WinnerBanner from '../../components/WinnerBanner'
import {
  ROOM_STATUS,
  LAND_STATUS,
  LAND_COUNT,
  TEAM_COLORS,
  activeTeamIds,
} from '../../lib/constants'
import {
  startGame,
  closeAuction,
  nextLand,
  undoLastAuction,
  deleteRoom,
} from '../../services/roomService'
import { clearHostSession } from '../../lib/session'
import { useRulesGate } from '../../hooks/useRulesGate'

export default function TeacherRoom() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { room, teams, lands, loading, notFound } = useRoom(code)

  if (loading) return <div className="screen screen--center">불러오는 중…</div>
  if (notFound)
    return (
      <div className="screen screen--center">
        <p>방을 찾을 수 없습니다. (종료되었거나 삭제됨)</p>
        <button className="btn btn--primary" onClick={() => { clearHostSession(); navigate('/') }}>
          처음으로
        </button>
      </div>
    )

  const activeTeams = activeTeamIds(room.teamCount)

  if (room.status === ROOM_STATUS.WAITING)
    return <Lobby code={code} room={room} teams={teams} activeTeams={activeTeams} navigate={navigate} />

  if (room.status === ROOM_STATUS.FINISHED)
    return <Finished code={code} room={room} teams={teams} lands={lands} activeTeams={activeTeams} navigate={navigate} />

  return <Playing code={code} room={room} teams={teams} lands={lands} activeTeams={activeTeams} />
}

// ── 대기실 ───────────────────────────────────────────────────
function Lobby({ code, room, teams, activeTeams, navigate }) {
  const [busy, setBusy] = useState(false)
  const joinedCount = activeTeams.filter((t) => teams[t]?.connected).length

  return (
    <div className="screen teacher-lobby">
      <button className="btn btn--ghost back" onClick={() => navigate('/')}>← 처음으로</button>
      <h1>대기실</h1>
      <div className="roomcode-display">
        <span className="roomcode-display__label">방코드</span>
        <span className="roomcode-display__code">{code}</span>
      </div>
      <p className="lobby__hint">학생 태블릿에서 <b>모둠 입장 → 방코드 입력</b> 후 모둠을 선택하세요.</p>

      <div className="lobby__teams">
        {activeTeams.map((t) => {
          const joined = teams[t]?.connected
          return (
            <div
              key={t}
              className={`lobby-team ${joined ? 'lobby-team--joined' : ''}`}
              style={joined ? { background: TEAM_COLORS[t].bg, color: TEAM_COLORS[t].text } : undefined}
            >
              <span className="lobby-team__id">{t}</span>
              <span className="lobby-team__status">{joined ? '입장 완료' : '대기 중'}</span>
            </div>
          )
        })}
      </div>

      <button
        className="btn btn--primary btn--lg"
        disabled={busy || joinedCount === 0}
        onClick={async () => { setBusy(true); await startGame(code) }}
      >
        게임 시작 ({joinedCount}/{activeTeams.length} 모둠 입장)
      </button>
    </div>
  )
}

// ── 진행 중 (경매 + 결과 공개) ───────────────────────────────
function Playing({ code, room, teams, lands, activeTeams }) {
  const [showRules, dismissRules] = useRulesGate(code)
  const [busy, setBusy] = useState(false)
  const closingRef = useRef(0)
  const n = room.currentLand
  const land = lands[n] || {}
  const isBidding = room.phase === 'bidding'

  const submitted = activeTeams.filter((t) =>
    Object.prototype.hasOwnProperty.call(land.bids || {}, t)
  )
  const allSubmitted = submitted.length === activeTeams.length

  // 전원 제출 시 자동 마감 (호스트 클라이언트에서만 트리거)
  useEffect(() => {
    if (showRules) return
    if (room.status !== ROOM_STATUS.PLAYING || room.phase !== 'bidding') return
    if (!allSubmitted) {
      closingRef.current = 0 // 새 입찰 라운드(다음 땅/undo 재경매) → 가드 초기화
      return
    }
    if (closingRef.current === n) return // 이미 마감 요청함 (중복 방지)
    closingRef.current = n
    closeAuction(code, { force: false }).catch(() => { closingRef.current = 0 })
  }, [code, n, room.status, room.phase, allSubmitted, showRules])

  if (showRules) return <RulesModal onClose={dismissRules} />

  const winner = land.owner
  const passed = land.status === LAND_STATUS.PASSED

  return (
    <div className="screen teacher-game">
      <header className="game-header">
        <span className="game-header__code">방 {code}</span>
        <span className="game-header__land">{n} / {LAND_COUNT}번 땅</span>
        <span className={`game-header__phase ${isBidding ? '' : 'game-header__phase--reveal'}`}>
          {isBidding ? '입찰 진행 중' : '결과 공개'}
        </span>
      </header>

      <div className="game-body">
        <div className="game-board-wrap">
          <Board lands={lands} currentLand={n} />
        </div>

        <aside className="game-side">
          {isBidding ? (
            <>
              <h2 className="side-title">제출 현황</h2>
              <div className="submit-grid">
                {activeTeams.map((t) => {
                  const done = submitted.includes(t)
                  return (
                    <div key={t} className={`submit-chip ${done ? 'submit-chip--done' : ''}`}>
                      <span className="submit-chip__id" style={{ background: TEAM_COLORS[t].bg, color: TEAM_COLORS[t].text }}>{t}</span>
                      <span className="submit-chip__state">{done ? '제출 완료' : '입력 중…'}</span>
                    </div>
                  )
                })}
              </div>
              <button
                className="btn btn--warn btn--lg"
                disabled={busy}
                onClick={async () => { setBusy(true); await closeAuction(code, { force: true }); setBusy(false) }}
              >
                강제 마감 (미제출 0 처리)
              </button>
              <p className="side-note">{submitted.length}/{activeTeams.length} 모둠 제출 · 전원 제출 시 자동 마감</p>
            </>
          ) : (
            <>
              <h2 className="side-title">경매 결과</h2>
              {passed ? (
                <div className="result-card result-card--passed">
                  <span className="result-card__big">유찰</span>
                  <span className="result-card__sub">{n}번 땅은 주인이 없습니다</span>
                </div>
              ) : (
                <div className="result-card" style={{ background: TEAM_COLORS[winner].bg, color: TEAM_COLORS[winner].text }}>
                  <span className="result-card__big">{winner} 모둠 낙찰</span>
                  <span className="result-card__sub">{n}번 땅 (낙찰가 비공개)</span>
                </div>
              )}
              <button
                className="btn btn--primary btn--lg"
                disabled={busy}
                onClick={async () => { setBusy(true); await nextLand(code); setBusy(false) }}
              >
                {n >= LAND_COUNT ? '결과 보기' : '다음 땅 →'}
              </button>
              <button
                className="btn btn--ghost"
                disabled={busy}
                onClick={async () => { if (confirm('직전 경매를 되돌려 재경매합니다.')) { setBusy(true); await undoLastAuction(code); setBusy(false) } }}
              >
                ↩ 되돌리기 (재경매)
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

// ── 종료 화면 ────────────────────────────────────────────────
function Finished({ code, room, teams, lands, activeTeams, navigate }) {
  const [detailLand, setDetailLand] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleDelete = async () => {
    if (!confirm('게임을 종료하고 모든 방 데이터를 삭제합니다. 되돌릴 수 없습니다.')) return
    setBusy(true)
    await deleteRoom(code)
    clearHostSession()
    navigate('/')
  }

  return (
    <div className="screen teacher-finished">
      <WinnerBanner room={room} />

      <div className="game-body">
        <div className="game-board-wrap">
          <Board lands={lands} highlightLine={room.winLine} onLandClick={(nn) => setDetailLand(nn)} />
          <p className="finished__hint">땅을 클릭하면 모둠별 입찰액을 볼 수 있어요.</p>
        </div>

        <aside className="game-side">
          <h2 className="side-title">최종 현황</h2>
          <div className="standings">
            {activeTeams
              .map((t) => ({ t, ...teams[t] }))
              .sort((a, b) => (b.ownedLands?.length || 0) - (a.ownedLands?.length || 0))
              .map(({ t, points, ownedLands }) => (
                <div key={t} className="standing-row">
                  <span className="standing-row__id" style={{ background: TEAM_COLORS[t].bg, color: TEAM_COLORS[t].text }}>{t}</span>
                  <span className="standing-row__lands">🟩 {ownedLands?.length || 0}칸</span>
                  <span className="standing-row__pts">💰 {points}p</span>
                </div>
              ))}
          </div>
          <button className="btn btn--danger btn--lg" onClick={handleDelete} disabled={busy}>
            게임 종료 · 데이터 삭제
          </button>
        </aside>
      </div>

      {detailLand != null && (
        <BidDetailModal
          landNumber={detailLand}
          land={lands[detailLand]}
          activeTeams={activeTeams}
          onClose={() => setDetailLand(null)}
        />
      )}
    </div>
  )
}
