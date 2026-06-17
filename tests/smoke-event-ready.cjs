const fs = require("fs");
const http = require("http");
const path = require("path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadPlaywrightFromNpx() {
  try {
    return require("playwright");
  } catch {
    const binPath = process.env.PATH
      .split(path.delimiter)
      .map((entry) => entry.trim())
      .find((entry) => entry.includes("_npx") && entry.endsWith(path.join("node_modules", ".bin")));

    if (!binPath) {
      throw new Error("Could not locate Playwright. Run through `npx -p playwright -c \"node tests/smoke-event-ready.cjs\"`.");
    }

    return require(path.join(path.dirname(binPath), "playwright"));
  }
}

const { chromium } = loadPlaywrightFromNpx();
const root = process.cwd();
const rootLower = path.resolve(root).toLowerCase();
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const relPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.resolve(root, `.${relPath}`);
  const fileLower = filePath.toLowerCase();

  if (fileLower !== rootLower && !fileLower.startsWith(`${rootLower}${path.sep}`)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

async function withBrowser(baseUrl, callback) {
  let browser;
  try {
    try {
      browser = await chromium.launch({ channel: "msedge", headless: true });
    } catch {
      browser = await chromium.launch({ headless: true });
    }

    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    await callback(context);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function expectNoBrowserErrors(logs) {
  const errors = logs.filter((entry) => {
    if (entry.startsWith("console:warning:")) return false;
    return entry.startsWith("console:error:") || entry.startsWith("pageerror:") || entry.startsWith("requestfailed:");
  });

  assert(errors.length === 0, `Browser errors found:\n${errors.join("\n")}`);
}

async function main() {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const logs = [];

  try {
    await withBrowser(baseUrl, async (context) => {
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__playCalls = [];
        window.__pauseCalls = [];
        const originalPlay = window.HTMLMediaElement.prototype.play;
        const originalPause = window.HTMLMediaElement.prototype.pause;
        window.HTMLMediaElement.prototype.play = function playStub() {
          window.__playCalls.push(this.currentSrc || this.src || "");
          return Promise.resolve();
        };
        window.HTMLMediaElement.prototype.pause = function pauseStub() {
          window.__pauseCalls.push(this.currentSrc || this.src || "");
          return originalPause.call(this);
        };
        window.__restoreAudio = () => {
          window.HTMLMediaElement.prototype.play = originalPlay;
          window.HTMLMediaElement.prototype.pause = originalPause;
        };
      });
      page.on("console", (msg) => logs.push(`console:${msg.type()}:${msg.text()}`));
      page.on("pageerror", (err) => logs.push(`pageerror:${err.message}`));
      page.on("requestfailed", (request) => {
        const failure = request.failure();
        logs.push(`requestfailed:${request.url()}:${failure ? failure.errorText : "unknown"}`);
      });

      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });

      assert(await page.locator("#screen-start.active").count() === 1, "Start screen did not render.");
      assert(await page.locator("#gameSelect").count() === 1, "Game selector is missing.");
      assert(await page.locator("#btnNewGame").count() === 1, "New Game button is missing.");
      assert(await page.locator("#btnDuplicateGame").count() === 1, "Duplicate Game button is missing.");
      assert(await page.locator("#btnDeleteGame").count() === 1, "Delete Game button is missing.");
      assert(await page.locator("#btnImportGame").count() === 1, "Import Game Pack button is missing.");
      assert(await page.locator("#btnExportGame").count() === 1, "Export Active Game button is missing.");
      assert(await page.locator("#btnPreflight").count() === 1, "Preflight button is missing.");

      await page.locator("#btnNewGame").click();
      await page.waitForTimeout(200);
      await page.locator("#btnEdit").click();
      assert(await page.locator("#screen-editor.active").count() === 1, "Editor did not open.");

      await page.locator("#editGameTitle").fill("Event Ready Smoke Test");
      await page.locator("#editQuestion").fill("Name a workplace hazard people notice first.");
      const answerInputs = page.locator("input.answerInput");
      await answerInputs.nth(0).fill("Wet floor");
      await answerInputs.nth(1).fill("Blocked exit");
      await answerInputs.nth(2).fill("Missing guardrail");
      await answerInputs.nth(3).fill("Bad lighting");
      await answerInputs.nth(4).fill("Loose cord");
      await answerInputs.nth(5).fill("No PPE");
      await page.locator("#btnEditorSave").click();
      await page.waitForTimeout(300);

      assert(await page.locator("#screen-start.active").count() === 1, "Editor did not return to start after save.");
      assert((await page.locator("#gameSelect").inputValue()).length > 0, "Active game selector did not preserve a selected game.");

      await page.locator("#team1Name").fill("Alpha");
      await page.locator("#team2Name").fill("Bravo");
      await page.locator("#btnStart").click();
      assert(await page.locator("#screen-game.active").count() === 1, "Game screen did not open.");
      assert((await page.locator("#question").innerText()).includes("workplace hazard"), "Saved question did not appear in game.");
      assert(
        (await page.locator("#answers .card[data-idx='0'] .front .answerText").innerText()).toLowerCase().includes("wet floor"),
        "Host answer text was not visible before reveal."
      );
      assert(
        (await page.locator("#answers .card[data-idx='0'] .front .points").innerText()).includes("35"),
        "Host answer points were not visible before reveal."
      );
      assert(await page.locator("#btnAnsweringTeam1").count() === 1, "Answering Team 1 selector is missing.");
      assert(await page.locator("#btnAnsweringTeam2").count() === 1, "Answering Team 2 selector is missing.");
      assert(
        (await page.locator("#btnAnsweringTeam1").innerText()).toLowerCase().includes("alpha"),
        "Answering Team 1 selector did not show the team name."
      );
      assert(await page.locator("#answers .card[data-idx='0'] .answerCorrect").count() === 1, "Host correct-answer control is missing.");
      assert(await page.locator("#answers .card[data-idx='1'] .answerStrike").count() === 1, "Host red-X answer control is missing.");

      const audiencePage = await context.newPage();
      audiencePage.on("console", (msg) => logs.push(`audience-console:${msg.type()}:${msg.text()}`));
      audiencePage.on("pageerror", (err) => logs.push(`audience-pageerror:${err.message}`));
      await audiencePage.goto(`${baseUrl}/?view=audience`, { waitUntil: "networkidle" });
      assert(await audiencePage.locator("#screen-audience.active").count() === 1, "Audience view did not render.");
      assert((await audiencePage.locator("#audienceQuestion").innerText()).includes("workplace hazard"), "Audience view did not receive current game state.");
      assert(
        (await audiencePage.locator("#audienceAnswers .audienceCard").first().innerText()).includes("HIDDEN"),
        "Audience answer was visible before host reveal."
      );
      assert(await audiencePage.locator("button.audienceStrike").count() === 0, "Audience strikes should be display-only.");

      await page.locator("#btnAnsweringTeam2").click();
      assert(await page.locator("#btnAnsweringTeam2[aria-pressed='true']").count() === 1, "Answering Team 2 was not selected.");
      const roundTotalBeforeStrike = Number(await page.locator("#roundTotal").innerText());
      await page.locator("#answers .card[data-idx='1'] .answerStrike").click();
      await audiencePage.waitForFunction(() => {
        const bigX = document.querySelector("#bigX");
        return bigX && bigX.classList.contains("show") && bigX.getAttribute("aria-hidden") === "false";
      });
      await page.waitForTimeout(250);
      assert(Number(await page.locator("#roundTotal").innerText()) === roundTotalBeforeStrike, "Wrong-answer strike changed the round total.");
      assert(await page.locator("#answers .card[data-idx='1'].revealed").count() === 0, "Wrong-answer strike revealed the host answer.");
      await audiencePage.waitForFunction(() => document.querySelectorAll("#audienceTeam2Strikes .audienceStrike.used").length === 1);
      assert(
        (await audiencePage.locator("#audienceAnswers .audienceCard").nth(1).innerText()).includes("HIDDEN"),
        "Wrong-answer strike revealed the audience answer."
      );

      await page.locator("#answers .card[data-idx='0'] .answerCorrect").click();
      await page.waitForTimeout(250);
      assert(await page.locator("#answers .card[data-idx='0'].revealed").count() === 1, "First answer did not reveal.");
      assert(Number(await page.locator("#roundTotal").innerText()) > 0, "Round total did not update after reveal.");
      await audiencePage.waitForFunction(() => {
        const firstCard = document.querySelector("#audienceAnswers .audienceCard");
        return firstCard && firstCard.textContent.includes("Wet floor");
      });
      assert(
        (await audiencePage.locator("#audienceAnswers .audienceCard").first().innerText()).toLowerCase().includes("wet floor"),
        "Audience answer did not reveal after host click."
      );
      await audiencePage.close();

      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
      assert(await page.locator("#btnPrintCueCards").count() === 1, "Print Cue Cards button is missing.");
      const [printPage] = await Promise.all([
        context.waitForEvent("page"),
        page.locator("#btnPrintCueCards").click(),
      ]);
      await printPage.waitForLoadState("domcontentloaded");
      const printHtml = await printPage.content();
      assert(printHtml.includes("@page { size: 4in 6in;"), "Cue-card print CSS does not use 4x6 page size.");
      assert(printHtml.includes("Name a workplace hazard people notice first."), "Cue-card print document is missing the question.");
      assert(printHtml.includes("Wet floor"), "Cue-card print document is missing answer text.");
      assert(printHtml.includes("35"), "Cue-card print document is missing answer points.");
      await printPage.close();

      await page.locator("#btnPreflight").click();
      assert(await page.locator("#preflightPanel.active").count() === 1, "Preflight panel did not open.");
      assert(await page.locator("#preflightOverall").count() === 1, "Preflight overall status is missing.");
      assert(await page.locator("#btnTestTheme").count() === 1, "Theme sound test button is missing.");
      assert(await page.locator("#btnTestBell").count() === 1, "Bell sound test button is missing.");
      assert(await page.locator("#btnTestBuzzer").count() === 1, "Buzzer sound test button is missing.");
      await page.locator("#btnTestTheme").click();
      await page.locator("#btnTestBell").click();
      await page.locator("#btnTestBuzzer").click();
      const playCalls = await page.evaluate(() => window.__playCalls || []);
      assert(playCalls.some((src) => src.includes("family-feud-2.mp3")), "Theme sound test did not invoke the theme audio file.");
      assert(playCalls.some((src) => src.includes("family-feud-good-answer.mp3")), "Correct-answer sound test did not invoke the bell audio file.");
      assert(playCalls.some((src) => src.includes("the-family-feud-buzzer-sound-effect.mp3")), "Buzzer sound test did not invoke the buzzer audio file.");

      for (const asset of [
        "assets/family-feud-2.mp3",
        "assets/family-feud-good-answer.mp3",
        "assets/the-family-feud-buzzer-sound-effect.mp3",
      ]) {
        const response = await page.request.get(`${baseUrl}/${asset}`);
        assert(response.ok(), `Audio asset did not load: ${asset}`);
      }

      const serviceWorkerStatus = await page.evaluate(async () => {
        if (!("serviceWorker" in navigator)) return "unsupported";
        const reg = await navigator.serviceWorker.getRegistration();
        return reg ? "registered" : "not-registered";
      });
      assert(serviceWorkerStatus === "registered", `Service worker was ${serviceWorkerStatus}.`);

      await expectNoBrowserErrors(logs);
    });

    console.log("Smoke test passed.");
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  server.close();
  process.exitCode = 1;
});
