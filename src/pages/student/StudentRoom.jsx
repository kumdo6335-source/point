import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom } from '../../hooks/useRoom'
import Board from '../../components/Board'
import NumberPad from '../../components/NumberPad'
import RulesModal from '../../components/RulesModal'
import BidDetailModal from '../../components/BidDetailModal'
import WinnerBanner from '../../components/WinnerBanner'
import { useRulesGate } from '../../hooks/useRulesGate'
import { submitBid } from '../../services/roomService'
import { clearPlaySession } from '../../lib/session'
import {
  ROOM_STATUS,
  LAND_STATUS,
  LAND_COUNT,
  TEAM_COLORS,
  activeTeamIds,
} from '../../lib/constants'

export default function StudentRoom() {
  const { code, teamId } = useParams()
  const navigate = useNavigate()
  const { room, teams, lands, loading, notFound } = useRoom(code)

  if (loading) return <div className="screen screen--center">불러오는 중…</div>
  if (notFound)
    return (
      <div className="screen screen--center">
        <p>방이 종료되었습니다. 재미있었나요? 👋</p>
        <button className="btn btn--primary" onClick={() => { clearPlaySession(); navigate('/') }}>처음으로</button>
      </div>
    )

  const me = teams[teamId]
  const color = TEAM_COLORS[teamId]
  const activeTeams = activeTeamIds(room.teamCount)

  if (room.status === ROOM_STATUS.WAITING)
    return (
      <div className="screen screen--center student-wait">
        <div className="myteam-badge" style={{ background: color.bg, color: color.text }}>{teamId}</div>
        <h1>{teamId} 모둠</h1>
        <p className="wait__msg">입장 완료! 교사가 게임을 시작할 때까지 기다려 주세요.</p>
        <div className="wait__spinner" />
      </div>
    )

  if (room.status === ROOM_STATUS.FINISHED)
    return <StudentFinished code={code} room={room} teams={teams} lands={lands} teamId={teamId} activeTeams={activeTeams} navigate={navigate} />

  return <StudentPlaying code={code} room={room} lands={lands} me={me} teamId={teamId} />
}

// ── 진행 중 (입찰 / 결과 대기) ──────────────────────────────
function StudentPlaying({ code, room, lands, me, teamId }) {
  const [showRules, dismissRules] = useRulesGate(code)
  const color = TEAM_COLORS[teamId]
  const n = room.currentLand
  const land = lands[n] || {}
  const points = me?.points ?? 0

  const [value, setValue] = useState('0')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (showRules) return <RulesModal onClose={dismissRules} />

  const alreadySubmitted = Object.prototype.hasOwnProperty.call(land.bids || {}, teamId)
  const isBidding = room.phase === 'bidding'
  const bid = Number(value)
  const overBudget = bid > points

  const handleSubmit = async () => {
    if (overBudget) { setError('잔여 포인트를 초과했습니다.'); return }
    setBusy(true); setError('')
    try {
      await submitBid(code, n, teamId, bid)
      setValue('0')
    } catch (e) {
      setError(e.message || '제출 실패')
    }
    setBusy(false)
  }

  return (
    <div className="screen student-game">
      <header className="student-header" style={{ background: color.bg, color: color.text }}>
        <span className="student-header__team">{teamId} 모둠</span>
        <span className="student-header__land">{n}/{LAND_COUNT}번 땅</span>
        <span className="student-header__points">💰 {points}p</span>
      </header>

      <div className="student-board-wrap">
        <Board lands={lands} currentLand={n} />
      </div>

      <div className="student-action">
        {!isBidding ? (
          <ResultView land={land} n={n} />
        ) : alreadySubmitted ? (
          <div className="submitted-view">
            <span className="submitted-view__check">✓</span>
            <p>제출 완료 — 다른 모둠을 기다리는 중…</p>
            <p className="submitted-view__note">제출한 입찰액은 수정할 수 없어요.</p>
          </div>
        ) : (
          <div className="bid-form">
            <div className={`bid-amount ${overBudget ? 'bid-amount--over' : ''}`}>
              <span className="bid-amount__value">{value}</span>
              <span className="bid-amount__unit">p</span>
            </div>
            {overBudget && <div className="banner banner--error">잔여 {points}p 를 초과했습니다</div>}
            {error && <div className="banner banner--error">{error}</div>}
            <NumberPad value={value} onChange={(v) => { setValue(v); setError('') }} max={points} />
            <button
              className="btn btn--primary btn--xl"
              disabled={busy || overBudget}
              onClick={handleSubmit}
            >
              {bid === 0 ? '0p 제출 (미투자)' : `${bid}p 입찰 제출`}
            </button>
            <p className="bid-form__warn">제출 후에는 수정할 수 없어요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultView({ land, n }) {
  const passed = land.status === LAND_STATUS.PASSED
  const owner = land.owner
  if (passed)
    return (
      <div className="result-card result-card--passed">
        <span className="result-card__big">유찰</span>
        <span className="result-card__sub">{n}번 땅은 주인이 없습니다</span>
      </div>
    )
  return (
    <div className="result-card" style={{ background: TEAM_COLORS[owner]?.bg, color: TEAM_COLORS[owner]?.text }}>
      <span className="result-card__big">{owner} 모둠 낙찰</span>
      <span className="result-card__sub">{n}번 땅 · 잠시 후 다음 땅</span>
    </div>
  )
}

// ── 종료 화면 (읽기 전용, 입찰 내역 열람) ────────────────────
function StudentFinished({ code, room, teams, lands, teamId, activeTeams, navigate }) {
  const [detailLand, setDetailLand] = useState(null)
  const iWon = (room.winners || []).includes(teamId)

  return (
    <div className="screen student-finished">
      <WinnerBanner room={room} />
      {iWon && <p className="student-finished__me">🎉 우리 {teamId} 모둠이 우승했어요!</p>}

      <div className="student-board-wrap">
        <Board lands={lands} highlightLine={room.winLine} onLandClick={(nn) => setDetailLand(nn)} />
        <p className="finished__hint">땅을 클릭하면 모둠별 입찰액을 볼 수 있어요.</p>
      </div>

      <button className="btn btn--ghost" onClick={() => { clearPlaySession(); navigate('/') }}>처음으로</button>

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
