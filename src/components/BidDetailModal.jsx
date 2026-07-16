import { LAND_STATUS, TEAM_COLORS } from '../lib/constants'

// 종료 후 땅별 입찰 상세 (PRD 3.4 게임 종료 후 공개 / 4.1-7)
export default function BidDetailModal({ landNumber, land, activeTeams, onClose }) {
  const bids = land?.bids || {}
  const owner = land?.owner
  const passed = land?.status === LAND_STATUS.PASSED

  const rows = activeTeams
    .map((t) => ({ t, amount: Number(bids[t] ?? 0) }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal bid-detail" onClick={(e) => e.stopPropagation()}>
        <h2>{landNumber}번 땅 입찰 내역</h2>
        <p className="bid-detail__result">
          {passed ? '유찰 (주인 없음)' : (
            <>
              <span className="bid-detail__owner" style={{ background: TEAM_COLORS[owner]?.bg, color: TEAM_COLORS[owner]?.text }}>{owner}</span>
              모둠 낙찰 · 낙찰가 {land?.winningAmount ?? 0}p
            </>
          )}
        </p>
        <ul className="bid-detail__list">
          {rows.map(({ t, amount }) => (
            <li key={t} className={`bid-detail__row ${t === owner ? 'bid-detail__row--winner' : ''}`}>
              <span className="bid-detail__team" style={{ background: TEAM_COLORS[t].bg, color: TEAM_COLORS[t].text }}>{t}</span>
              <span className="bid-detail__bar-wrap">
                <span className="bid-detail__bar" style={{ width: `${Math.min(100, amount)}%`, background: TEAM_COLORS[t].bg }} />
              </span>
              <span className="bid-detail__amount">{amount === 0 ? '미투자' : `${amount}p`}</span>
            </li>
          ))}
        </ul>
        <button className="btn btn--primary" onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
