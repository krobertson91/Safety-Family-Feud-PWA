# Safety Family Feud PWA

A local-first Family Feud style game for safety training events.

## Hosted App

Open the shared GitHub Pages version:

https://krobertson91.github.io/Safety-Family-Feud-PWA/

Each person's questions and edits save in their own browser. Use **Export Active Game** to back up or share a game pack.
Use **Print Cue Cards** to print one 4x6 host card per round.

## Event Host Checklist

1. On Windows, double-click:

   ```text
   Start Safety Family Feud.cmd
   ```

   Keep the command window open while using the app.

2. If you prefer the manual command, open the folder in PowerShell and run:

   ```powershell
   python -m http.server 8000
   ```

   Then open `http://localhost:8000`.

3. Use **New Game**, **Duplicate**, **Edit Questions**, **Import Game Pack**, and **Export Active Game** from the start screen to manage each event's questions.

4. Use **Print Cue Cards** to print 4x6 host cards with each round's question, answers, and point values.

5. Before guests arrive, click **Preflight** and check:

   - Content has no sample questions or answers.
   - Theme, correct-answer, and buzzer sounds all play.
   - Audience display opens and shows the live board.
   - Offline/PWA status is registered.
   - The display is landscape/fullscreen.

6. Export the active game pack after editing so you have a backup JSON file.

7. On game day, enter team names, open the audience display, click **Start**, choose the answering team, then use **Correct** to reveal answers or the red **X** to assign strikes.

## Verification

Run the automated smoke test:

```powershell
node tests/run-smoke.cjs
```

The test checks JavaScript syntax, app startup, editing/saving a game, answer reveal, audience display sync, local audio files, sound-test wiring, and service worker registration.
