# Build Week status

## Submission alignment (2026-07-22)

The submission story now follows the implemented vertical slice: character creation -> route command center -> TERRA forest exploration -> resource collection -> project contribution and LUNA progress. Server implementation is not part of this slice; Firebase authentication, live multiplayer presence, cloud persistence, server validation, and the full real-life mission loop are planning items only and must not be presented as completed in the demo video.

See the revised submission brief and recording package:

- `docs/build-week/SUBMISSION-BRIEF.md`

- Added the first TERRA forest 2.5D exploration prototype: route entry, depth-sorted player/trees, swaying vegetation, keyboard controls, resource collection, and route return are connected without adding a rendering dependency.
- Replaced the abstract perspective test art with a generated clean-HD quarter-view RPG map pipeline: ground base, dressed planning reference, transparent animated tree prop, and explicit walk/collision metadata are now stored separately.
- Replaced the fixed forest backdrop with a lazy-loaded Three.js field: a large low-poly watercolor environment, orthographic player-follow camera, instanced flowers, swaying trees, path landmarks, collectible signal, and the existing character sheet rendered as a 3D sprite.

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
- Character creation now exposes four explicit glassmorphism preset cards: male/female × cute/composed, each showing a down-facing front frame and the active 4-direction walk/F-interaction contract
- All eight direction cells are wired to the movement layer; the center atlas cell is intentionally empty and diagonal directions no longer fall back to cardinals
- All four character presets now use v5 4x4 walk and hand-reach sprite sheets; `F` triggers the four-frame interaction sequence and the map terminal button/fallback action remains removed.
- The forest exploration prototype now crops those v5 sheets as 4×4 frames, so its visible player is a single correctly oriented character rather than the full sheet preview.
- Forest movement now runs continuously while input is held, supports eight keyboard/D-pad directions with normalized diagonals, and cycles the four walk frames at 120ms; diagonal visuals use the nearest cardinal pose because the active v5 sheets are 4-direction assets.
- The earlier `terra-explorer-v2` layer pass, v3 atlas, and v4 female-cute sheets remain as reference/QC history only; the v5 four-preset sheets are the active runtime path.

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
- Dedicated mining/woodcutting skill FX remain optional follow-up work; the active silver-braid v15 set now includes 4-direction Idle/Walk/Run/Interaction sheets, while diagonal input maps to the nearest cardinal pose.

## Evidence to retain

- Codex session and `/feedback` session ID
- Timestamped implementation commits
- Important implementation prompts and decisions
- Test commands and observed results
- Known limitations and rejected scope

## Character asset generation checkpoint

- Generated and QC-processed `female-cute` 4-direction 4x4 walk and hand-reach interaction sheets under `public/assets/sprites/terra-explorer-v4/female-cute/`.
- The v4 `female-cute` sheets remain as reference/QC history; the v5 set is now the active runtime after visual approval.
- Generated and QC-processed v5 `male-cute`, `male-composed`, `female-cute`, and `female-composed` 4-direction walk plus hand-reach interaction sheets under `public/assets/sprites/terra-explorer-v5/`.
- Each v5 sheet is 1024x1024 RGBA with sixteen 256px cells, 256px frame size, shared feet alignment, transparent corners, and direction strips/GIFs for walk sheets.
- Generated and QC-processed v6 `male-composed` 4-direction walk and idle sheets under `public/assets/sprites/terra-explorer-v6/male-composed/`. Both are 4x4 sheets with 256px cells, hands relaxed at the sides, transparent backgrounds, shared feet alignment, and are staged as runtime-independent candidates.
- Generated and connected the v6 `male-composed` 4-direction interaction sheet under `public/assets/sprites/terra-explorer-v6/male-composed/interaction-4x4/`; the forest prototype now plays the one-hand reach sequence on F and uses the v6 idle sheet while stationary.
- Generated a concept-only female-composed v6 candidate at `public/assets/concepts/terra-explorer/female-composed-v6-concept.png`; sprite generation and runtime connection are intentionally waiting for visual approval.
- Generated v9 male/female 4-direction walk candidates under `public/assets/sprites/terra-explorer-v9/` with low-contact crossed-leg passing phases and no high-knee pose; female activation remains pending user approval.
- Connected male-composed v9 walk only; v6 idle and interaction remain active for that preset. Generated female-composed v10 under `public/assets/sprites/terra-explorer-v10/` from the blonde pixel face reference, pending visual approval.
- Refined the female pastel pixel concept into `public/assets/concepts/terra-explorer/female-pastel-pixel-concept-v2.png` with shoulder-length hair and a softer dreamy gaze; no runtime changes.
- Generated and processed female-composed v12 idle and interaction sheets from the approved blonde 4-direction walk design; idle is planted-foot breathing and interaction is a one-hand reach sequence. Staged only under `public/assets/sprites/terra-explorer-v12/`; runtime routing remains unchanged pending visual approval.
- Connected latest composed motion sets: male uses v9 walk with v6 idle/interaction, female uses v10 walk with v12 idle/interaction. TerraCanvas now switches between idle, walk, and F interaction by action state; cute presets remain on v5.
- Generated and QC-processed silver-braid v15 4-direction Idle/Walk/Run/Interaction sheets under `public/assets/sprites/terra-explorer-v15/female-silver-braid/`; the discarded v14 8x4 set was removed, and all four rows now use straight front, left, right, and back views.

- Added a development-only TERRA level editor with GLB upload, asset placement, transform gizmos, numeric inspection, delete, undo/redo, JSON import/export, and direct forest-level saving through a localhost-only companion server.

## 멀티맵·지형 브러시 제작기

- `terra-forest.json`과 `terra-plaza.json`을 독립적으로 선택·저장하는 개발 전용 멀티맵 편집기를 구현했습니다.
- 기본 32×32 높이필드에서 브러시 크기·강도를 조절해 잔디·길·흙·바위를 칠하고 지형을 올리거나 낮출 수 있습니다. 셀 높이는 런타임에서 인접 지점 사이를 보간해 경사로 표시됩니다.
- 재질마다 상부 색상과 측면 색상을 따로 저장해 솟은 지형의 단면 색상을 분리했습니다. 사용자 색상 편집, 맵 크기·높이 범위 조절도 지원합니다.
- 수동 벽 조각, GLB 오브젝트 배치·변환·삭제, JSON 가져오기·내보내기, 실행 취소·다시 실행을 유지합니다. 벽·경사로 배치는 주변 오브젝트를 자동 결합하지 않고 격자 위치만 정렬합니다.
- 입력을 분리했습니다. 좌클릭은 선택·브러시·기즈모, 우클릭은 카메라 회전, 중클릭은 카메라 이동, 휠은 확대·축소입니다. 오브젝트 루트와 카메라 컨트롤을 분리해 함께 움직이던 문제를 수정했습니다.
- 런타임은 저장된 지형·벽을 사용하고 지형 높이, 블록, 경사로, 지형 경계를 이동 제한에 반영합니다. 2D 캐릭터 스프라이트는 시각 표현만 담당하고 충돌은 레벨 좌표 판정으로 처리합니다. 기존 버전 1 숲 JSON은 기본 잔디 지형으로 자동 변환됩니다.
- 기존 나무 에셋과 런타임 절차형 나무를 제거했습니다. 테라 숲은 새 맵 상태로 초기화했고, 준비된 GLB는 레벨 에디터에서 필요할 때 배치합니다.

### 이 슬라이스 검증

- `npm test` 통과
- `npm run build` 통과
- `node --check tools/level-editor/server.mjs` 통과
- 브라우저 최소 확인: 레벨 제작기 렌더링, 숲·광장 맵 전환, 경사로·블록 도구 노출

### 알려진 제한

- 현재 런타임 레벨 JSON은 빌드 시 번들됩니다. 에디터에서 저장한 지형을 게임 화면에 반영하려면 개발 서버의 재빌드 또는 재로드가 필요합니다.
- `npx tsc --noEmit`에는 기존 Cloudflare Worker 전역 타입(`Fetcher`, `D1Database`, `cloudflare:workers`) 오류가 남아 있으며 이번 변경과 무관합니다.

### 최근 광장 활동 피드

- 수집된 숲 오브젝트는 화면에서 사라질 때 동일한 ID가 이동 충돌 검사에서도 제외됩니다.
- 광장 뉴스는 5.6초 간격으로 제한된 목록에서 새 소식을 추가하고, 전체 채팅은 4.8초 간격으로 자동 교신을 추가합니다. 두 목록 모두 길이를 제한해 로컬 메모리가 계속 증가하지 않습니다.

### 미션 갱신과 언어 전환

- 미션 자동 추가·만료를 제거해 카드 목록은 사용자가 미션 받기 또는 리롤을 눌렀을 때만 변경됩니다.
- 영어 모드에서 사전 정의 미션 카드와 기본 신호 기록의 제목·설명·상태·보상·기록 문구를 번역합니다.

### 명령 센터 영어 전환과 채팅 참가자

- 영어 모드에서 항로 행성 상태, 광장 뉴스·시간대 테스트, 공동건설 자원·기여 패널의 사전 문구를 추가로 번역합니다.
- 채팅의 비시스템 참가자는 `대원_01` 형식으로 표시하고, 영어 모드에서는 시스템 발신자를 `CONTROLLER`로 표시합니다. 초기·자동 채팅에도 영어 본문을 제공합니다.
