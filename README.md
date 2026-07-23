# FIRST LIGHT: TERRA

> A social space-exploration game where small real-world actions and warm human signals build a shared universe.

**FIRST LIGHT: TERRA** is a local-first Build Week prototype about turning small personal actions into visible progress for a shared world.

Players create an explorer, enter TERRA, explore a forest, gather resources, and contribute them to a cooperative restoration project. The broader product direction connects these in-game actions with real-life missions, social encouragement, and progress toward LUNA, SOL, and eventually beyond the solar system.

---

## Current Build

This repository contains the first Build Week P0 vertical slice.

Implemented features include:

- A single **Connect to TERRA** entry action positioned near Earth
- Glassmorphism login and account-creation panels
- Repeating starlight and rare fast-moving comet effects
- Reduced-motion accessibility support
- Shared black loading screens with context-specific messages
- Character creation with:
  - Nickname
  - Male explorer or silver-haired female explorer
  - Suit color
- Quality-checked four-direction character sheets
- Eight-direction input mapped to the nearest four-direction pose
- Idle, walk, run, and interaction animations
- Route Control Room shown after login and character creation
- TERRA selection before entering the playable area
- Three.js-based watercolor-style 3D forest
- Player-following camera
- Separated terrain, paths, environment objects, collectibles, and character rendering
- Basic collision handling
- Wood and stone resource gathering with the `F` interaction key
- Local resource state and TERRA restoration progress
- Full-screen Route Control Room promoted from the original terminal interface
- Plaza, Signal, Project, and Route navigation
- Four-resource HUD
- Cooperative construction panel
- Global communication-style UI

The login, account-creation, and **Continue with ChatGPT** interfaces are implemented, but are hidden in the public demo to reduce friction during evaluation.

The current build runs in local development mode before server integration. Firebase authentication, live multiplayer, cloud persistence, and server-side validation are documented as future work.

Values entered into the local login form are not stored or transmitted. Chat, shared progress, and related social state currently exist only in browser memory.

`Continue with ChatGPT` is enabled on Codex Sites only when:

```env
NEXT_PUBLIC_CHATGPT_AUTH_ENABLED=true
```

---

## Public Demo

[TERRA on Codex Sites](https://terra-openai-build-week.frameone08.chatgpt.site)

The public demo skips the hidden login flow and is designed for direct evaluation.

### Demo Flow

1. Choose a male explorer or silver-haired female explorer.
2. Enter the TERRA Plaza.
3. Review the Plaza, Signal, Project, and Route menus.
4. Enter the TERRA forest.
5. Explore the environment and gather wood and stone.
6. Contribute gathered resources to the restoration Project.
7. Confirm that the contribution is reflected in shared progress toward LUNA.

---

## Product Direction

Online anonymity can make harmful communication easier. Offline, people may hesitate to speak first, offer encouragement, or begin a small positive action.

FIRST LIGHT: TERRA proposes a warmer shared space where small actions remain visible and people can meet without excessive social pressure.

The full product direction is organized around four systems:

### Plaza

A social starting point where players meet, communicate, view community activity, and enter shared experiences.

### Signal

A system connecting small real-world actions with personal records and optional social encouragement.

Examples include stretching, drinking water, looking at the sky, organizing a small space, or preserving a simple observation from daily life.

Signal is not intended to strictly verify or monitor behavior. Its purpose is to preserve a small action as a meaningful signal that can encourage another player.

### Project

A cooperative restoration system where gathered resources become experience, participation feedback, and visible shared progress.

### Route

A planetary progression interface showing TERRA, LUNA, and SOL.

The intended progression is:

```text
Restore TERRA
→ Unlock LUNA
→ Restore the LUNA base
→ Reach SOL
→ Begin an expedition beyond the solar system
```

The final departure beyond SOL represents both humanity moving beyond familiar boundaries and the continued development of human–AI collaboration, including the symbolic arrival of a future GPT-6.

AI does not replace human action or conversation in this world. It preserves records, routes, and shared signals. The players remain the people who create the community.

---

## Running Locally

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

In the local development build:

- Select `Login` or `Create Account`.
- Submit the local prototype form.
- If no character exists, character creation opens after a black transition screen.
- If a character already exists, the Route Control Room opens.
- Select `Enter TERRA` to begin gameplay.

---

## Validation

```bash
npm test
npm run build
```

This repository is based on the `vinext` starter for Codex Sites.

For fast iteration, focused source tests, relevant linting, and production builds are prioritized before full browser-flow verification.

---

## Character and Asset Principles

Generated image assets should not contain embedded text.

Character and animation sheets are created through the `generate2dsprite` workflow. Original generations, cleaned outputs, frames, prompts, and quality-control results are stored together.

The runtime uses fixed presets rather than dynamically combining separate body, head, and clothing layers.

The current submission uses:

- Male explorer
- Silver-haired female explorer
- Four-direction motion sheets
- Separate idle, walk, run, and interaction states
- Eight-direction input mapped to the nearest available pose

Current runtime character assets are stored in:

```text
public/assets/sprites/terra-explorer-v15/
public/assets/sprites/terra-explorer-v17/
```

Earlier v2, v3, and v4 sheets and independent body/head layers remain only as generation and quality-control references.

The map and runtime separate:

```text
ground → path → buildings → props → actors → foreground
```

---

## Development-Only Level Editor

Run the game and level editor separately:

```bash
npm run dev
npm run dev:level-editor
```

Then open:

```text
http://localhost:3000/tools/level-editor
```

The editor supports separate editing for:

- TERRA Forest
- TERRA Residential Plaza
- New `terra-*.json` maps

Main features include:

- 32×32 heightfield terrain
- Grass, path, dirt, and rock painting
- Raise and lower terrain tools
- Separate top and side material colors
- Watercolor-style low-poly slopes
- Terrain size and height-range controls
- Collision wall editing
- GLB object placement
- Undo and redo
- JSON import and export
- Project save workflow

Controls:

- Left click: select or paint
- Right click: rotate
- Middle click: pan
- Mouse wheel: zoom

GLB files are stored in:

```text
public/assets/models/level-editor/
```

Runtime level data is loaded from:

```text
app/game/levels/terra-forest.json
app/game/levels/terra-plaza.json
```

The editor and local save server are development-only tools.

---

## Codex and GPT-5.6 Workflow

Before starting work in a new Codex session, the session reads:

```text
README.md
docs/build-week/STATUS.md
```

This allows each session to understand previous decisions and the current implementation state before continuing.

Independent work is divided across parallel sessions when appropriate.

Examples:

- Asset generation and cleanup
- Front-end and runtime implementation
- Testing and documentation review

For visible front-end changes, the workflow does not repeat the full browser flow by default. It prioritizes:

- Focused source tests
- Relevant linting
- Production builds

Browser verification is used when:

- A feature failure is reported
- A critical flow requires direct validation
- Direct browser reproduction is explicitly requested

This keeps the iteration cycle short:

```text
Implement
→ Run fast checks
→ Review
→ Fix
→ Continue
```

Approximately 99% of the implementation work was completed in collaboration with Codex, using GPT-5.6 to iterate on screen flow, state transitions, exploration systems, character motion, tests, debugging, and documentation.

The project author remained responsible for product direction, feature prioritization, worldbuilding, final decisions, and runtime validation.

Usage records, major decisions, test results, and limitations are documented throughout the implementation process.

---

## Build Week

- **Track:** Apps for Your Life
- **Primary audience:** People who want to begin small positive actions
- **Core demo:** Character selection → TERRA Plaza → TERRA forest exploration → Resource gathering → Project contribution → LUNA progress
- **Platform:** Codex Sites
- **Current build:** Local-first P0 vertical slice

Submission planning and Devpost requirements are documented in:

[`docs/build-week/SUBMISSION-BRIEF.md`](docs/build-week/SUBMISSION-BRIEF.md)

Video scripts and recording checklists are local production materials and are not required repository files.

---

## Next Steps

1. Firebase authentication and persistent profiles
2. Realtime Database presence, global chat, and proximity speech bubbles
3. Firestore-based shared progress and news events
4. Server-validated resource gathering and cooperative construction
5. Photo-based exploration records and gallery features
6. LUNA unlock sequence and expanded Codex Sites deployment

---

## License

Original source code and project-authored documentation are released under the [MIT License](LICENSE).

Pixabay images, generated assets, provided materials, and third-party libraries are not relicensed under MIT and remain subject to their own usage terms.

See [ASSET-LICENSES.md](ASSET-LICENSES.md) for details.
