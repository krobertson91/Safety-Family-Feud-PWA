# Host Visible Answers and Cue Card Export Design

## Goal

Make the host view work like a game-show control surface: the host always sees the answers and point values, while the audience display still hides answers until the host reveals them. Add a printable 4x6 cue-card export, one card per round.

## Host View Behavior

- The host board shows every answer text and point value immediately.
- Clicking an answer still performs the existing reveal action:
  - Add answer points to the round total.
  - Play the correct-answer sound.
  - Mark the host card as already sent/revealed.
  - Broadcast the reveal state to the audience display.
- Already revealed host cards should remain visibly marked so the host knows which answers are already on the audience board.
- The audience display continues to show hidden answers until the host clicks a host answer card.

## Cue Card Export

- Add a button labeled **Print Cue Cards** near the game export controls on the start screen and in the editor.
- Cue-card export opens a print-friendly document in a new window.
- Each round prints as a 4x6 card.
- Each card includes:
  - Game title.
  - Round name.
  - Question.
  - Ordered answers with point values.
  - Final-round marker when applicable.
- The print document includes CSS print rules for 4in x 6in cards and page breaks between cards.

## Testing

Update the smoke test to verify:

- Host answer text is visible before reveal.
- Audience answer text is hidden before reveal.
- Clicking a host answer reveals the matching audience answer.
- Print Cue Cards button exists and opens a print document containing the current question, answers, point values, and 4x6 print CSS.

## Out Of Scope

- PDF generation.
- Avery-template-specific layouts.
- Hiding host answers behind an optional toggle.
