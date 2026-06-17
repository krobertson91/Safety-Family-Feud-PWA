
const STORAGE_KEY = "safety_family_feud_data_v5";
const LIBRARY_KEY = "safety_family_feud_game_library_v1";
const ACTIVE_GAME_KEY = "safety_family_feud_active_game_id_v1";
const TEAM_KEY = "safety_family_feud_teams_v5";
const SESSION_KEY = "safety_family_feud_session_v1";
const CHANNEL_NAME = "safety_family_feud_channel_v1";
const COMMAND_KEY = "safety_family_feud_command_v1";

const appParams = new URLSearchParams(window.location.search);
const isAudienceView = appParams.get("view") === "audience";

let deferredInstallPrompt = null;
let sessionChannel = null;
try {
  sessionChannel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
} catch {
  sessionChannel = null;
}

let audienceState = null;
let lastHandledCommandId = null;

const DEFAULT_DATA = {
  "title": "Safety Family Feud",
  "rounds": [
    {
      "name": "Round 1",
      "question": "Sample Question",
      "answers": [
        {
          "text": "Sample Answer 1",
          "points": 35
        },
        {
          "text": "Sample Answer 2",
          "points": 25
        },
        {
          "text": "Sample Answer 3",
          "points": 15
        },
        {
          "text": "Sample Answer 4",
          "points": 10
        },
        {
          "text": "Sample Answer 5",
          "points": 8
        },
        {
          "text": "Sample Answer 6",
          "points": 7
        }
      ]
    }
  ]
};

const SOUND_FILES = {
  theme: "assets/family-feud-2.mp3",
  buzzer: "assets/the-family-feud-buzzer-sound-effect.mp3",
  bell: "assets/family-feud-good-answer.mp3",
};

const els = {
  startScreen: document.getElementById("screen-start"),
  gameScreen: document.getElementById("screen-game"),
  editorScreen: document.getElementById("screen-editor"),
  audienceScreen: document.getElementById("screen-audience"),
  gameTitle: document.getElementById("gameTitle"),
  btnStart: document.getElementById("btnStart"),
  btnEdit: document.getElementById("btnEdit"),
  btnResetGame: document.getElementById("btnResetGame"),
  btnOpenAudience: document.getElementById("btnOpenAudience"),
  btnInstallPwa: document.getElementById("btnInstallPwa"),
  gameSelect: document.getElementById("gameSelect"),
  btnNewGame: document.getElementById("btnNewGame"),
  btnDuplicateGame: document.getElementById("btnDuplicateGame"),
  btnDeleteGame: document.getElementById("btnDeleteGame"),
  btnImportGame: document.getElementById("btnImportGame"),
  btnExportGame: document.getElementById("btnExportGame"),
  btnPrintCueCards: document.getElementById("btnPrintCueCards"),
  fileGameImport: document.getElementById("fileGameImport"),
  btnPreflight: document.getElementById("btnPreflight"),
  btnSound: document.getElementById("btnSound"),
  btnStopMusic: document.getElementById("btnStopMusic"),
  team1Name: document.getElementById("team1Name"),
  team2Name: document.getElementById("team2Name"),
  team1DisplayName: document.getElementById("team1DisplayName"),
  team2DisplayName: document.getElementById("team2DisplayName"),
  team1Score: document.getElementById("team1Score"),
  team2Score: document.getElementById("team2Score"),
  team1Strikes: document.getElementById("team1Strikes"),
  team2Strikes: document.getElementById("team2Strikes"),
  roundName: document.getElementById("roundName"),
  question: document.getElementById("question"),
  answers: document.getElementById("answers"),
  roundTotal: document.getElementById("roundTotal"),
  btnPrevRound: document.getElementById("btnPrevRound"),
  btnNextRound: document.getElementById("btnNextRound"),
  btnAwardTeam1: document.getElementById("btnAwardTeam1"),
  btnAwardTeam2: document.getElementById("btnAwardTeam2"),
  btnAnsweringTeam1: document.getElementById("btnAnsweringTeam1"),
  btnAnsweringTeam2: document.getElementById("btnAnsweringTeam2"),
  btnRevealRemaining: document.getElementById("btnRevealRemaining"),
  btnResetRound: document.getElementById("btnResetRound"),
  btnBackToStart: document.getElementById("btnBackToStart"),
  btnEditInGame: document.getElementById("btnEditInGame"),
  btnOpenAudienceInGame: document.getElementById("btnOpenAudienceInGame"),
  btnSoundInGame: document.getElementById("btnSoundInGame"),
  btnStopMusicInGame: document.getElementById("btnStopMusicInGame"),
  bigX: document.getElementById("bigX"),
  audienceTitle: document.getElementById("audienceTitle"),
  audienceStatus: document.getElementById("audienceStatus"),
  audienceTeam1Name: document.getElementById("audienceTeam1Name"),
  audienceTeam2Name: document.getElementById("audienceTeam2Name"),
  audienceTeam1Score: document.getElementById("audienceTeam1Score"),
  audienceTeam2Score: document.getElementById("audienceTeam2Score"),
  audienceTeam1Strikes: document.getElementById("audienceTeam1Strikes"),
  audienceTeam2Strikes: document.getElementById("audienceTeam2Strikes"),
  audienceRoundName: document.getElementById("audienceRoundName"),
  audienceQuestion: document.getElementById("audienceQuestion"),
  audienceRoundTotal: document.getElementById("audienceRoundTotal"),
  audienceAnswers: document.getElementById("audienceAnswers"),
  preflightPanel: document.getElementById("preflightPanel"),
  preflightOverall: document.getElementById("preflightOverall"),
  preflightContentStatus: document.getElementById("preflightContentStatus"),
  preflightAudioStatus: document.getElementById("preflightAudioStatus"),
  preflightAudienceStatus: document.getElementById("preflightAudienceStatus"),
  preflightOfflineStatus: document.getElementById("preflightOfflineStatus"),
  preflightDisplayStatus: document.getElementById("preflightDisplayStatus"),
  btnClosePreflight: document.getElementById("btnClosePreflight"),
  btnTestTheme: document.getElementById("btnTestTheme"),
  btnTestBell: document.getElementById("btnTestBell"),
  btnTestBuzzer: document.getElementById("btnTestBuzzer"),
  btnPreflightAudience: document.getElementById("btnPreflightAudience"),
};

const editorEls = {
  btnBack: document.getElementById("btnEditorBack"),
  btnSave: document.getElementById("btnEditorSave"),
  btnExport: document.getElementById("btnEditorExport"),
  btnPrintCueCards: document.getElementById("btnEditorPrintCueCards"),
  btnImport: document.getElementById("btnEditorImport"),
  fileImport: document.getElementById("fileImport"),
  gameTitle: document.getElementById("editGameTitle"),
  roundList: document.getElementById("roundList"),
  btnAddRound: document.getElementById("btnAddRound"),
  btnAddFinalRound: document.getElementById("btnAddFinalRound"),
  btnDeleteRound: document.getElementById("btnDeleteRound"),
  btnMoveRoundUp: document.getElementById("btnMoveRoundUp"),
  btnMoveRoundDown: document.getElementById("btnMoveRoundDown"),
  roundName: document.getElementById("editRoundName"),
  question: document.getElementById("editQuestion"),
  roundTotal: document.getElementById("editRoundTotal"),
  btnAddAnswer: document.getElementById("btnAddAnswer"),
  answersEditor: document.getElementById("answersEditor"),
};

let soundOn = true;
const audio = {
  theme: SOUND_FILES.theme ? new Audio(SOUND_FILES.theme) : null,
  buzzer: SOUND_FILES.buzzer ? new Audio(SOUND_FILES.buzzer) : null,
  bell: SOUND_FILES.bell ? new Audio(SOUND_FILES.bell) : null,
};
if (audio.theme) { audio.theme.loop = true; audio.theme.volume = 0.85; }
if (audio.buzzer) { audio.buzzer.volume = 0.95; }
if (audio.bell) { audio.bell.volume = 0.95; }

function setSoundUI() {
  const label = soundOn ? "Sound: ON" : "Sound: OFF";
  els.btnSound && (els.btnSound.textContent = label);
  els.btnSoundInGame && (els.btnSoundInGame.textContent = label);
}

function playTheme() {
  if (!soundOn || !audio.theme) return;
  audio.theme.currentTime = 0;
  audio.theme.play().catch(() => {});
  updateThemeButtons();
}
// reflect state in UI
updateThemeButtons();

function stopTheme() {
  if (!audio.theme) return;
  audio.theme.pause();
  audio.theme.currentTime = 0;
  updateThemeButtons();
}

function isThemePlaying(){
  return !!(audio.theme && !audio.theme.paused && !audio.theme.ended);
}
function updateThemeButtons(){
  const playing = isThemePlaying();
  const label = playing ? "Stop Theme" : "Play Theme";
  if (els.btnStopMusic) els.btnStopMusic.textContent = label;
  if (els.btnStopMusicInGame) els.btnStopMusicInGame.textContent = label;
}
function toggleTheme(){
  if (!audio.theme) return;
  if (!soundOn) return; // keep simple: no theme if sound off
  if (isThemePlaying()) stopTheme(); else playTheme();
  updateThemeButtons();
}

function playBuzzer() {
  if (!soundOn || !audio.buzzer) return;
  audio.buzzer.currentTime = 0;
  audio.buzzer.play().catch(() => {});
}
function playBell() {
  if (!soundOn || !audio.bell) return;
  audio.bell.currentTime = 0;
  audio.bell.play().catch(() => {});
}

function cloneObject(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function makeGameId() {
  return `game-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sanitizeFileName(value) {
  return String(value || "safety-family-feud")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "safety-family-feud";
}

function normalizeGameData(source) {
  const src = isPlainObject(source) ? source : DEFAULT_DATA;
  const fallbackRound = cloneObject(DEFAULT_DATA.rounds[0]);
  const rounds = Array.isArray(src.rounds) && src.rounds.length
    ? src.rounds
    : [fallbackRound];

  const normalized = {
    title: String(src.title || "Safety Family Feud").trim() || "Safety Family Feud",
    rounds: rounds.map((round, roundIdx) => {
      const rawRound = isPlainObject(round) ? round : {};
      const answers = Array.isArray(rawRound.answers) && rawRound.answers.length
        ? rawRound.answers
        : cloneObject(fallbackRound.answers);

      return {
        name: String(rawRound.name || `Round ${roundIdx + 1}`).trim() || `Round ${roundIdx + 1}`,
        question: String(rawRound.question || "").trim(),
        pointTotal: getRoundPointTotal(rawRound) === 200 ? 200 : 100,
        answers: answers.map((answer) => ({
          text: String(answer?.text || "").trim(),
          points: Math.max(0, Math.floor(Number(answer?.points || 0))),
        })),
      };
    }),
  };

  normalizeDraftRounds(normalized);
  return normalized;
}

function makeGameRecord(source, id = makeGameId()) {
  const gameData = normalizeGameData(source);
  return {
    id: String(source?.id || id),
    title: gameData.title,
    updatedAt: source?.updatedAt || new Date().toISOString(),
    rounds: gameData.rounds,
  };
}

function readGameLibrary() {
  const stored = localStorage.getItem(LIBRARY_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    const records = Array.isArray(parsed?.games) ? parsed.games : parsed;
    if (!Array.isArray(records)) return [];
    return records.map((record) => makeGameRecord(record, record?.id)).filter((record) => record.id);
  } catch {
    return [];
  }
}

function writeGameLibrary(games) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify({ version: 1, games }));
}

function getActiveGameId() {
  return localStorage.getItem(ACTIVE_GAME_KEY);
}

function setActiveGameId(id) {
  localStorage.setItem(ACTIVE_GAME_KEY, id);
}

function getLegacyDataFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed && Array.isArray(parsed.rounds) ? parsed : null;
  } catch {
    return null;
  }
}

async function loadSeedDataFromFile() {
  if (location.protocol === "file:") return null;
  try {
    const response = await fetch("./data.json", { cache: "no-store" });
    if (!response.ok) return null;
    const parsed = await response.json();
    return parsed && Array.isArray(parsed.rounds) ? parsed : null;
  } catch {
    return null;
  }
}

async function ensureGameLibrary() {
  let games = readGameLibrary();
  if (!games.length) {
    const seed = getLegacyDataFromStorage() || await loadSeedDataFromFile() || DEFAULT_DATA;
    games = [makeGameRecord(seed)];
    writeGameLibrary(games);
  }

  const activeId = getActiveGameId();
  const activeExists = games.some((game) => game.id === activeId);
  if (!activeId || !activeExists) {
    setActiveGameId(games[0].id);
  }

  return games;
}

function getActiveGameRecord() {
  const games = readGameLibrary();
  if (!games.length) return null;
  const activeId = getActiveGameId();
  return games.find((game) => game.id === activeId) || games[0];
}

function gameRecordToData(game) {
  const normalized = makeGameRecord(game, game?.id);
  return {
    title: normalized.title,
    rounds: cloneObject(normalized.rounds),
  };
}

function getDataFromStorage() {
  const activeGame = getActiveGameRecord();
  if (activeGame) return gameRecordToData(activeGame);
  const fallback = normalizeGameData(getLegacyDataFromStorage() || DEFAULT_DATA);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
  return fallback;
}

function saveActiveGameData(obj) {
  const gameData = normalizeGameData(obj);
  const games = readGameLibrary();
  let activeId = getActiveGameId();
  let activeIndex = games.findIndex((game) => game.id === activeId);

  if (activeIndex === -1) {
    const game = makeGameRecord(gameData);
    games.push(game);
    activeIndex = games.length - 1;
    activeId = game.id;
    setActiveGameId(activeId);
  }

  games[activeIndex] = {
    ...games[activeIndex],
    title: gameData.title,
    updatedAt: new Date().toISOString(),
    rounds: gameData.rounds,
  };

  writeGameLibrary(games);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
  return gameData;
}

function setDataToStorage(obj) { return saveActiveGameData(obj); }

function createNewGame() {
  const games = readGameLibrary();
  const nextNumber = games.length + 1;
  const draft = {
    title: `Safety Family Feud ${nextNumber}`,
    rounds: [createRoundTemplate("Round 1", 100)],
  };
  const game = makeGameRecord(draft);
  games.push(game);
  writeGameLibrary(games);
  setActiveGameId(game.id);
  return game;
}

function duplicateActiveGame() {
  const active = getActiveGameRecord();
  if (!active) return createNewGame();
  const games = readGameLibrary();
  const duplicate = makeGameRecord({
    ...gameRecordToData(active),
    title: `Copy of ${active.title || "Safety Family Feud"}`,
  });
  games.push(duplicate);
  writeGameLibrary(games);
  setActiveGameId(duplicate.id);
  return duplicate;
}

function deleteActiveGame() {
  const games = readGameLibrary();
  if (games.length <= 1) {
    const replacement = makeGameRecord({
      title: "Safety Family Feud",
      rounds: [createRoundTemplate("Round 1", 100)],
    });
    writeGameLibrary([replacement]);
    setActiveGameId(replacement.id);
    return replacement;
  }

  const activeId = getActiveGameId();
  const nextGames = games.filter((game) => game.id !== activeId);
  writeGameLibrary(nextGames);
  setActiveGameId(nextGames[0].id);
  return nextGames[0];
}

function extractImportedGameData(parsed) {
  if (isPlainObject(parsed?.game)) return parsed.game;
  if (Array.isArray(parsed?.games) && parsed.games[0]) return parsed.games[0];
  return parsed;
}

function importGameRecord(parsed) {
  const imported = makeGameRecord(extractImportedGameData(parsed));
  const games = readGameLibrary();
  games.push(imported);
  writeGameLibrary(games);
  setActiveGameId(imported.id);
  return imported;
}

function getActiveGameExportPayload() {
  const active = getActiveGameRecord();
  if (!active) return null;
  return {
    format: "safety-family-feud-game-v1",
    exportedAt: new Date().toISOString(),
    game: active,
  };
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getTeams() {
  const stored = localStorage.getItem(TEAM_KEY);
  if (stored) { try { return JSON.parse(stored); } catch {} }
  return { team1: "TEAM 1", team2: "TEAM 2", s1: 0, s2: 0 };
}
function setTeams(t) { localStorage.setItem(TEAM_KEY, JSON.stringify(t)); }

function getRoundPointTotal(round) {
  const explicit = Number(round?.pointTotal);
  if (explicit === 200) return 200;
  if (explicit === 100) return 100;
  const answerTotal = Array.isArray(round?.answers)
    ? round.answers.reduce((sum, answer) => sum + Math.max(0, Number(answer?.points || 0)), 0)
    : 0;
  return answerTotal > 100 ? 200 : 100;
}

function isFinalRound(round) {
  return getRoundPointTotal(round) === 200;
}

function createRoundTemplate(name, pointTotal = 100) {
  const round = {
    name,
    question: "",
    pointTotal: pointTotal === 200 ? 200 : 100,
    answers: [35, 25, 15, 10, 8, 7].map((points) => ({ text: "", points })),
  };
  normalizeRoundPoints(round);
  return round;
}

function normalizeDraftRounds(draft) {
  if (!draft || !Array.isArray(draft.rounds)) return;
  const regularRounds = [];
  const finalRounds = [];
  draft.rounds.forEach((round) => {
    if (!round) return;
    round.pointTotal = getRoundPointTotal(round);
    if (isFinalRound(round)) finalRounds.push(round);
    else regularRounds.push(round);
  });
  draft.rounds = regularRounds.concat(finalRounds);
  draft.rounds.forEach((round) => normalizeRoundPoints(round));
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setAudienceText(el, value) {
  if (el) el.textContent = String(value ?? "");
}

function getStoredSessionState() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

function setStoredSessionState(state) {
  if (!state) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

function buildSessionState() {
  if (!data || !Array.isArray(data.rounds) || data.rounds.length === 0) return null;
  const round = data.rounds[roundIndex] || data.rounds[0];
  const teams = getTeams();
  const answers = Array.isArray(round.answers) ? round.answers : [];

  return {
    kind: "session-state",
    updatedAt: Date.now(),
    title: data.title || "Safety Family Feud",
    roundIndex,
    roundName: round.name || `Round ${roundIndex + 1}`,
    question: round.question || "",
    roundTotal,
    strikes: { ...strikes },
    teams: {
      team1: (teams.team1 || els.team1Name?.value || "TEAM 1").trim() || "TEAM 1",
      team2: (teams.team2 || els.team2Name?.value || "TEAM 2").trim() || "TEAM 2",
      s1: Number(teams.s1 || 0),
      s2: Number(teams.s2 || 0),
    },
    answers: answers.map((answer, index) => ({
      index,
      text: String(answer.text ?? ""),
      points: Number(answer.points || 0),
      revealed: revealed.has(index) || revealedWithoutPoints.has(index),
    })),
  };
}

function broadcastSession() {
  if (isAudienceView) return;
  const state = buildSessionState();
  if (!state) return;
  setStoredSessionState(state);
  try { sessionChannel?.postMessage(state); } catch {}
}

function makeCommandId() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function sendAudienceCommand(action, payload = {}) {
  const command = { kind: "audience-command", id: makeCommandId(), action, ...payload };
  localStorage.setItem(COMMAND_KEY, JSON.stringify(command));
  try { sessionChannel?.postMessage(command); } catch {}
}

function handleAudienceCommand(command) {
  if (!command || command.kind !== "audience-command") return;
  if (command.id && command.id === lastHandledCommandId) return;
  lastHandledCommandId = command.id || null;
  if (command.action === "add-strike" && (command.teamKey === "team1" || command.teamKey === "team2")) {
    addStrike(command.teamKey);
  }
}

function bindAudienceCommandListeners() {
  sessionChannel?.addEventListener("message", (event) => {
    if (event.data?.kind !== "audience-command") return;
    handleAudienceCommand(event.data);
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== COMMAND_KEY || !event.newValue) return;
    try { handleAudienceCommand(JSON.parse(event.newValue)); } catch {}
  });
}

function handleAudienceStrike(teamKey) {
  if (!isAudienceView) return;
  const strikeCount = Number(audienceState?.strikes?.[teamKey] || 0);
  if (strikeCount >= 3) return;
  showBigX();
  sendAudienceCommand("add-strike", { teamKey });
}

function openAudienceDisplay() {
  broadcastSession();
  preflightAudienceOpened = true;
  const url = new URL(window.location.href);
  url.searchParams.set("view", "audience");
  url.hash = "";
  const audienceWindow = window.open(url.toString(), "safety-family-feud-audience");
  if (!audienceWindow) {
    alert(`Pop-up blocked. Open this display URL instead:\n${url.toString()}`);
  }
  updatePreflightStatus();
}

function renderAudienceStrikes(container, count) {
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const strike = document.createElement("span");
    strike.className = "audienceStrike" + (i < Number(count || 0) ? " used" : "");
    strike.textContent = "X";
    strike.setAttribute("aria-hidden", "true");
    container.appendChild(strike);
  }
}

function renderAudienceState(state) {
  const safeState = state || {
    title: "Safety Family Feud",
    roundName: "Round 1",
    question: "Waiting for host...",
    roundTotal: 0,
    strikes: { team1: 0, team2: 0 },
    teams: { team1: "TEAM 1", team2: "TEAM 2", s1: 0, s2: 0 },
    answers: [],
  };

  const previousStrikes = audienceState?.strikes || { team1: 0, team2: 0 };
  const nextStrikes = safeState.strikes || { team1: 0, team2: 0 };
  const strikeIncreased = !!audienceState && !!state && (
    Number(nextStrikes.team1 || 0) > Number(previousStrikes.team1 || 0) ||
    Number(nextStrikes.team2 || 0) > Number(previousStrikes.team2 || 0)
  );

  audienceState = safeState;

  setAudienceText(els.audienceStatus, state ? "Live" : "Waiting");
  setAudienceText(els.audienceTitle, safeState.title);
  setAudienceText(els.audienceTeam1Name, safeState.teams?.team1 || "TEAM 1");
  setAudienceText(els.audienceTeam2Name, safeState.teams?.team2 || "TEAM 2");
  setAudienceText(els.audienceTeam1Score, safeState.teams?.s1 || 0);
  setAudienceText(els.audienceTeam2Score, safeState.teams?.s2 || 0);
  setAudienceText(els.audienceRoundName, safeState.roundName || "Round 1");
  setAudienceText(els.audienceQuestion, safeState.question || "");
  setAudienceText(els.audienceRoundTotal, safeState.roundTotal || 0);
  renderAudienceStrikes(els.audienceTeam1Strikes, safeState.strikes?.team1 || 0);
  renderAudienceStrikes(els.audienceTeam2Strikes, safeState.strikes?.team2 || 0);

  if (!els.audienceAnswers) return;
  els.audienceAnswers.innerHTML = "";
  (safeState.answers || []).forEach((answer, index) => {
    const card = document.createElement("div");
    card.className = "audienceCard " + (answer.revealed ? "revealed" : "hidden");
    const slot = document.createElement("div");
    slot.className = "audienceSlot";
    slot.textContent = String(index + 1);
    const text = document.createElement("div");
    text.className = "audienceAnswerText";
    text.textContent = answer.revealed ? answer.text : "HIDDEN";
    const points = document.createElement("div");
    points.className = "audiencePoints";
    points.textContent = answer.revealed ? String(answer.points) : "—";
    card.append(slot, text, points);
    els.audienceAnswers.appendChild(card);
  });

  if (((safeState.answers || []).length % 2) === 1) {
    const spacer = document.createElement("div");
    spacer.className = "audienceCard";
    spacer.style.visibility = "hidden";
    els.audienceAnswers.appendChild(spacer);
  }

  if (strikeIncreased) showBigX();
}

async function initAudience() {
  await ensureGameLibrary();
  data = getDataFromStorage();
  showScreen("audience");
  renderAudienceState(getStoredSessionState());
  sessionChannel?.addEventListener("message", (event) => {
    if (event.data?.kind !== "session-state") return;
    setStoredSessionState(event.data);
    renderAudienceState(event.data);
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== SESSION_KEY || !event.newValue) return;
    try { renderAudienceState(JSON.parse(event.newValue)); } catch {}
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

function setupInstallPrompt() {
  if (!els.btnInstallPwa) return;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.btnInstallPwa.hidden = false;
  });
  els.btnInstallPwa.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch {}
    deferredInstallPrompt = null;
    els.btnInstallPwa.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    els.btnInstallPwa.hidden = true;
  });
}

function normalizeRoundPoints(round) {
  if (!round || !Array.isArray(round.answers) || round.answers.length === 0) return;
  const answers = round.answers;
  const targetTotal = getRoundPointTotal(round);
  const weights = answers.map(a => Math.max(0, Number(a.points || 0)));
  let sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    const base = Math.floor(targetTotal / answers.length);
    let remainder = targetTotal - base * answers.length;
    answers.forEach((a) => {
      a.points = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    });
    return;
  }
  const raw = weights.map(w => (w / sum) * targetTotal);
  const scaled = raw.map(x => Math.floor(x));
  let remainder = targetTotal - scaled.reduce((a, b) => a + b, 0);
  const order = raw.map((x,i)=>({i, frac:x-Math.floor(x)})).sort((a,b)=>b.frac-a.frac);
  for (let k=0;k<remainder;k++) scaled[order[k % order.length].i] += 1;
  answers.forEach((a,i)=>a.points=scaled[i]);

  let safety = Math.max(200, targetTotal * 2);
  while (safety-- > 0) {
    const zeroIdx = answers.findIndex(a => Number(a.points || 0) <= 0);
    if (zeroIdx === -1) break;
    let maxIdx = 0;
    for (let i = 1; i < answers.length; i++) {
      if (Number(answers[i].points || 0) > Number(answers[maxIdx].points || 0)) maxIdx = i;
    }
    if (Number(answers[maxIdx].points || 0) <= 1) break;
    answers[maxIdx].points = Number(answers[maxIdx].points || 0) - 1;
    answers[zeroIdx].points = 1;
  }
}

function canAssignStrictUniquePointValues(targetTotal, answerCount) {
  return targetTotal >= (answerCount * (answerCount + 1)) / 2;
}

function valuesAreStrictlyDescending(values) {
  return values.every((value, index) => value > 0 && (index === 0 || values[index - 1] > value));
}

function applyStrictUniqueRoundPoints(round) {
  if (!round || !Array.isArray(round.answers) || round.answers.length === 0) return;
  const answers = round.answers;
  const targetTotal = getRoundPointTotal(round);
  const points = answers.map((_, index) => answers.length - index);
  let remainder = targetTotal - points.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  while (remainder > 0) {
    points[cursor] += 1;
    remainder--;
    cursor = (cursor + 1) % points.length;
  }
  answers.forEach((answer, index) => {
    answer.points = points[index];
  });
}

function nudgePointValuesAwayFromPrevious(values, previousValues = []) {
  let adjusted = values.slice();
  const comparableCount = Math.min(previousValues.length, adjusted.length);
  for (let index = 0; index < comparableCount; index++) {
    if (adjusted[index] !== Number(previousValues[index] || 0)) continue;

    let candidate = null;
    for (let donor = index - 1; donor >= 0; donor--) {
      const trial = adjusted.slice();
      trial[donor] -= 1;
      trial[index] += 1;
      if (new Set(trial).size === trial.length && valuesAreStrictlyDescending(trial)) {
        candidate = trial;
        break;
      }
    }

    if (!candidate) {
      for (let recipient = index + 1; recipient < adjusted.length; recipient++) {
        const trial = adjusted.slice();
        trial[index] -= 1;
        trial[recipient] += 1;
        if (new Set(trial).size === trial.length && valuesAreStrictlyDescending(trial)) {
          candidate = trial;
          break;
        }
      }
    }

    if (candidate) adjusted = candidate;
  }
  return adjusted;
}

function rebalanceRoundPointsForAnswerCount(round, previousValues = []) {
  if (!round || !Array.isArray(round.answers) || round.answers.length === 0) return;
  const answers = round.answers;
  answers.forEach((answer, index) => {
    answer.points = answers.length - index;
  });
  normalizeRoundPoints(round);

  let values = answers.map((answer) => Math.max(0, Number(answer.points || 0)));
  const isStrictlyDescending = valuesAreStrictlyDescending(values);
  const isUnique = new Set(values).size === values.length;
  const isPositive = values.every((value) => value > 0);
  if (!isStrictlyDescending || !isUnique || !isPositive) {
    const targetTotal = getRoundPointTotal(round);
    if (canAssignStrictUniquePointValues(targetTotal, answers.length)) {
      applyStrictUniqueRoundPoints(round);
      values = answers.map((answer) => Math.max(0, Number(answer.points || 0)));
    }
  }
  values = nudgePointValuesAwayFromPrevious(values, previousValues);
  answers.forEach((answer, index) => {
    answer.points = values[index];
  });
}

function adjustOthersToTotal(round, lockedIndex) {
  if (!round || !Array.isArray(round.answers) || round.answers.length === 0) return;
  const answers = round.answers;
  const targetTotal = getRoundPointTotal(round);

  const n = answers.length;
  const minEach = 1;
  const locked = Math.max(0, Math.min(n - 1, Number(lockedIndex)));
  let lockedVal = Math.floor(Number(answers[locked].points || 0));

  const maxLocked = targetTotal - (n - 1) * minEach;
  lockedVal = Math.max(minEach, Math.min(maxLocked, lockedVal));
  answers[locked].points = lockedVal;

  const remainingTotal = targetTotal - lockedVal;

  const idxs = [];
  const weights = [];
  for (let i = 0; i < n; i++) {
    if (i === locked) continue;
    idxs.push(i);
    weights.push(Math.max(0, Number(answers[i].points || 0)));
  }
  let sum = weights.reduce((a, b) => a + b, 0);

  let base = 0;
  let scaled = new Array(idxs.length).fill(0);
  if (sum === 0) {
    base = Math.floor(remainingTotal / idxs.length);
    let rem = remainingTotal - base * idxs.length;
    for (let k = 0; k < idxs.length; k++) {
      scaled[k] = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
    }
  } else {
    const raw = weights.map(w => (w / sum) * remainingTotal);
    scaled = raw.map(x => Math.floor(x));
    let rem = remainingTotal - scaled.reduce((a, b) => a + b, 0);
    const order = raw
      .map((x, i) => ({ i, frac: x - Math.floor(x) }))
      .sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < rem; k++) {
      scaled[order[k % order.length].i] += 1;
    }
  }

  for (let k = 0; k < idxs.length; k++) {
    answers[idxs[k]].points = scaled[k];
  }

  let safety = 400;
  while (safety-- > 0) {
    const lowK = idxs.findIndex(i => Number(answers[i].points || 0) < minEach);
    if (lowK === -1) break;
    let donor = -1;
    for (const i of idxs) {
      if (Number(answers[i].points || 0) > minEach) {
        if (donor === -1 || Number(answers[i].points) > Number(answers[donor].points)) donor = i;
      }
    }
    if (donor === -1) break;
    answers[donor].points = Number(answers[donor].points) - 1;
    answers[idxs[lowK]].points = minEach;
  }

  let total = answers.reduce((acc, a) => acc + Number(a.points || 0), 0);
  let diff = targetTotal - total;
  while (diff !== 0) {
    let cand = (locked === 0 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      if (i === locked) continue;
      if (Number(answers[i].points || 0) > Number(answers[cand].points || 0)) cand = i;
    }
    if (cand === locked) break;
    if (diff > 0) {
      answers[cand].points = Number(answers[cand].points || 0) + 1;
      diff--;
    } else {
      if (Number(answers[cand].points || 0) <= minEach) break;
      answers[cand].points = Number(answers[cand].points || 0) - 1;
      diff++;
    }
  }
}


let data = null;
let roundIndex = 0;
let revealed = new Set();
let revealedWithoutPoints = new Set();
let roundTotal = 0;
let strikes = { team1: 0, team2: 0 };
let answeringTeamKey = "team1";
const preflightAudioChecks = { theme: false, bell: false, buzzer: false };
let preflightAudienceOpened = false;

function showScreen(which) {
  els.startScreen.classList.toggle("active", which === "start");
  els.gameScreen.classList.toggle("active", which === "game");
  els.editorScreen && els.editorScreen.classList.toggle("active", which === "editor");
  els.audienceScreen && els.audienceScreen.classList.toggle("active", which === "audience");
}

function resetRuntimeRoundState() {
  roundIndex = 0;
  revealed = new Set();
  revealedWithoutPoints = new Set();
  roundTotal = 0;
  strikes = { team1: 0, team2: 0 };
  answeringTeamKey = "team1";
}

function renderGameLibraryControls() {
  if (!els.gameSelect) return;
  const games = readGameLibrary();
  const activeId = getActiveGameId();

  els.gameSelect.innerHTML = "";
  games.forEach((game) => {
    const option = document.createElement("option");
    option.value = game.id;
    option.textContent = game.title || "Untitled Game";
    els.gameSelect.appendChild(option);
  });
  els.gameSelect.value = activeId || games[0]?.id || "";
  if (els.btnDeleteGame) els.btnDeleteGame.disabled = games.length <= 0;
  if (els.btnDuplicateGame) els.btnDuplicateGame.disabled = games.length <= 0;
  if (els.btnExportGame) els.btnExportGame.disabled = games.length <= 0;
}

function loadActiveGameIntoRuntime(options = {}) {
  data = getDataFromStorage();
  resetRuntimeRoundState();
  if (options.resetScores) {
    const teams = getTeams();
    teams.s1 = 0;
    teams.s2 = 0;
    setTeams(teams);
  }
  els.gameTitle && (els.gameTitle.textContent = data.title || "Safety Family Feud");
  renderGameLibraryControls();
  updateTeamDisplayNames();
  updateAwardButtons();
  renderScores();
  if (els.gameScreen?.classList.contains("active")) renderRound();
  else broadcastSession();
  updatePreflightStatus();
}

function handleGameImportFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const imported = importGameRecord(parsed);
      setActiveGameId(imported.id);
      loadActiveGameIntoRuntime({ resetScores: true });
      alert(`Imported "${imported.title}".`);
    } catch {
      alert("Import failed: Choose a valid Safety Family Feud game pack.");
    }
  };
  reader.readAsText(file);
}

function exportActiveGame() {
  const payload = getActiveGameExportPayload();
  if (!payload) {
    alert("No game is available to export.");
    return;
  }
  downloadJson(payload, `${sanitizeFileName(payload.game.title)}.json`);
}

function buildCueCardsHtml(sourceData) {
  const game = normalizeGameData(sourceData);
  const title = escapeHtml(game.title || "Safety Family Feud");
  const cards = game.rounds.map((round, roundIdx) => {
    const roundName = escapeHtml(round.name || `Round ${roundIdx + 1}`);
    const question = escapeHtml(round.question || "");
    const finalBadge = isFinalRound(round) ? `<div class="badge">Final Round · 200 Points</div>` : "";
    const answers = (round.answers || []).map((answer, answerIdx) => `
      <li>
        <span class="answer-rank">${answerIdx + 1}</span>
        <span class="answer-text">${escapeHtml(answer.text || "")}</span>
        <span class="answer-points">${Number(answer.points || 0)}</span>
      </li>
    `).join("");

    return `
      <section class="cue-card">
        <header>
          <div class="game-title">${title}</div>
          <div class="round-name">${roundName}</div>
          ${finalBadge}
        </header>
        <main>
          <div class="question">${question}</div>
          <ol>${answers}</ol>
        </main>
      </section>
    `;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} Cue Cards</title>
  <style>
    @page { size: 4in 6in; margin: 0.18in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f5f1df;
      color: #111;
      font-family: Arial, Helvetica, sans-serif;
    }
    .cue-card {
      width: 4in;
      min-height: 6in;
      page-break-after: always;
      break-after: page;
      padding: 0.24in;
      background: #fffaf0;
      border: 2px solid #111;
      display: flex;
      flex-direction: column;
      gap: 0.16in;
    }
    .cue-card:last-child { page-break-after: auto; break-after: auto; }
    header {
      border-bottom: 2px solid #111;
      padding-bottom: 0.12in;
    }
    .game-title {
      font-size: 10pt;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .round-name {
      margin-top: 0.04in;
      font-size: 18pt;
      font-weight: 900;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      margin-top: 0.06in;
      padding: 0.03in 0.07in;
      border: 1px solid #111;
      border-radius: 999px;
      font-size: 8pt;
      font-weight: 900;
      text-transform: uppercase;
    }
    .question {
      font-size: 15pt;
      line-height: 1.18;
      font-weight: 900;
      margin: 0.02in 0 0.16in;
    }
    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.08in;
    }
    li {
      display: grid;
      grid-template-columns: 0.34in 1fr 0.42in;
      gap: 0.08in;
      align-items: center;
      min-height: 0.34in;
      border-bottom: 1px solid #bbb;
      padding-bottom: 0.04in;
      font-size: 12pt;
      font-weight: 800;
    }
    .answer-rank,
    .answer-points {
      display: grid;
      place-items: center;
      min-height: 0.3in;
      border: 1px solid #111;
      border-radius: 0.05in;
      font-weight: 900;
    }
    .answer-text {
      text-transform: uppercase;
    }
    @media screen {
      body {
        padding: 24px;
        display: grid;
        gap: 24px;
        justify-content: center;
      }
      .cue-card {
        box-shadow: 0 16px 40px rgba(0,0,0,.22);
      }
    }
  </style>
</head>
<body>
  ${cards}
</body>
</html>`;
}

function printCueCards(sourceData) {
  const printWindow = window.open("", "safety-family-feud-cue-cards");
  if (!printWindow) {
    alert("Pop-up blocked. Allow pop-ups to print cue cards.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildCueCardsHtml(sourceData));
  printWindow.document.close();
  printWindow.focus();
}

function hasSamplePlaceholder(value) {
  return /^sample\s+(question|answer)/i.test(String(value || "").trim());
}

function getContentIssues(gameData) {
  const issues = [];
  const validationError = validateDraft(gameData);
  if (validationError) issues.push(validationError);
  (gameData?.rounds || []).forEach((round, roundIndexForCheck) => {
    if (hasSamplePlaceholder(round.question)) {
      issues.push(`Round ${roundIndexForCheck + 1} still uses a sample question.`);
    }
    (round.answers || []).forEach((answer, answerIndex) => {
      if (hasSamplePlaceholder(answer.text)) {
        issues.push(`Round ${roundIndexForCheck + 1}, answer ${answerIndex + 1} still uses sample text.`);
      }
    });
  });
  return issues;
}

function setPreflightStatus(el, ok, readyText, issueText) {
  if (!el) return;
  el.textContent = ok ? readyText : issueText;
}

async function getOfflineStatus() {
  if (location.protocol === "file:") return { ok: false, text: "Open through localhost or HTTPS for offline/PWA support." };
  if (!("serviceWorker" in navigator)) return { ok: false, text: "This browser does not support service workers." };
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return { ok: false, text: "Service worker is not registered yet. Reload once if this is the first run." };
    return { ok: true, text: "Service worker registered. Offline shell is ready after the first complete load." };
  } catch {
    return { ok: false, text: "Could not confirm service worker registration." };
  }
}

async function updatePreflightStatus() {
  if (!els.preflightPanel) return;
  const currentData = data || getDataFromStorage();
  const contentIssues = getContentIssues(currentData);
  const audioMissing = Object.entries(preflightAudioChecks)
    .filter(([, checked]) => !checked)
    .map(([key]) => key);
  const offline = await getOfflineStatus();
  const width = window.innerWidth || 0;
  const height = window.innerHeight || 0;
  const landscape = width >= height;

  setPreflightStatus(
    els.preflightContentStatus,
    contentIssues.length === 0,
    "Game content is complete and ready.",
    contentIssues.slice(0, 3).join(" ") || "Game content needs attention."
  );
  setPreflightStatus(
    els.preflightAudioStatus,
    audioMissing.length === 0,
    "All sounds have been tested in this browser session.",
    `Test remaining sounds: ${audioMissing.join(", ")}.`
  );
  setPreflightStatus(
    els.preflightAudienceStatus,
    preflightAudienceOpened,
    "Audience display has been opened from this host session.",
    "Open the audience display and confirm it shows the live board."
  );
  setPreflightStatus(els.preflightOfflineStatus, offline.ok, offline.text, offline.text);
  setPreflightStatus(
    els.preflightDisplayStatus,
    landscape && width >= 1000,
    `Viewport is ${width} x ${height}. Landscape display looks ready.`,
    `Viewport is ${width} x ${height}. Use landscape/fullscreen on the event display.`
  );

  const ready = contentIssues.length === 0 && audioMissing.length === 0 && offline.ok && preflightAudienceOpened && landscape;
  if (els.preflightOverall) {
    els.preflightOverall.classList.toggle("ready", ready);
    els.preflightOverall.classList.toggle("attention", !ready);
    els.preflightOverall.textContent = ready ? "Ready for Showtime" : "Needs Attention Before Showtime";
  }
}

function openPreflight() {
  if (!els.preflightPanel) return;
  els.preflightPanel.classList.add("active");
  els.preflightPanel.setAttribute("aria-hidden", "false");
  updatePreflightStatus();
}

function closePreflight() {
  if (!els.preflightPanel) return;
  els.preflightPanel.classList.remove("active");
  els.preflightPanel.setAttribute("aria-hidden", "true");
}

async function testPreflightSound(kind) {
  const clip = audio[kind];
  if (!clip) {
    alert("Sound file is not available.");
    return;
  }
  soundOn = true;
  setSoundUI();
  try {
    clip.currentTime = 0;
    await clip.play();
    preflightAudioChecks[kind] = true;
    if (kind === "theme") {
      setTimeout(() => {
        if (audio.theme && !audio.theme.paused) stopTheme();
      }, 1600);
    }
  } catch {
    alert("The browser blocked audio. Click the sound test again, or check browser audio permissions.");
  }
  updateThemeButtons();
  updatePreflightStatus();
}

function getTeamName(teamKey) {
  const fallback = teamKey === "team2" ? "TEAM 2" : "TEAM 1";
  const input = teamKey === "team2" ? els.team2Name : els.team1Name;
  return (input?.value || fallback).trim() || fallback;
}

function updateAnsweringTeamControls() {
  const controls = {
    team1: els.btnAnsweringTeam1,
    team2: els.btnAnsweringTeam2,
  };

  Object.entries(controls).forEach(([teamKey, button]) => {
    if (!button) return;
    const selected = answeringTeamKey === teamKey;
    button.textContent = getTeamName(teamKey);
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function setAnsweringTeam(teamKey) {
  if (teamKey !== "team1" && teamKey !== "team2") return;
  answeringTeamKey = teamKey;
  updateAnsweringTeamControls();
}

function updateTeamDisplayNames() {
  const t1 = getTeamName("team1");
  const t2 = getTeamName("team2");
  els.team1DisplayName && (els.team1DisplayName.textContent = t1);
  els.team2DisplayName && (els.team2DisplayName.textContent = t2);
  updateAnsweringTeamControls();
}
function updateAwardButtons() {
  const t1 = getTeamName("team1");
  const t2 = getTeamName("team2");
  els.btnAwardTeam1 && (els.btnAwardTeam1.textContent = `Award → ${t1}`);
  els.btnAwardTeam2 && (els.btnAwardTeam2.textContent = `Award → ${t2}`);
}
function renderScores() {
  const t = getTeams();
  els.team1Score && (els.team1Score.textContent = String(t.s1));
  els.team2Score && (els.team2Score.textContent = String(t.s2));
}

function renderStrikes(teamEl, teamKey) {
  teamEl.innerHTML = "";
  for (let i=0;i<3;i++) {
    const btn = document.createElement("div");
    btn.className = "strike" + (i < strikes[teamKey] ? " used" : "");
    btn.textContent = "X";
    btn.addEventListener("click", ()=>addStrike(teamKey));
    teamEl.appendChild(btn);
  }
}
function showBigX() {
  if (!els.bigX) return;
  els.bigX.classList.add("show");
  els.bigX.setAttribute("aria-hidden","false");
  setTimeout(()=>{
    els.bigX.classList.remove("show");
    els.bigX.setAttribute("aria-hidden","true");
  }, 550);
}
function addStrike(teamKey) {
  if (strikes[teamKey] >= 3) return;
  strikes[teamKey] += 1;
  playBuzzer();
  showBigX();
  renderStrikes(teamKey==="team1"?els.team1Strikes:els.team2Strikes, teamKey);
  broadcastSession();
}

function resetRound() {
  revealed = new Set();
  revealedWithoutPoints = new Set();
  roundTotal = 0;
  strikes = { team1:0, team2:0 };
  renderRound();
}

function awardPoints(teamKey) {
  const t = getTeams();
  if (teamKey==="team1") t.s1 += roundTotal; else t.s2 += roundTotal;
  setTeams(t);
  renderScores();
  resetRound();
}

function renderRound() {
  const r = data.rounds[roundIndex];
  els.roundName && (els.roundName.textContent = r.name || `Round ${roundIndex+1}`);
  els.question && (els.question.textContent = r.question || "");
  els.roundTotal && (els.roundTotal.textContent = String(roundTotal));
  renderStrikes(els.team1Strikes, "team1");
  renderStrikes(els.team2Strikes, "team2");
  updateTeamDisplayNames();
  updateAwardButtons();
  els.answers.innerHTML = "";
  const answers = r.answers || [];
  answers.forEach((a, idx)=>{
    const card = document.createElement("div");
    const isShown = revealed.has(idx) || revealedWithoutPoints.has(idx);
    card.className = "card" + (isShown ? " revealed" : "");
    card.dataset.idx = String(idx);
    const inner = document.createElement("div");
    inner.className = "cardInner";
    const front = document.createElement("div");
    front.className = "face front";
    front.innerHTML = `
      <div class="slot">${idx+1}</div>
      <div class="answerText">${escapeHtml(a.text ?? "")}</div>
      <div class="hostAnswerMeta">
        <div class="points">${Number(a.points ?? 0)}</div>
        ${isShown ? "" : `
          <div class="answerActions" aria-label="Host controls for answer ${idx+1}">
            <button class="answerAction answerCorrect" type="button" data-answer-action="correct">Correct</button>
            <button class="answerAction answerStrike" type="button" data-answer-action="strike" aria-label="Wrong answer, add a strike to the answering team">X</button>
          </div>
        `}
      </div>`;
    const back = document.createElement("div");
    back.className = "face back";
    back.innerHTML = `<div class="slot">${idx+1}</div><div class="answerText">${escapeHtml(a.text ?? "")}</div><div class="points">${Number(a.points ?? 0)}</div>`;
    inner.appendChild(front); inner.appendChild(back);
    card.appendChild(inner);
    card.querySelector(".answerCorrect")?.addEventListener("click", (event)=>{
      event.stopPropagation();
      revealAnswer(idx);
    });
    card.querySelector(".answerStrike")?.addEventListener("click", (event)=>{
      event.stopPropagation();
      addStrike(answeringTeamKey);
    });
    els.answers.appendChild(card);
  });
  if ((answers.length % 2)===1) {
    const spacer = document.createElement("div");
    spacer.className="card"; spacer.style.visibility="hidden";
    els.answers.appendChild(spacer);
  }
  renderScores();
  broadcastSession();
}

function revealAnswer(idx, options = {}) {
  const r = data.rounds[roundIndex];
  const a = (r.answers||[])[idx];
  const countPoints = options.countPoints !== false;
  if (!a || revealed.has(idx) || revealedWithoutPoints.has(idx)) return;
  if (countPoints) {
    revealed.add(idx);
    roundTotal += Number(a.points || 0);
    playBell();
  } else {
    revealedWithoutPoints.add(idx);
  }
  const card = els.answers.querySelector(`.card[data-idx="${idx}"]`);
  if (card) card.classList.add("revealed");
  els.roundTotal && (els.roundTotal.textContent = String(roundTotal));
  broadcastSession();
}

function revealRemainingAnswersWithoutPoints() {
  const round = data.rounds[roundIndex];
  const answers = Array.isArray(round?.answers) ? round.answers : [];
  let changed = false;
  answers.forEach((_, idx) => {
    if (revealed.has(idx) || revealedWithoutPoints.has(idx)) return;
    revealedWithoutPoints.add(idx);
    changed = true;
  });
  if (!changed) return;
  renderRound();
}

// EDITOR
let editor = { selectedRoundIndex:0, draft:null, returnTo:"start" };

function openEditor(returnTo) {
  editor.returnTo = returnTo;
  editor.draft = structuredClone(data || DEFAULT_DATA);
  normalizeDraftRounds(editor.draft);
  editor.selectedRoundIndex = Math.min(editor.selectedRoundIndex, Math.max(0, editor.draft.rounds.length-1));
  renderEditor();
  showScreen("editor");
}
function closeEditor() { showScreen(editor.returnTo); }

function commitEditorFields() {
  if (!editor.draft) return;
  editor.draft.title = editorEls.gameTitle.value || "Safety Family Feud";
  const rr = editor.draft.rounds[editor.selectedRoundIndex];
  rr.name = editorEls.roundName.value || `Round ${editor.selectedRoundIndex+1}`;
  rr.question = editorEls.question.value || "";
}

function validateDraft(d) {
  if (!d || !Array.isArray(d.rounds) || d.rounds.length===0) return "Please have at least one round.";
  if (!String(d.title || "").trim()) return "Game title is required.";
  for (let i=0;i<d.rounds.length;i++) {
    const r=d.rounds[i];
    if (!String(r.question || "").trim()) return `Round ${i+1} needs a question.`;
    if (!Array.isArray(r.answers) || r.answers.length===0) return `Round ${i+1} needs at least one answer.`;
    let pointTotal = 0;
    for (let j=0;j<r.answers.length;j++) {
      const a=r.answers[j];
      if (!String(a.text||"").trim()) return `Round ${i+1}, answer ${j+1} needs text.`;
      if (!Number.isFinite(Number(a.points))) return `Round ${i+1}, answer ${j+1} needs valid points.`;
      pointTotal += Number(a.points || 0);
    }
    if (pointTotal <= 0) return `Round ${i+1} needs at least one point.`;
  }
  return null;
}

function saveEditorDraft() {
  commitEditorFields();
  normalizeDraftRounds(editor.draft);
  const err = validateDraft(editor.draft);
  if (err) { alert(err); return; }
  data = setDataToStorage(editor.draft);
  renderGameLibraryControls();
  els.gameTitle && (els.gameTitle.textContent = data.title || "Safety Family Feud");
  closeEditor();
  if (editor.returnTo==="game") { roundIndex = Math.min(roundIndex, data.rounds.length-1); resetRound(); }
  else { broadcastSession(); }
}

function exportEditorDraft() {
  commitEditorFields();
  normalizeDraftRounds(editor.draft);
  const err = validateDraft(editor.draft);
  if (err) { alert(err); return; }
  const payload = {
    format: "safety-family-feud-game-v1",
    exportedAt: new Date().toISOString(),
    game: {
      ...getActiveGameRecord(),
      title: editor.draft.title,
      rounds: editor.draft.rounds,
    },
  };
  downloadJson(payload, `${sanitizeFileName(editor.draft.title)}.json`);
}
function importEditorFile(file) {
  const reader = new FileReader();
  reader.onload = ()=>{
    try {
      const parsed = JSON.parse(String(reader.result||""));
      const importedData = normalizeGameData(extractImportedGameData(parsed));
      const err=validateDraft(importedData);
      if (err) { alert("Import failed: "+err); return; }
      editor.draft = importedData;
      editor.selectedRoundIndex = 0;
      renderEditor();
    } catch {
      alert("Import failed: Invalid file.");
    }
  };
  reader.readAsText(file);
}

function triggerEditorRebalanceCue(input) {
  if (!input) return;
  input.classList.remove("rebalanceCue");
  void input.offsetWidth;
  input.classList.add("rebalanceCue");
  clearTimeout(input._rebalanceCueTimeout);
  input._rebalanceCueTimeout = setTimeout(() => {
    input.classList.remove("rebalanceCue");
  }, 720);
}

function queueEditorPointCues(round, previousValues = []) {
  if (!round || !Array.isArray(round.answers)) {
    editor.pendingPointCueIndices = [];
    return;
  }
  editor.pendingPointCueIndices = round.answers.reduce((indexes, answer, index) => {
    const nextValue = Number(answer.points || 0);
    const previousValue = Number(previousValues[index]);
    if (!Number.isFinite(previousValue) || previousValue !== nextValue) indexes.push(index);
    return indexes;
  }, []);
}

function flushEditorPointCues() {
  const pending = Array.isArray(editor.pendingPointCueIndices) ? editor.pendingPointCueIndices : [];
  if (!pending.length || !editorEls.answersEditor) {
    editor.pendingPointCueIndices = [];
    return;
  }
  pending.forEach((index) => {
    const input = editorEls.answersEditor.querySelector(`input.pointsInput[data-aidx="${index}"]`);
    if (input) triggerEditorRebalanceCue(input);
  });
  editor.pendingPointCueIndices = [];
}

function syncEditorPointInputs(round, activeIndex = -1, caretPosition = null) {
  if (!round || !Array.isArray(round.answers) || !editorEls.answersEditor) return;
  editorEls.answersEditor.querySelectorAll("input.pointsInput").forEach((input) => {
    const inputIndex = Number(input.dataset.aidx);
    const answer = round.answers[inputIndex];
    if (!answer) return;

    const nextValue = String(Number(answer.points || 0));
    if (inputIndex === activeIndex && document.activeElement === input) {
      input.value = nextValue;
      const nextCaret = typeof caretPosition === "number"
        ? Math.min(caretPosition, nextValue.length)
        : nextValue.length;
      try { input.setSelectionRange(nextCaret, nextCaret); } catch {}
      return;
    }

    if (input.value !== nextValue) {
      input.value = nextValue;
      triggerEditorRebalanceCue(input);
    }
  });
}

function renderEditor() {
  if (!editor.draft) return;
  editorEls.gameTitle.value = editor.draft.title || "";
  editorEls.roundList.innerHTML = "";
  editor.draft.rounds.forEach((r,idx)=>{
    const item=document.createElement("div");
    item.className="roundItem"+(idx===editor.selectedRoundIndex?" active":"");
    const title=r.name||`Round ${idx+1}`;
    const q=(r.question||"").trim();
    const totalLabel = isFinalRound(r) ? "Final Round · 200 Points" : "100 Points";
    item.innerHTML=`<div class="roundItemTitle">${escapeHtml(title)}</div><div class="roundItemMeta">${escapeHtml(totalLabel)}</div><div class="roundItemSub">${escapeHtml(q? (q.slice(0,70)+(q.length>70?"…":"")):"No question yet")}</div>`;
    item.addEventListener("click",()=>{ commitEditorFields(); editor.selectedRoundIndex=idx; renderEditor(); });
    editorEls.roundList.appendChild(item);
  });
  const rr = editor.draft.rounds[editor.selectedRoundIndex];
  editorEls.roundName.value = rr.name || "";
  editorEls.question.value = rr.question || "";
  editorEls.roundTotal && (editorEls.roundTotal.textContent = isFinalRound(rr) ? "Final Round Total: 200" : "Round Total: 100");
  if (editorEls.btnAddFinalRound) {
    const hasFinalRound = editor.draft.rounds.some((round) => isFinalRound(round));
    editorEls.btnAddFinalRound.disabled = hasFinalRound;
    editorEls.btnAddFinalRound.textContent = hasFinalRound ? "Final Round Added" : "Add Final Round";
  }
  if (editorEls.btnMoveRoundUp) {
    editorEls.btnMoveRoundUp.disabled = editor.selectedRoundIndex <= 0;
  }
  if (editorEls.btnMoveRoundDown) {
    editorEls.btnMoveRoundDown.disabled = editor.selectedRoundIndex >= editor.draft.rounds.length - 1;
  }
  editorEls.answersEditor.innerHTML = "";
  rr.answers.forEach((a,aIdx)=>{
    const row=document.createElement("div");
    row.className="answersRow";
    row.innerHTML=`
      <input class="answerInput" type="text" value="${escapeHtml(a.text ?? "")}" data-atype="text" data-aidx="${aIdx}" aria-label="Answer text ${aIdx+1}"/>
      <input class="pointsInput" type="text" inputmode="numeric" pattern="[0-9]*" value="${Number(a.points ?? 0)}" data-atype="points" data-aidx="${aIdx}" aria-label="Answer points ${aIdx+1}"/>
      <div class="colActions"><button class="iconBtn" type="button" data-del="${aIdx}" title="Remove">🗑</button></div>
    `;
    editorEls.answersEditor.appendChild(row);
  });
  editorEls.answersEditor.querySelectorAll("input.answerInput").forEach(inp=>{
    inp.addEventListener("input",()=>{
      const idx=Number(inp.dataset.aidx);
      const rrr=editor.draft.rounds[editor.selectedRoundIndex];
      if (!rrr.answers[idx]) return;
      rrr.answers[idx].text = inp.value;
    });
  });

  editorEls.answersEditor.querySelectorAll("input.pointsInput").forEach(inp=>{
    // while typing: sanitize + rebalance live without rerendering the whole editor
    inp.addEventListener("input",()=>{
      const idx=Number(inp.dataset.aidx);
      const rrr=editor.draft.rounds[editor.selectedRoundIndex];
      if (!rrr.answers[idx]) return;
      const cleaned = inp.value.replace(/[^\d]/g,"");
      inp.value = cleaned;
      rrr.answers[idx].points = Number(cleaned||0);
      if (!cleaned) return;
      const caretPosition = inp.selectionStart ?? cleaned.length;
      adjustOthersToTotal(rrr, idx);
      syncEditorPointInputs(rrr, idx, caretPosition);
    });

    // on TAB / click-out: rebalance to the round total
    inp.addEventListener("blur",()=>{
      const idx=Number(inp.dataset.aidx);
      const rrr=editor.draft.rounds[editor.selectedRoundIndex];
      if (!rrr.answers[idx]) return;

      const cleaned = inp.value.replace(/[^\d]/g,"");
      inp.value = cleaned;
      rrr.answers[idx].points = Number(cleaned||0);

      adjustOthersToTotal(rrr, idx);
      renderEditor();
    });
  });
  editorEls.answersEditor.querySelectorAll("button.iconBtn").forEach(btn=>{
    btn.addEventListener("click",(e)=>{
      e.preventDefault();
      const del=Number(btn.dataset.del);
      const rrr=editor.draft.rounds[editor.selectedRoundIndex];
      const previousValues = rrr.answers
        .filter((_, i) => i !== del)
        .map((answer) => Number(answer.points || 0));
      rrr.answers = rrr.answers.filter((_,i)=>i!==del);
      rebalanceRoundPointsForAnswerCount(rrr, previousValues);
      queueEditorPointCues(rrr, previousValues);
      renderEditor();
    });
  });
  flushEditorPointCues();
}

function resetGameScoresOnly() {
  const t=getTeams();
  t.s1=0; t.s2=0;
  setTeams(t);
  renderScores();
  roundIndex=0;
  revealed=new Set();
  revealedWithoutPoints=new Set();
  roundTotal=0;
  strikes={team1:0, team2:0};
  broadcastSession();
}

function addEditorRound(pointTotal = 100) {
  commitEditorFields();
  if (!editor.draft) return;

  if (pointTotal === 200) {
    const existingFinalIndex = editor.draft.rounds.findIndex((round) => isFinalRound(round));
    if (existingFinalIndex !== -1) {
      editor.selectedRoundIndex = existingFinalIndex;
      renderEditor();
      alert("A final round already exists.");
      return;
    }
  }

  const next = (editor.draft.rounds?.length || 0) + 1;
  const newRound = createRoundTemplate(pointTotal === 200 ? "Final Round" : `Round ${next}`, pointTotal);
  const insertAt = pointTotal === 200
    ? editor.draft.rounds.length
    : editor.draft.rounds.findIndex((round) => isFinalRound(round));

  if (insertAt === -1) {
    editor.draft.rounds.push(newRound);
    editor.selectedRoundIndex = editor.draft.rounds.length - 1;
  } else {
    editor.draft.rounds.splice(insertAt, 0, newRound);
    editor.selectedRoundIndex = insertAt;
  }

  normalizeDraftRounds(editor.draft);
  renderEditor();
}

async function init() {
  await ensureGameLibrary();
  data = getDataFromStorage();
  setupInstallPrompt();
  bindAudienceCommandListeners();
  els.gameTitle && (els.gameTitle.textContent = data.title || "Safety Family Feud");
  renderGameLibraryControls();
  setSoundUI();
  updateThemeButtons();

  const t=getTeams();
  els.team1Name && (els.team1Name.value = t.team1 || "TEAM 1");
  els.team2Name && (els.team2Name.value = t.team2 || "TEAM 2");
  updateTeamDisplayNames();
  updateAwardButtons();
  renderScores();

  const persistNames = ()=>{
    const tt=getTeams();
    tt.team1 = (els.team1Name.value || "TEAM 1").toUpperCase();
    tt.team2 = (els.team2Name.value || "TEAM 2").toUpperCase();
    setTeams(tt);
    updateTeamDisplayNames();
    updateAwardButtons();
    broadcastSession();
  };
  els.team1Name?.addEventListener("input", persistNames);
  els.team2Name?.addEventListener("input", persistNames);

  els.gameSelect?.addEventListener("change", () => {
    if (!els.gameSelect.value) return;
    setActiveGameId(els.gameSelect.value);
    loadActiveGameIntoRuntime({ resetScores: true });
  });
  els.btnNewGame?.addEventListener("click", () => {
    createNewGame();
    loadActiveGameIntoRuntime({ resetScores: true });
  });
  els.btnDuplicateGame?.addEventListener("click", () => {
    duplicateActiveGame();
    loadActiveGameIntoRuntime({ resetScores: true });
  });
  els.btnDeleteGame?.addEventListener("click", () => {
    const active = getActiveGameRecord();
    const name = active?.title || "this game";
    if (!confirm(`Delete "${name}"? This only removes it from this browser.`)) return;
    deleteActiveGame();
    loadActiveGameIntoRuntime({ resetScores: true });
  });
  els.btnImportGame?.addEventListener("click", () => els.fileGameImport?.click());
  els.fileGameImport?.addEventListener("change", () => {
    const file = els.fileGameImport.files?.[0];
    if (file) handleGameImportFile(file);
    els.fileGameImport.value = "";
  });
  els.btnExportGame?.addEventListener("click", exportActiveGame);
  els.btnPrintCueCards?.addEventListener("click", () => printCueCards(data || getDataFromStorage()));
  els.btnPreflight?.addEventListener("click", openPreflight);
  els.btnClosePreflight?.addEventListener("click", closePreflight);
  els.preflightPanel?.addEventListener("click", (event) => {
    if (event.target === els.preflightPanel) closePreflight();
  });
  els.btnTestTheme?.addEventListener("click", () => testPreflightSound("theme"));
  els.btnTestBell?.addEventListener("click", () => testPreflightSound("bell"));
  els.btnTestBuzzer?.addEventListener("click", () => testPreflightSound("buzzer"));
  els.btnPreflightAudience?.addEventListener("click", openAudienceDisplay);

  els.btnStart?.addEventListener("click",()=>{
    const err = validateDraft(data);
    if (err) { alert(`Finish the active game before starting: ${err}`); return; }
    setAnsweringTeam("team1");
    playTheme(); showScreen("game"); resetRound();
  });

  els.btnResetGame?.addEventListener("click",()=>{
    if (confirm("Reset scores and start a new game?")) {
      resetGameScoresOnly();
      alert("Scores reset. Enter team names and press Start.");
    }
  });

  const toggleSound=()=>{ soundOn=!soundOn; setSoundUI(); if(!soundOn) stopTheme(); updateThemeButtons(); };
  els.btnSound?.addEventListener("click", toggleSound);
  els.btnSoundInGame?.addEventListener("click", toggleSound);
  els.btnStopMusic?.addEventListener("click", toggleTheme);
  els.btnStopMusicInGame?.addEventListener("click", toggleTheme);

  els.btnEdit?.addEventListener("click",()=>openEditor("start"));
  els.btnEditInGame?.addEventListener("click",()=>openEditor("game"));
  els.btnOpenAudience?.addEventListener("click", openAudienceDisplay);
  els.btnOpenAudienceInGame?.addEventListener("click", openAudienceDisplay);

  editorEls.btnBack?.addEventListener("click", closeEditor);
  editorEls.btnSave?.addEventListener("click", saveEditorDraft);
  editorEls.btnExport?.addEventListener("click", exportEditorDraft);
  editorEls.btnPrintCueCards?.addEventListener("click", () => {
    commitEditorFields();
    normalizeDraftRounds(editor.draft);
    const err = validateDraft(editor.draft);
    if (err) { alert(err); return; }
    printCueCards(editor.draft);
  });
  editorEls.btnImport?.addEventListener("click", ()=>editorEls.fileImport?.click());
  editorEls.fileImport?.addEventListener("change",()=>{ const f=editorEls.fileImport.files?.[0]; if(f) importEditorFile(f); editorEls.fileImport.value=""; });

  editorEls.btnAddRound?.addEventListener("click",()=>addEditorRound(100));
  editorEls.btnAddFinalRound?.addEventListener("click",()=>addEditorRound(200));
  editorEls.btnMoveRoundUp?.addEventListener("click",()=>{
    commitEditorFields();
    const idx = editor.selectedRoundIndex;
    if (!editor.draft || idx <= 0) return;
    const rounds = editor.draft.rounds;
    [rounds[idx - 1], rounds[idx]] = [rounds[idx], rounds[idx - 1]];
    editor.selectedRoundIndex = idx - 1;
    normalizeDraftRounds(editor.draft);
    renderEditor();
  });
  editorEls.btnMoveRoundDown?.addEventListener("click",()=>{
    commitEditorFields();
    const idx = editor.selectedRoundIndex;
    if (!editor.draft || idx >= editor.draft.rounds.length - 1) return;
    const rounds = editor.draft.rounds;
    [rounds[idx + 1], rounds[idx]] = [rounds[idx], rounds[idx + 1]];
    editor.selectedRoundIndex = idx + 1;
    normalizeDraftRounds(editor.draft);
    renderEditor();
  });

  editorEls.btnDeleteRound?.addEventListener("click",()=>{
    if (!editor.draft || editor.draft.rounds.length<=1) { alert("You must have at least one round."); return; }
    const name = editor.draft.rounds[editor.selectedRoundIndex]?.name || `Round ${editor.selectedRoundIndex+1}`;
    if (!confirm(`Delete ${name}?`)) return;
    editor.draft.rounds.splice(editor.selectedRoundIndex,1);
    normalizeDraftRounds(editor.draft);
    editor.selectedRoundIndex=Math.max(0, editor.selectedRoundIndex-1);
    renderEditor();
  });

  editorEls.btnAddAnswer?.addEventListener("click",()=>{
    commitEditorFields();
    const rr=editor.draft.rounds[editor.selectedRoundIndex];
    const previousValues = rr.answers.map((answer) => Number(answer.points || 0));
    rr.answers.push({text:"", points:0});
    rebalanceRoundPointsForAnswerCount(rr, previousValues);
    queueEditorPointCues(rr, previousValues);
    renderEditor();
  });

  els.btnBackToStart?.addEventListener("click",()=>{ stopTheme(); showScreen("start"); });

  els.btnPrevRound?.addEventListener("click",()=>{ roundIndex=(roundIndex-1+data.rounds.length)%data.rounds.length; resetRound(); });
  els.btnNextRound?.addEventListener("click",()=>{ roundIndex=(roundIndex+1)%data.rounds.length; resetRound(); });

  els.btnAwardTeam1?.addEventListener("click",()=>awardPoints("team1"));
  els.btnAwardTeam2?.addEventListener("click",()=>awardPoints("team2"));
  els.btnAnsweringTeam1?.addEventListener("click",()=>setAnsweringTeam("team1"));
  els.btnAnsweringTeam2?.addEventListener("click",()=>setAnsweringTeam("team2"));
  els.btnRevealRemaining?.addEventListener("click", revealRemainingAnswersWithoutPoints);
  els.btnResetRound?.addEventListener("click", resetRound);

  window.addEventListener("keydown",(e)=>{
    if (!els.gameScreen.classList.contains("active")) return;
    const k=e.key.toLowerCase();
    if (k>="1" && k<="8") return revealAnswer(Number(k)-1);
    if (k==="x") return addStrike(answeringTeamKey);
    if (k==="m") return addStrike("team2");
    if (k==="r") return resetRound();
    if (k==="escape") { stopTheme(); showScreen("start"); }
  });

  showScreen("start");
}
registerServiceWorker();
if (isAudienceView) initAudience(); else init();



