import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../../hooks/useRoom'
import { roomExists, claimTeam } from '../../services/roomService'
import { normalizeRoomCode } from '../../lib/roomCode'
import { getClientId, savePlaySession } from '../../lib/session'
import { activeTeamIds, TEAM_COLORS, ROOM_STATUS } from '../../lib/constants'

export default function JoinRoom() {
  const navigate = useNavigate()
  const [step, setStep] = useState('code') // code | team
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const checkCode = async () => {
    const c = normalizeRoomCode(code)
    if (c.length < 4) { setError('방코드를 확인해 주세요.'); return }
    setBusy(true); setError('')
    try {
      const exists = await roomExists(c)
      if (!exists) { setError('존재하지 않는 방코드입니다.'); setBusy(false); return }
      setCode(c)
      setStep('team')
    } catch (e) {
      setError(e.message || '오류가 발생했습니다.')
    }
    setBusy(false)
  }

  if (step === 'team') return <TeamSelect code={code} navigate={navigate} onBack={() => setStep('code')} />

  return (
    <div className="screen screen--center student-join">
      <button className="btn btn--ghost back" onClick={() => navigate('/')}>← 처음으로</button>
      <h1>모둠 입장</h1>
      <div className="field">
        <label className="field__label">방코드</label>
        <input
          className="code-input"
          value={code}
          onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
          placeholder="예: 1234"
          maxLength={4}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && checkCode()}
        />
      </div>
      {error && <div className="banner banner--error">{error}</div>}
      <button className="btn btn--primary btn--lg" onClick={checkCode} disabled={busy}>
        {busy ? '확인 중…' : '다음'}
      </button>
    </div>
  )
}

// ── 모둠 선택 ────────────────────────────────────────────────
function TeamSelect({ code, navigate, onBack }) {
  const { room, teams, loading, notFound } = useRoom(code)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <div className="screen screen--center">불러오는 중…</div>
  if (notFound) return (
    <div className="screen screen--center">
      <p>방이 종료되었습니다.</p>
      <button className="btn btn--primary" onClick={() => navigate('/')}>처음으로</button>
    </div>
  )

  const activeTeams = activeTeamIds(room.teamCount)
  const started = room.status !== ROOM_STATUS.WAITING

  const pick = async (t) => {
    setBusy(true); setError('')
    try {
      await claimTeam(code, t, getClientId())
      savePlaySession(code, t)
      navigate(`/play/${code}/${t}`)
    } catch (e) {
      setError(e.message || '선택할 수 없습니다.')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--center student-teamselect">
      <button className="btn btn--ghost back" onClick={onBack}>← 방코드</button>
      <h1>모둠 선택</h1>
      <p className="teamselect__code">방 {code}</p>
      {started && <div className="banner banner--warn">이미 게임이 시작되었습니다. 참여 중인 모둠으로만 재접속하세요.</div>}

      <div className="teamselect__grid">
        {activeTeams.map((t) => {
          const taken = teams[t]?.connected
          return (
            <button
              key={t}
              className={`teamselect__card ${taken ? 'teamselect__card--taken' : ''}`}
              style={{ background: TEAM_COLORS[t].bg, color: TEAM_COLORS[t].text }}
              disabled={busy || (taken && !started)}
              onClick={() => pick(t)}
            >
              <span className="teamselect__id">{t}</span>
              {taken && <span className="teamselect__taken">{started ? '재접속' : '선택됨'}</span>}
            </button>
          )
        })}
      </div>
      {error && <div className="banner banner--error">{error}</div>}
    </div>
  )
}
