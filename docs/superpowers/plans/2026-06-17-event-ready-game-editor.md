# Event-Ready Game Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Safety Family Feud event-ready as a reusable local-first PWA with dependable in-app question editing, import/export, preflight checks, and sound verification.

**Architecture:** Keep the app static and dependency-free at runtime. Add a local game-library layer around existing `localStorage`, migrate old single-game data, and expose simple host controls on the start/editor screens. Add a Node/Playwright smoke harness for repeatable verification without changing runtime architecture.

**Tech Stack:** Plain HTML, CSS, JavaScript, PWA service worker, localStorage, BroadcastChannel, Node syntax checks, Playwright smoke tests through `npx -p playwright`.

---

### Task 1: Add Automated Smoke Harness

**Files:**
- Create: `tests/smoke-event-ready.cjs`
- Create: `tests/run-smoke.cjs`

- [ ] **Step 1: Create a static server and Playwright smoke test**

Create `tests/smoke-event-ready.cjs` with a local HTTP server, Edge/Chromium launch, browser console capture, and checks for host, editor, game, audience, service worker, audio assets, import/export, and preflight.

- [ ] **Step 2: Create a test runner**

Create `tests/run-smoke.cjs` to run `node --check app.js`, `node --check service-worker.js`, and `npx -p playwright -c "node tests/smoke-event-ready.cjs"`.

- [ ] **Step 3: Verify red**

Run `node tests/run-smoke.cjs`.

Expected before implementation: FAIL because the new Game Library and Preflight controls do not exist.

### Task 2: Add Game Library Data Layer

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add storage keys and helpers**

Add a versioned library key, active game id key, id generator, game normalization, legacy migration, and `getActiveGame`, `saveActiveGame`, `createGame`, `duplicateActiveGame`, `deleteGame`, `exportGame`, and `importGame` helpers.

- [ ] **Step 2: Load defaults from local library**

Change startup so the app loads the active game from the library, migrates old data once, and seeds with the existing starter game if no library exists.

- [ ] **Step 3: Verify green for data layer**

Run `node --check app.js` and the smoke test. Expected remaining failures are UI controls not existing yet.

### Task 3: Add Start-Screen Library Controls

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `app.js`

- [ ] **Step 1: Add controls**

Add a compact setup panel with active game selector, New, Duplicate, Delete, Import, Export, Edit Active Game, and Preflight buttons.

- [ ] **Step 2: Wire controls**

Populate the selector from the game library, switch active games, export/download JSON, import uploaded JSON, and reset current round state after game changes.

- [ ] **Step 3: Verify**

Run syntax checks and smoke test. Expected remaining failures are preflight details and editor polish.

### Task 4: Harden Editor Behavior

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Save to active game**

Make editor saves update the active game in the library instead of the old single-game key.

- [ ] **Step 2: Add reorder controls**

Add Move Up and Move Down buttons for rounds to make event prep easier without deleting/recreating rounds.

- [ ] **Step 3: Improve validation**

Block empty title, empty questions, empty answer text, invalid points, zero-total rounds, and sample placeholder content when preflight runs.

- [ ] **Step 4: Verify**

Run syntax checks and smoke test.

### Task 5: Add Showtime Preflight

**Files:**
- Modify: `index.html`
- Modify: `style.css`
- Modify: `app.js`

- [ ] **Step 1: Add preflight UI**

Add a modal/panel with Content, Audio, Audience, Offline/PWA, and Display rows.

- [ ] **Step 2: Add audio test buttons**

Add test buttons for theme, correct-answer sound, and buzzer. Mark audio checked when the user successfully triggers all sound buttons.

- [ ] **Step 3: Add status checks**

Show content validity, service worker registration/cache status, audience sync status, viewport dimensions, and overall Ready/Needs Attention state.

- [ ] **Step 4: Verify**

Run syntax checks and smoke test. Manually confirm audio buttons call local audio files.

### Task 6: Service Worker Release Cache

**Files:**
- Modify: `service-worker.js`

- [ ] **Step 1: Bump cache version**

Change cache name to a new event-readiness version.

- [ ] **Step 2: Cache all runtime assets**

Ensure HTML, CSS, JS, manifest, icons, data file, and audio files are cached.

- [ ] **Step 3: Verify**

Run syntax checks and smoke test. Confirm service worker registers under local HTTP.

### Task 7: Final Verification

**Files:**
- Modify: none unless failures are found.

- [ ] **Step 1: Run full verification**

Run `node tests/run-smoke.cjs`.

- [ ] **Step 2: Read output**

Confirm no syntax errors, no browser console errors, no page errors, smoke assertions pass, audio assets are reachable, and service worker registers.

- [ ] **Step 3: Document event operation**

Add a concise host checklist to `README.md` if no README exists.
