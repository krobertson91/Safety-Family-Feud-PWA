# Host Visible Answers and Cue Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make host answers visible before reveal and add printable 4x6 cue-card export.

**Architecture:** Keep the audience reveal state unchanged. Change only host card front rendering so the host sees answer text and points, then add a print-document generator that opens a 4x6 cue-card view in a new window. Extend the existing Playwright smoke test to prove the host/audience split and print export.

**Tech Stack:** Plain HTML, CSS, JavaScript, Playwright smoke tests, GitHub Pages static hosting.

---

### Task 1: Failing Smoke Coverage

**Files:**
- Modify: `tests/smoke-event-ready.cjs`

- [ ] **Step 1: Add host/audience assertions**

Assert that host answer card 1 shows `Wet floor` and `35` before reveal, while audience answer card 1 still shows `HIDDEN`.

- [ ] **Step 2: Add cue-card export assertion**

Assert that `#btnPrintCueCards` exists, opens a print window, and the print document contains `@page { size: 4in 6in; }`, the current question, `Wet floor`, and `35`.

- [ ] **Step 3: Run red**

Run `node tests/run-smoke.cjs`.

Expected: FAIL because the host front still says `HIDDEN` and `#btnPrintCueCards` does not exist.

### Task 2: Host Visible Answers

**Files:**
- Modify: `app.js`
- Modify: `style.css`

- [ ] **Step 1: Render host card fronts with answer text and points**

Change `renderRound()` so the host-facing front contains the real answer text and points.

- [ ] **Step 2: Keep reveal state visually marked**

Keep the existing `.revealed` class behavior, and add a subtle marker through text/class if needed.

- [ ] **Step 3: Run green for host behavior**

Run `node tests/run-smoke.cjs`.

Expected: remaining failure is cue-card export.

### Task 3: 4x6 Cue-Card Export

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `style.css`
- Modify: `README.md`

- [ ] **Step 1: Add buttons**

Add `#btnPrintCueCards` on the start screen and `#btnEditorPrintCueCards` in the editor header.

- [ ] **Step 2: Generate print document**

Implement `printCueCards(sourceData)` to open a window with 4x6 print CSS and one card per round.

- [ ] **Step 3: Wire buttons**

Start-screen button prints the active saved game. Editor button commits current fields, validates the draft, and prints the draft.

- [ ] **Step 4: Update README**

Document the cue-card print option.

- [ ] **Step 5: Run full green**

Run `node tests/run-smoke.cjs`.

Expected: PASS.
