// 게임 전역 상수 (PRD 3장·5장 기준)

export const TEAM_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
export const START_POINTS = 100
export const LAND_COUNT = 16
export const BOARD_SIZE = 4 // 4×4

export const MIN_TEAMS = 2
export const MAX_TEAMS = 8
export const DEFAULT_TEAMS = 6

// 데이터 만료(TTL) — 생성 +24h (PRD 5.2)
export const EXPIRE_HOURS = 24

// 방 진행 상태
export const ROOM_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
}

// 땅 상태
export const LAND_STATUS = {
  PENDING: 'pending', // 아직 경매 전
  BIDDING: 'bidding', // 현재 경매 중
  SOLD: 'sold', // 낙찰
  PASSED: 'passed', // 유찰
}

// 승리 사유
export const WIN_REASON = {
  BINGO: 'bingo',
  MOST_LANDS: 'most_lands',
  TIE: 'tie', // 공동 우승
}

// 모둠별 색상 — TV 원거리 식별용, 알파벳 대비 고려
// text: 칸을 채우는 알파벳 글자색
export const TEAM_COLORS = {
  A: { bg: '#E63946', text: '#ffffff', name: '빨강' },
  B: { bg: '#1D6FB8', text: '#ffffff', name: '파랑' },
  C: { bg: '#2A9D8F', text: '#ffffff', name: '청록' },
  D: { bg: '#E9C46A', text: '#1a1a1a', name: '노랑' },
  E: { bg: '#8E44AD', text: '#ffffff', name: '보라' },
  F: { bg: '#E8722C', text: '#ffffff', name: '주황' },
  G: { bg: '#D6336C', text: '#ffffff', name: '분홍' },
  H: { bg: '#2F9E44', text: '#ffffff', name: '초록' },
}

// 설정한 모둠 수만큼 활성 모둠 목록 반환
export function activeTeamIds(teamCount) {
  return TEAM_IDS.slice(0, teamCount)
}
