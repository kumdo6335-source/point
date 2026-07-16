import { WIN_REASON, TEAM_COLORS } from '../lib/constants'

const REASON_TEXT = {
  [WIN_REASON.BINGO]: '빙고 1줄 완성! 🎉',
  [WIN_REASON.MOST_LANDS]: '가장 많은 땅 확보',
  [WIN_REASON.TIE]: '공동 우승',
}

// 종료 화면 승리 배너 (PRD 4.1-7)
export default function WinnerBanner({ room }) {
  const winners = room.winners || []
  const reason = room.winReason

  if (winners.length === 0) {
    return (
      <div className="winner-banner winner-banner--none">
        <span className="winner-banner__reason">게임 종료 — 땅을 확보한 모둠이 없습니다</span>
      </div>
    )
  }

  return (
    <div className="winner-banner">
      <span className="winner-banner__trophy">🏆</span>
      <div className="winner-banner__teams">
        {winners.map((t) => (
          <span
            key={t}
            className="winner-banner__team"
            style={{ background: TEAM_COLORS[t].bg, color: TEAM_COLORS[t].text }}
          >
            {t}
          </span>
        ))}
      </div>
      <span className="winner-banner__label">
        {winners.length > 1 ? '공동 우승' : `${winners[0]} 모둠 우승`}
      </span>
      <span className="winner-banner__reason">{REASON_TEXT[reason] || ''}</span>
    </div>
  )
}
