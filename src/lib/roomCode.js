// 방코드 생성 — 입력하기 쉬운 숫자 4자리 (0000~9999)
export function generateRoomCode(length = 4) {
  let code = ''
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  for (let i = 0; i < length; i++) {
    code += String(arr[i] % 10)
  }
  return code
}

export function normalizeRoomCode(input) {
  return (input || '').replace(/\D/g, '')
}
