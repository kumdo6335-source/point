// 재접속 복원용 로컬 세션 (PRD 4.1/4.2 새로고침·이탈 시 복원)

const CLIENT_ID_KEY = 'point-auction:clientId'
const HOST_KEY = 'point-auction:host' // 교사가 호스팅 중인 방코드
const PLAY_KEY = 'point-auction:play' // 학생 { code, teamId }

// 브라우저별 고유 clientId — 모둠 선점/재접속 식별
export function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

export function saveHostSession(code) {
  localStorage.setItem(HOST_KEY, code)
}
export function getHostSession() {
  return localStorage.getItem(HOST_KEY)
}
export function clearHostSession() {
  localStorage.removeItem(HOST_KEY)
}

export function savePlaySession(code, teamId) {
  localStorage.setItem(PLAY_KEY, JSON.stringify({ code, teamId }))
}
export function getPlaySession() {
  try {
    return JSON.parse(localStorage.getItem(PLAY_KEY) || 'null')
  } catch {
    return null
  }
}
export function clearPlaySession() {
  localStorage.removeItem(PLAY_KEY)
}
