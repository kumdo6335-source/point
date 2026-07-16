import { useState } from 'react'

// 게임 시작 시 규칙 팝업을 방·브라우저당 1회 표시 (PRD 3.5)
// 새로고침/재접속 시 반복 노출 방지
export function useRulesGate(code) {
  const key = `point-auction:rules-seen:${code}`
  const [seen, setSeen] = useState(() => sessionStorage.getItem(key) === '1')

  const dismiss = () => {
    sessionStorage.setItem(key, '1')
    setSeen(true)
  }

  return [!seen, dismiss]
}
