// 숫자 키패드 (PRD 4.2-3) — 큰 터치 타깃
export default function NumberPad({ value, onChange, max }) {
  const press = (digit) => {
    const next = value === '0' ? digit : value + digit
    // 앞자리 0 방지 + 최대 3자리(잔여 포인트 최대 100대) 제한
    const cleaned = next.replace(/^0+(?=\d)/, '').slice(0, 3)
    if (max != null && Number(cleaned) > max) {
      onChange(String(max))
    } else {
      onChange(cleaned)
    }
  }

  const backspace = () => {
    const next = value.slice(0, -1)
    onChange(next === '' ? '0' : next)
  }

  const clear = () => onChange('0')

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="numpad">
      {keys.map((k) => (
        <button key={k} className="numpad__key" onClick={() => press(k)} type="button">
          {k}
        </button>
      ))}
      <button className="numpad__key numpad__key--fn" onClick={clear} type="button">
        C
      </button>
      <button className="numpad__key" onClick={() => press('0')} type="button">
        0
      </button>
      <button className="numpad__key numpad__key--fn" onClick={backspace} type="button">
        ⌫
      </button>
    </div>
  )
}
