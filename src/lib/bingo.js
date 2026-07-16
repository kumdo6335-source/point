// 빙고 판정 (PRD 3.3) — 4×4, 땅 번호 1~16
//
// 보드 배치 (행 우선):
//   1  2  3  4
//   5  6  7  8
//   9 10 11 12
//  13 14 15 16
//
// 10줄: 가로 4 + 세로 4 + 대각선 2

export const BINGO_LINES = [
  // 가로
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  // 세로
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [4, 8, 12, 16],
  // 대각선
  [1, 6, 11, 16],
  [4, 7, 10, 13],
]

/**
 * 한 모둠이 소유한 땅 목록으로 완성된 빙고 줄이 있는지 검사
 * @param {number[]} ownedLands  소유 땅 번호 배열
 * @returns {number[]|null}  완성된 첫 빙고 줄(땅 번호 배열) 또는 null
 */
export function findBingoLine(ownedLands) {
  const owned = new Set(ownedLands.map(Number))
  for (const line of BINGO_LINES) {
    if (line.every((land) => owned.has(land))) {
      return line
    }
  }
  return null
}

export function hasBingo(ownedLands) {
  return findBingoLine(ownedLands) !== null
}
