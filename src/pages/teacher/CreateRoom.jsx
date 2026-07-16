import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../../services/roomService'
import { saveHostSession } from '../../lib/session'
import { isFirebaseConfigured } from '../../firebase'
import {
  MIN_TEAMS,
  MAX_TEAMS,
  DEFAULT_TEAMS,
  activeTeamIds,
  TEAM_COLORS,
} from '../../lib/constants'

export default function CreateRoom() {
  const navigate = useNavigate()
  const [teamCount, setTeamCount] = useState(DEFAULT_TEAMS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setBusy(true)
    setError('')
    try {
      const code = await createRoom(teamCount)
      saveHostSession(code)
      navigate(`/host/${code}`)
    } catch (e) {
      setError(e.message || '방 생성에 실패했습니다.')
      setBusy(false)
    }
  }

  return (
    <div className="screen screen--center">
      <button className="btn btn--ghost back" onClick={() => navigate('/')}>
        ← 처음으로
      </button>
      <h1>방 만들기</h1>

      {!isFirebaseConfigured && (
        <div className="banner banner--warn">
          ⚠️ Firebase 설정이 필요합니다. <code>src/firebase.js</code> 또는 <code>.env</code>에
          프로젝트 구성값을 입력하세요.
        </div>
      )}

      <div className="field">
        <label className="field__label">모둠 수</label>
        <div className="stepper">
          <button
            className="stepper__btn"
            onClick={() => setTeamCount((c) => Math.max(MIN_TEAMS, c - 1))}
            disabled={teamCount <= MIN_TEAMS}
            type="button"
          >
            −
          </button>
          <span className="stepper__value">{teamCount}</span>
          <button
            className="stepper__btn"
            onClick={() => setTeamCount((c) => Math.min(MAX_TEAMS, c + 1))}
            disabled={teamCount >= MAX_TEAMS}
            type="button"
          >
            +
          </button>
        </div>
        <div className="team-preview">
          {activeTeamIds(teamCount).map((t) => (
            <span
              key={t}
              className="team-chip"
              style={{ background: TEAM_COLORS[t].bg, color: TEAM_COLORS[t].text }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {error && <div className="banner banner--error">{error}</div>}

      <button className="btn btn--primary btn--lg" onClick={handleCreate} disabled={busy}>
        {busy ? '생성 중…' : '방 생성하기'}
      </button>
    </div>
  )
}
