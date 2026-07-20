# Build Week status

- Latest UI verification: start title movement, explicit position lock, reload persistence, and six distinct five-second comet phases passed in the in-app browser.
- Title composition is now finalized and its adjustment controls are hidden; the saved position is still loaded on start.

## AI 워크플로우

- 작업 시작 시 README와 이 STATUS 문서를 먼저 확인해 기존 결정과 현재 상태를 이어갑니다.
- 에셋 생성과 프론트 구현처럼 독립적인 작업은 세션을 분리해 병렬로 진행할 수 있습니다.
- 사용자가 프론트 결과를 바로 확인할 수 있는 작업은 브라우저 검증을 기본 단계에서 생략하고, 소스 테스트·관련 린트·빌드로 빠르게 확인합니다.
- 사용자가 기능이 안 된다고 제보하거나 브라우저 검증을 요청했을 때만 해당 기능의 최소 재현 경로를 브라우저에서 확인합니다.
- 따라서 작업 사이클은 `구현 → 빠른 정적/소스 검사 → 사용자 확인 → 문제 제보 시 집중 브라우저 검증` 순서로 운영합니다.

## Product facts

- Project: FIRST LIGHT: TERRA
- Track: Apps for Your Life
- Primary audience: 작은 행동을 시작하고 싶은 개인
- Primary use case: 작은 현실 행동과 저압적인 사람 사이의 연결을 공동 세계의 변화로 경험
- Current repository: `https://github.com/Ije08/Terra.git`

## Implemented in this slice

- START → 공용 LOADING(로그인/계정 생성) → CHARACTER_CREATE 또는 COMMAND → 공용 LOADING(TERRA 진입) → PLAZA screen flow
- 시작 화면의 단일 `테라 접속` 행동과 인증 패널 내부 계정 생성 탭
- 제공된 CSS 효과를 재구성한 반복 별빛과 28초 주기의 빠른 단일 혜성
- CodePen 레퍼런스를 FIRST LIGHT 스타일로 재해석한 로그인·계정 생성 전환 패널과 비밀번호 표시/확인 UI
- Codex Sites용 선택적 `Sign in with ChatGPT` 진입 및 인증 사용자 확인 API (`NEXT_PUBLIC_CHATGPT_AUTH_ENABLED`로 활성화)
- 로그인 시 localStorage 캐릭터 프로필 존재 여부에 따른 캐릭터 생성 스킵
- Local character profile creation and validation
- Orbit layer/effect 제거
- Canvas movement and obstacle collision
- TERRA layered render order in code
- Local resource collection and LUNA progress
- Exploration terminal content promoted into the full-screen main command menu
- Route-first command shell with readable route, comms, outpost, and operation navigation
- Explicit TERRA entry action prevents gameplay from starting immediately after authentication
- Full-bleed layered route art with click-triggered planet detail overlay and persistent readable global chat
- Korean-only primary navigation, custom SVG resource counters, and `L / 신입대원 / 닉네임` profile treatment
- MMORPG-style shared chat with all/local/system filters, presence count, timestamped messages, channel colors, and shared route/comms state
- Wood, iron, signal remnants, and reclaimed parts inventory HUD with shared construction requirements
- Male/female Terra explorer 3×3 direction atlases generated with `generate2dsprite`: cute/composed presets for each gender, 256×256px cells, transparent background, and fixed feet alignment
- Character creation now selects gender plus cute/composed preset, preserves nickname and suit color, and uses the same atlas in profile preview and overworld runtime
- Character creation now exposes four explicit glassmorphism preset cards: male/female × cute/composed, each labeled with its active 8-direction atlas
- All eight direction cells are wired to the movement layer; the center atlas cell is intentionally empty and diagonal directions no longer fall back to cardinals
- Female-cute runtime now uses the v4 4x4 walk and hand-reach sprite sheets; `F` triggers the four-frame interaction sequence, while other presets retain the v3 atlas fallback. The map terminal button and terminal fallback action were removed.
- The earlier `terra-explorer-v2` layer pass and 4×4 composite sheets remain as reference/QC history only; the v3 fixed-preset atlas is the active runtime path

## Verified in this slice

- `npm test`
- `npm run build`
- In-app browser verification: stored-profile login → COMMAND route view → comms view → explicit TERRA entry → PLAZA

## Not yet verified

- Firebase Authentication, Firestore, Realtime Database, Cloud Storage
- 실제 계정 자격 증명 검증과 다중 사용자 프로필 동기화
- 로컬 개발 환경의 ChatGPT OAuth 경로(배포된 Codex Sites 환경에서만 제공)
- Two-browser presence and chat
- Codex Sites deployment
- Public demo video and submission URLs
- Full-repository ESLint remains blocked by pre-existing `setState`-in-effect errors in `TerraCanvas.tsx` and `TerraCanvasLegacy.tsx`
- Independent body/head/hair/clothes paper-doll runtime composition is intentionally out of scope for the current demo slice; it was replaced with four fixed, quality-controlled presets
- Full multi-frame run cycles and dedicated mining/woodcutting skill FX remain optional follow-up work; the female-cute map path now has a 4-direction walk loop and F-key interaction sheet, while diagonal input maps to the nearest cardinal pose.

## Evidence to retain

- Codex session and `/feedback` session ID
- Timestamped implementation commits
- Important implementation prompts and decisions
- Test commands and observed results
- Known limitations and rejected scope

## Character asset generation checkpoint

- Generated and QC-processed `female-cute` 4-direction 4x4 walk and hand-reach interaction sheets under `public/assets/sprites/terra-explorer-v4/female-cute/`.
- Each sheet is 1024x1024 RGBA with sixteen 256px cells; runtime wiring is intentionally deferred until visual approval.
