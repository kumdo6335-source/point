// 낙찰 판정 (PRD 3.2)
//
// 규칙:
//  1. 단독 최고액 모둠이 낙찰
//  2. 최고액 동점 시 해당 모둠들 모두 탈락, 다음(더 낮은) 금액으로 내려가
//     단독 모둠 탐색 — 연쇄 적용
//  3. 어느 금액대에도 단독 모둠이 없거나 전원 0이면 유찰
//  4. 0포인트 제출 = 미투자 (낙찰 후보에서 제외)
//
// bids: { A: 30, B: 30, C: 20, ... }  (key가 있으면 제출한 것, 값은 입찰액)
//        미제출 모둠은 key가 없거나, 강제마감 시 0으로 간주

/**
 * @param {Record<string, number>} bids  모둠별 입찰액 (제출한 모둠만)
 * @returns {{ winner: string|null, amount: number, passed: boolean }}
 */
export function judgeAuction(bids) {
  // 0 초과 입찰만 후보 (0 = 미투자)
  const positive = Object.entries(bids).filter(([, v]) => Number(v) > 0)

  if (positive.length === 0) {
    return { winner: null, amount: 0, passed: true } // 전원 0 → 유찰
  }

  // 금액별로 모둠 묶기
  const byAmount = new Map()
  for (const [team, amount] of positive) {
    const a = Number(amount)
    if (!byAmount.has(a)) byAmount.set(a, [])
    byAmount.get(a).push(team)
  }

  // 높은 금액부터 내려가며 단독 모둠 탐색 (연쇄)
  const amountsDesc = [...byAmount.keys()].sort((x, y) => y - x)
  for (const amount of amountsDesc) {
    const teams = byAmount.get(amount)
    if (teams.length === 1) {
      return { winner: teams[0], amount, passed: false }
    }
    // 동점 → 해당 금액 모둠 모두 탈락, 다음 금액으로
  }

  // 어느 금액대에도 단독 모둠 없음 → 유찰
  return { winner: null, amount: 0, passed: true }
}
