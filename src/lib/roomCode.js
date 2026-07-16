// 방코드 생성 — 혼동되는 문자(0/O, 1/I 등) 제외한 6자리
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(length = 6) {
  let code = ''
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  for (let i = 0; i < length; i++) {
    code += ALPHABET[arr[i] % ALPHABET.length]
  }
  return code
}

export function normalizeRoomCode(input) {
  return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim()
}
