// 규칙 팝업 (PRD 3.5) — 교사·학생 공통
export default function RulesModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal rules">
        <h2>🎯 포인트 경매 규칙</h2>
        <ul className="rules__list">
          <li>모든 모둠은 <b>100포인트</b>로 시작합니다.</li>
          <li>1번부터 16번 땅까지 순서대로 <b>비밀 입찰</b> 경매를 진행합니다.</li>
          <li>다른 모둠의 입찰액과 잔여 포인트는 <b>볼 수 없습니다</b>.</li>
          <li>투자한 포인트는 <b>낙찰 여부와 관계없이 돌려받지 못합니다</b>.</li>
          <li>
            <b>승리 조건</b> — 빙고 1줄(가로·세로·대각선)을 먼저 완성하면 즉시 승리!
            <br />
            끝까지 빙고가 없으면 <b>땅을 가장 많이</b> 가진 모둠 승리 (동수면 공동 우승)
          </li>
        </ul>

        <div className="rules__example">
          <h3>동점 연쇄 규칙 예시</h3>
          <div className="rules__example-bids">
            <span className="chip chip--A">A 30</span>
            <span className="chip chip--B">B 30</span>
            <span className="chip chip--C">C 20</span>
          </div>
          <p>
            A·B가 <b>30으로 동점 → 둘 다 탈락</b>, 다음 금액인 <b>C가 20으로 낙찰</b>!
            <br />
            (최고액이 동점이면 그 모둠들은 모두 탈락하고 다음 금액으로 내려갑니다)
          </p>
        </div>

        <button className="btn btn--primary btn--lg" onClick={onClose} type="button">
          확인했어요
        </button>
      </div>
    </div>
  )
}
