import { LAND_COUNT, LAND_STATUS, TEAM_COLORS } from '../lib/constants'

// 4×4 보드 (PRD 4.1-4 / 4.2-3)
// 낙찰 땅: 모둠 색 배경 + 알파벳이 칸을 크게 채움 (TV 원거리 식별)
// props:
//  lands: { 1: {owner, status, ...}, ... }
//  currentLand: 현재 경매 땅 번호
//  onLandClick: (n) => void  (종료 화면에서 입찰 상세 열람)
//  highlightLine: number[]   (빙고 줄 강조)
export default function Board({ lands, currentLand, onLandClick, highlightLine }) {
  const highlight = new Set(highlightLine || [])

  return (
    <div className="board">
      {Array.from({ length: LAND_COUNT }, (_, i) => i + 1).map((n) => {
        const land = lands?.[n] || {}
        const owner = land.owner
        const color = owner ? TEAM_COLORS[owner] : null
        const isCurrent = n === currentLand && land.status === LAND_STATUS.BIDDING
        const isPassed = land.status === LAND_STATUS.PASSED
        const inBingo = highlight.has(n)

        const style = color
          ? { background: color.bg, color: color.text }
          : undefined

        const classNames = [
          'cell',
          isCurrent && 'cell--current',
          owner && 'cell--owned',
          isPassed && 'cell--passed',
          inBingo && 'cell--bingo',
          onLandClick && 'cell--clickable',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={n}
            className={classNames}
            style={style}
            onClick={onLandClick ? () => onLandClick(n) : undefined}
            disabled={!onLandClick}
            type="button"
          >
            {owner ? (
              <span className="cell__team">{owner}</span>
            ) : (
              <span className="cell__num">{n}</span>
            )}
            {isPassed && <span className="cell__passed">유찰</span>}
          </button>
        )
      })}
    </div>
  )
}
