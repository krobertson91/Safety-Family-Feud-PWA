# Safety Family Feud Event-Ready Game Editor Design

## Goal

Make Safety Family Feud a reusable, local-first PWA that event hosts can confidently run in two weeks, with simple in-app creation, editing, deleting, saving, importing, exporting, sound checks, and audience-display checks.

## Users

- Primary host: creates or edits the game on the event machine before play.
- Other hosts: use their own copy of the app and manage their own question sets without needing a developer.
- Audience display operator: may open a second window or display, but should not need to edit content.

## Core Approach

Use a local-first game library stored in browser `localStorage`. One game is active at a time. The app includes import/export so hosts can back up, share, and move game packs between machines. No accounts, server, database, or internet dependency is required.

## Game Library

The start screen includes a compact "Game Setup" area:

- Active game selector.
- New Game.
- Duplicate Game.
- Delete Game, with confirmation.
- Import Game Pack.
- Export Active Game.
- Edit Active Game.

Each game has:

- `id`
- `title`
- `updatedAt`
- `rounds`

Each round has:

- `name`
- `question`
- `pointTotal` of `100` or `200`
- `answers`

Each answer has:

- `text`
- `points`

## Editing Experience

The editor remains simple and host-focused:

- Edit game title.
- Add, rename, delete, and reorder rounds.
- Add, edit, and delete answers.
- Keep point totals balanced to 100 for regular rounds and 200 for final rounds.
- Prevent saving incomplete rounds, empty questions, empty answers, and invalid point values.
- Show clear validation messages before the host reaches the game screen.

Save is explicit. Export remains available after successful save.

## Showtime Preflight

Add a preflight panel or modal reachable from the start screen:

- Content check: at least one game, at least one round, no sample placeholders, valid answers.
- Audio check: buttons to test theme, correct-answer sound, and buzzer.
- Audience check: open audience display, verify it receives current game state, and show status.
- Offline/PWA check: service worker supported, registered, and current cache version active.
- Display check: remind host to use landscape/fullscreen and show detected viewport size.

Preflight reports "Ready" only when required checks pass. Audio test is required because browsers block autoplay until user interaction.

## Runtime Reliability

- Load the active game from the game library.
- If old single-game storage exists, migrate it into the new library once.
- If no saved game exists, seed from `data.json` first, then fall back to a built-in starter game.
- Make service worker cache version easy to bump when app files change.
- Avoid stale cached code during development by using a new cache name for this release.
- Keep audience display state synchronized through `BroadcastChannel` and `localStorage`.
- Keep all sounds local in `assets/`.

## Testing

Create a lightweight automated smoke-test harness for the static app:

- Syntax-check JavaScript.
- Serve the folder locally.
- Open host view in Playwright.
- Create/edit/save a game.
- Reveal answers and award points.
- Open audience view and verify state sync.
- Verify audio asset files return successful responses.
- Verify service worker registration.
- Verify import/export round trip.

The app remains static; tests should not require a production build step.

## Out Of Scope

- Cloud syncing.
- User accounts.
- Multiplayer network hosting.
- Online survey collection.
- A full design-system rebuild.
