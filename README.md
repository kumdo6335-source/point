# 🏆 포인트 경매 (Point Auction)

모둠별 100포인트로 4×4 16개 땅을 **비밀 입찰 경매**로 획득, **빙고 1줄** 완성 또는 **최다 땅** 확보로 승리하는 실시간 교실 게임 웹앱.

> PRD: [`point_auction_prd.md`](./point_auction_prd.md) · 스택: React + Vite + Firebase Firestore

## 화면 구성

- **교사(호스트)**: PC → TV 미러링. 방 생성·진행 제어. 원거리 가독성 중심.
- **모둠(학생)**: 모둠당 태블릿 1대(가로). 방코드 입장 → 모둠 선택 → 비밀 입찰.

## 빠른 시작

```bash
npm install
# Firebase 설정 (아래 참고)
npm run dev
```

- 기본 주소: `http://localhost:5173`
- 같은 Wi-Fi의 태블릿에서 접속하려면 PC의 IP로 접속 (예: `http://192.168.0.10:5173`).
  Vite가 `host: true`로 실행되어 터미널에 Network 주소를 표시합니다.

## Firebase 설정

기존 Firebase 프로젝트를 사용합니다. 다음 중 한 가지 방법으로 구성값을 입력하세요.

**방법 A — `.env` (권장, 키를 코드에 남기지 않음)**

```bash
cp .env.example .env
# .env 파일에 Firebase 웹앱 구성값 입력
```

**방법 B — `src/firebase.js` 의 `firebaseConfig` 를 직접 수정**

구성값 위치: Firebase 콘솔 → ⚙️ 프로젝트 설정 → 내 앱 → 웹앱 → **SDK 설정 및 구성**.

### Firebase 콘솔 체크리스트 (PRD 5.3)

- [ ] **Firestore 데이터베이스 활성화** (기존 프로젝트 사용)
- [ ] **보안 규칙 배포** — [`firestore.rules`](./firestore.rules) 내용을 콘솔 → Firestore → 규칙에 붙여넣기
      (방코드 기반 읽기/쓰기 허용, 인증 없음 전제)
- [ ] **TTL 정책 설정** — 콘솔 → Firestore → TTL → 컬렉션 그룹 `rooms`, `teams`, `lands` 각각에 대해
      필드 `expireAt` 기준으로 TTL 정책 추가
      (교사가 종료하지 않고 이탈해도 생성 +24h 후 자동 정리)

> ⚠️ 인증이 없으므로 **방코드 비밀 유지**가 유일한 접근 통제입니다. 방코드는 6자리 랜덤이며
> 게임 종료 시 즉시 삭제됩니다. (PRD 5.2 이중 삭제 장치)

## 사용 흐름

**교사** — `교사(호스트)` → 모둠 수 설정 → 방 생성 → 방코드를 TV에 표시 →
모둠 입장 확인 후 `게임 시작` → 규칙 팝업 → 1~16번 땅 경매 진행
(`강제 마감` / `다음 땅` / `되돌리기`) → 종료 화면에서 승자·입찰 내역 확인 →
`게임 종료·데이터 삭제`.

**학생** — `모둠(학생)` → 방코드 입력 → 모둠 선택 → 대기 →
땅마다 입찰액 입력·제출(비밀) → 낙찰 결과 확인 → 종료 화면 열람.

## 게임 규칙 (요약)

- 시작 포인트 **100**, 1→16번 땅 순서 **비밀 동시 입찰**, 0포인트 = 미투자.
- **낙찰**: 단독 최고액 모둠. 최고액 동점 시 그 모둠들 모두 탈락하고 다음 금액으로 내려가
  단독 모둠 탐색(연쇄). 어느 금액대에도 단독이 없으면 **유찰**.
- 투자 포인트는 낙찰 여부와 무관하게 **전액 소멸**(환불 없음).
- **승리**: 빙고 1줄(가로 4·세로 4·대각선 2 = 10줄) 완성 즉시 승리. 없으면 최다 땅, 동수면 공동 우승.

## 프로젝트 구조

```
src/
├─ firebase.js              Firebase 초기화 + 구성 placeholder
├─ App.jsx / main.jsx       라우팅·엔트리
├─ lib/
│  ├─ constants.js          팀·포인트·상태·색상 상수
│  ├─ roomCode.js           방코드 생성/정규화
│  ├─ auction.js            낙찰 판정 (동점 연쇄) — PRD 3.2
│  ├─ bingo.js              빙고 10줄 판정 — PRD 3.3
│  └─ session.js            재접속용 로컬 세션(clientId 등)
├─ services/roomService.js  Firestore CRUD + 트랜잭션(마감·undo·삭제)
├─ hooks/
│  ├─ useRoom.js            room/teams/lands 실시간 구독(onSnapshot)
│  └─ useRulesGate.js       규칙 팝업 1회 표시
├─ components/              Board · RulesModal · NumberPad · BidDetailModal · WinnerBanner
└─ pages/
   ├─ Home.jsx
   ├─ teacher/              CreateRoom · TeacherRoom(대기실·경매·종료)
   └─ student/              JoinRoom · StudentRoom(대기·입찰·종료)
```

## 데이터 모델 (Firestore)

```
rooms/{roomCode}
  { teamCount, status, phase, currentLand, winners[], winReason, winLine, history, expireAt }
  ├ teams/{A~H}   { points, ownedLands[], connected, clientId, expireAt }
  └ lands/{1~16}  { owner, bids{A:30,...}, status, winningAmount, expireAt }
```

낙찰 판정·포인트 차감·땅 배정은 Firestore **트랜잭션**으로 원자 처리됩니다. (PRD 5장)

## 빌드

```bash
npm run build     # dist/ 생성
npm run preview   # 프로덕션 빌드 미리보기
```
