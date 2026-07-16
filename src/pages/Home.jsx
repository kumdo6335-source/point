import { useNavigate } from 'react-router-dom'
import { getHostSession, getPlaySession } from '../lib/session'

export default function Home() {
  const navigate = useNavigate()
  const host = getHostSession()
  const play = getPlaySession()

  return (
    <div className="screen screen--center home">
      <h1 className="home__title">
        <span className="home__emoji">🏆</span>
        포인트 경매
      </h1>
      <p className="home__subtitle">모둠별 100포인트로 16개 땅을 경매하는 교실 게임</p>

      <div className="home__roles">
        <button
          className="rolecard rolecard--teacher"
          onClick={() => navigate('/host')}
          type="button"
        >
          <span className="rolecard__icon">🖥️</span>
          <span className="rolecard__label">교사 (호스트)</span>
          <span className="rolecard__desc">방을 만들고 경매를 진행합니다</span>
        </button>

        <button
          className="rolecard rolecard--student"
          onClick={() => navigate('/play')}
          type="button"
        >
          <span className="rolecard__icon">📱</span>
          <span className="rolecard__label">모둠 (학생)</span>
          <span className="rolecard__desc">방코드로 입장해 입찰합니다</span>
        </button>
      </div>

      {(host || play) && (
        <div className="home__resume">
          {host && (
            <button className="btn btn--ghost" onClick={() => navigate(`/host/${host}`)}>
              진행 중이던 방으로 돌아가기 · {host}
            </button>
          )}
          {play && (
            <button
              className="btn btn--ghost"
              onClick={() => navigate(`/play/${play.code}/${play.teamId}`)}
            >
              {play.code} · {play.teamId}모둠으로 재접속
            </button>
          )}
        </div>
      )}
    </div>
  )
}
