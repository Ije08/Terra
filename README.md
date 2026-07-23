# FIRST LIGHT: TERRA

> A social space-exploration game where small real-world actions and warm human signals build a shared universe.

**FIRST LIGHT: TERRA** is a social space-exploration game that connects meaningful everyday actions with visible progress in a shared world.

Players meet other explorers in the TERRA Plaza, complete small real-life missions, explore the planet, gather resources, and contribute to cooperative restoration projects. Individual actions do not end as private checkmarks or personal rewards. They become signals, records, resources, and shared progress toward LUNA.

The goal is not to have AI replace human actions or conversations. In the world of FIRST LIGHT, AI preserves signals, records, and routes. The players remain the people who create the community and change the world.

---

## The Problem

Many habit-tracking products reduce meaningful actions to private checkmarks. Over time, those actions can begin to feel repetitive or obligatory.

At the same time, online communities can become noisy, competitive, or emotionally exhausting. Anonymity can make harmful communication easier, while people in physical spaces may hesitate to speak first or offer a small act of kindness.

FIRST LIGHT: TERRA connects these problems through one cooperative experience.

- Offer approachable real-life missions.
- Preserve completed actions as meaningful signals.
- Allow players to discover and encourage selected records.
- Connect exploration and resource gathering to visible world restoration.
- Create a social space centered on participation rather than competition.

---

## Product Direction

FIRST LIGHT: TERRA proposes a warm virtual space where small actions remain visible and people can meet without excessive social pressure.

A signal that begins on TERRA can eventually travel through LUNA, reach SOL, and continue beyond the solar system.

AI is not the source of the human signals in this world. It is a narrative and technical system that preserves records, routes, and collective progress. The community itself is created by the players.

---

## Core Experience

The main interface is organized in the following order:

1. **Plaza**
2. **Signal**
3. **Project**
4. **Route**

Each area has a distinct role:

> **Plaza connects people. Signal connects real life to the game. Project turns individual actions into shared progress. Route shows where that progress leads next.**

---

## 1. Plaza

The Plaza is the main social space where active gameplay begins after entering TERRA.

Players can meet other explorers, use chat, view live community news, participate in time-based mini-games, gather resources, and interact with the surrounding environment.

The Plaza is not only a menu hub. It is designed as a shared place where players can feel the presence of others and observe the current state of the community.

### Plaza Features

- Global communication-style chat interface
- Nearby characters and social presence
- Live news showing community activity
- Time-based mini-games
- Signal debris and resource collection
- Environmental interactions
- Access to TERRA exploration areas

In the current prototype, chat, news, visible players, and shared progress are simulated through browser-local state rather than a live multiplayer server.

---

## 2. Signal

Signal is the core social system connecting small real-world actions to the game and to other players.

Players can choose approachable daily missions such as stretching, drinking water, looking at the sky, organizing a small area, or expressing gratitude to someone.

Signal supports two types of mission experiences.

### Private Action Missions

These are lightweight self-reported missions that do not require a photo or external proof.

Examples:

- Stretch for one minute
- Drink a glass of water
- Look at the sky for a moment
- Organize one small area
- Greet or thank someone

These missions remain personal completion records and are not automatically shared.

### Shareable Exploration Records

These missions invite players to preserve an observation or a small visible change.

Examples:

- Today’s sky
- A plant discovered during a walk
- A sign of the changing season
- A space the player organized
- An interesting color or source of light

When a player chooses to share a suitable record, it can appear in the Signal Archive. Other players can discover the record, respond with encouragement, or become motivated to try a similar action.

Signal is not intended to strictly monitor or verify real-world behavior. Its purpose is to preserve an action that might otherwise disappear and turn it into a warm social signal.

That signal can then lead to encouragement from another person and visible progress in the shared game world.

The current local prototype demonstrates mission selection, completion, personal records, and the archive connection flow. Real user-to-user sharing and permanent cloud storage are planned for a future implementation.

---

## 3. Project

Project is the cooperative restoration system that transforms individual activity into shared progress.

Players gather wood, stone, signal fragments, and recycled parts in the Plaza and across TERRA. These resources can then be contributed to shared restoration projects.

### Project Features

- Resource contribution
- Experience rewards
- Participation feedback
- Shared restoration progress
- Growth of common structures
- Connection to LUNA route progress

Even a small contribution affects the shared progress value. This allows players to see that their individual action is part of a larger collective goal.

---

## 4. Route

Route shows the planetary path and the next objective for the community.

The Route interface displays:

- **TERRA**
- **LUNA**
- **SOL**

In the current prototype, only TERRA is playable. LUNA is presented as the next collective objective, and its progress changes in response to missions and resource contributions.

The intended long-term progression is:

```text
Restore TERRA
→ Unlock the route to LUNA
→ Restore the shared LUNA base
→ Reach SOL
→ Begin a new expedition beyond the solar system
```

The complete LUNA and SOL regions and the final ending were not implemented before the Build Week deadline.

In the intended ending, the community eventually reaches SOL and opens a route beyond the solar system.

This final departure has two meanings.

Within the story, it represents humanity moving beyond familiar boundaries and beginning a new expedition into the unknown.

It also serves as a symbolic reference to the next generation of AI, including a future GPT-6, and to the continuing development of collaboration between humans and AI.

---

## Core Gameplay Loop

```text
Meet and participate in the Plaza
→ Choose a real-life mission in Signal
→ Complete a small action
→ Preserve a personal record or share a selected archive entry
→ Explore TERRA and gather resources
→ Contribute resources through Project
→ Receive experience and participation feedback
→ View community progress toward LUNA in Route
→ Return to the Plaza and repeat
```

---

## Demo Flow

1. Select local login or account creation.
2. If no explorer profile exists, create a character by choosing a nickname, gender, chibi style, and suit color.
3. After character creation, enter the Route Control Room.
4. Select TERRA to begin the playable experience.
5. Enter the TERRA Plaza and view chat, live news, time-based mini-games, and environmental activity.
6. Open Signal and select a small real-life mission.
7. Complete the mission and view the personal record and Signal Archive flow.
8. Open Project and review the current cooperative restoration objective.
9. Open Route and view the current states of TERRA, LUNA, and SOL.
10. Enter TERRA’s exploration area.
11. Gather wood, stone, signal fragments, and recycled parts.
12. Return to Project and contribute the gathered resources.
13. View the updated experience, participation feedback, and shared progress.
14. Return to Route and confirm that the contribution is reflected in the community’s progress toward LUNA.

---

## Current Implementation

This repository contains the first Build Week P0 vertical slice as a local-first prototype.

### Entry and Account Flow

- A single TERRA connection action positioned near the lower part of Earth
- Glassmorphism login and account-creation panels
- Repeating starlight effects
- Rare, fast-moving comet effects
- Reduced-motion accessibility support
- Shared black loading screen for login, account creation, and scene transitions
- Context-specific loading messages
- Local login and account-creation flow
- Conditional “Continue with ChatGPT” interface

### Character Creation

- Nickname selection
- Gender selection
- Two chibi styles: `cute` and `composed`
- Suit color selection
- Four fixed character presets:
  - Male / Cute
  - Male / Composed
  - Female / Cute
  - Female / Composed
- Eight-direction movement
- Lightweight code-based walking bounce
- Short reaching-hand overlay for interactions

### Game Runtime

- Route Control Room and TERRA entry flow
- Canvas-based movement
- Basic collision handling
- Multi-layer map rendering
- TERRA Plaza
- TERRA exploration area
- Signal debris collection
- Recycled-part collection
- Wood and stone collection
- Four-resource HUD
- Local shared-signal state
- Local LUNA route progress
- Image and audio asset integration

### Interface and Systems

- Full-screen Route Control Room
- Plaza, Signal, Project, and Route navigation
- Global communication-style chat UI
- Local news feed
- Time-based mini-games
- Daily real-life missions
- Signal Archive connection flow
- Shared construction panel
- Resource contribution
- Experience and participation feedback
- TERRA, LUNA, and SOL route interface

---

## Prototype Scope and Limitations

The current version is a development-mode prototype created before Firebase and real multiplayer integration.

Values entered into the local login form, including email and password fields, are not stored or transmitted externally.

The following currently exist only in browser memory or local state:

- Login state
- Character profile
- Chat messages
- Visible player state
- News events
- Mission records
- Signal Archive records
- Resource values
- Shared restoration progress
- LUNA route progress

The “Continue with ChatGPT” option is enabled on Codex Sites only when the following environment variable is configured:

```env
NEXT_PUBLIC_CHATGPT_AUTH_ENABLED=true
```

The following are documented as future work and are not presented as completed features:

- Firebase Authentication
- Persistent player profiles
- Real multiplayer position synchronization
- Server-backed global chat
- Synchronized proximity speech bubbles
- Cloud persistence
- Server-side resource validation
- Server-side mission validation
- Real user-to-user Signal Archive sharing
- Photo-based exploration records
- Public gallery features
- Fully playable LUNA and SOL regions
- The final expedition beyond the solar system

---

## Running the Project

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in the terminal.

Select login or account creation to open the local prototype account panel.

After submitting the form:

- If no character has been saved, a black transition screen appears before character creation.
- If a character already exists, the player moves directly to the Route Control Room.
- Select **Enter TERRA** in the control room to begin gameplay in the Plaza.

---

## Validation

Run the automated tests:

```bash
npm test
```

After installing dependencies, also run the production build:

```bash
npm run build
```

For fast iteration, focused source tests, linting, type checks, and builds are prioritized before full browser-flow verification.

This repository is based on the `vinext` starter for Codex Sites.

---

## Map and Asset Principles

The map is composed of separate rendering layers.

```text
ground
→ path
→ buildings
→ props
→ actors
→ foreground
```

Generated image assets should not contain text.

Character sprites and animation sheets are produced through the `generate2dsprite` workflow. The following materials are preserved together:

- Original generation
- Cleaned output
- Individual frames
- Generation prompt
- Quality-control results

---

## Character Asset Structure

The runtime does not attempt to dynamically combine independent body layers.

Instead, the game uses fixed chibi presets with verified generation quality and directional alignment.

The four presets are:

```text
male / cute
male / composed
female / cute
female / composed
```

Each preset is stored as a 3×3 directional atlas.

```text
up-left    / up    / up-right
left       / empty / right
down-left  / down  / down-right
```

Each cell is a transparent 256×256 PNG.

Walking is created through directional cell changes and a small code-based bounce. Interactions use a limited reaching-hand overlay to reduce animation scope and production cost.

Current runtime character assets are stored in:

```text
public/assets/sprites/terra-explorer-v3/direction-atlas/processed/
```

The earlier `terra-explorer-v2` body and head layers and the 96px composite sheets remain as generation and quality-control references but are not used by the active runtime.

Suit color selection is preserved in profile state. Future palette application must not damage the verified silhouette or visual quality of the fixed presets.

---

## Codex and GPT-5.6 Workflow

Codex and GPT-5.6 were used throughout the implementation workflow, including:

- Screen flow and state transitions
- Game interface implementation
- Canvas runtime and map structure
- Character movement and collision handling
- Image and audio asset integration
- Signal, Project, and Route state design
- Test creation
- Debugging and issue analysis
- Build and deployment preparation
- Documentation of decisions, limitations, and implementation status

The project author remained responsible for:

- Problem definition
- Feature prioritization
- Worldbuilding
- Game structure
- Final product decisions
- Runtime validation

### Session Continuity

Whenever a new Codex session is opened, it first reads:

```text
README.md
docs/build-week/STATUS.md
```

This allows the new session to understand previous decisions and the current implementation state before continuing.

### Parallel Sessions

Independent tasks can be separated into parallel sessions.

Examples:

- One session prepares and organizes image assets.
- Another session implements the front end and game logic.
- A separate session reviews tests and documentation.

### Fast Validation Rules

The full browser flow is not repeated after every small visual or front-end change.

The workflow prioritizes:

- Focused source tests
- Relevant linting
- Type checks
- Production builds

Browser verification is used when:

- A critical user flow requires direct validation.
- A feature failure has been reported.
- The user explicitly requests browser reproduction.

This maintains a short iteration cycle:

```text
Implement
→ Run fast checks
→ Review the result
→ Fix reported issues
→ Continue implementation
```

---

## Build Week

- **Track:** Apps for Your Life
- **Primary audience:** People who want to begin small positive actions but find it difficult to continue alone
- **Platform:** Codex Sites
- **Current build:** Local-first vertical slice prototype
- **Core demo:** Character creation → TERRA entry → Plaza → Signal → Project → Route → TERRA exploration → Resource contribution → LUNA progress

Codex and GPT-5.6 usage, major product decisions, test results, and current limitations are documented throughout the implementation process.

---

## Next Steps

- Firebase account authentication
- Persistent player profiles
- Realtime Database presence
- Live global chat
- Proximity speech bubbles
- Firestore-based shared progress
- Server-backed news events
- Server-validated resource gathering
- Server-validated cooperative construction
- Real Signal Archive sharing
- Photo-based exploration records
- Public gallery and encouragement reactions
- LUNA unlock sequence
- Playable LUNA and SOL regions
- Final expedition beyond the solar system
- Full Codex Sites deployment and operational validation
