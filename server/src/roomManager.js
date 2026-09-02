import {
  generateRoomCode,
  generateBoard,
  remainingCounts,
  switchTurn,
  endGame,
  otherTeam,
  canStartGame,
  TEAMS,
  TIEBREAK_ANIMATION_MS,
} from "./gameLogic.js";
import { DIFFICULTIES } from "./words.js";

const rooms = new Map(); // roomCode -> room
const socketIndex = new Map(); // socketId -> { roomCode, clientId }

const MAX_NICKNAME_LENGTH = 20;
const MAX_CLUE_LENGTH = 30;
const MAX_PLAYERS_PER_ROOM = 20;

function sanitizeNickname(raw) {
  const trimmed = String(raw ?? "").trim().slice(0, MAX_NICKNAME_LENGTH);
  return trimmed || "Oyuncu";
}

function normalizeWord(w) {
  return String(w ?? "").trim().toLocaleLowerCase("tr-TR");
}

function isNicknameTaken(room, name) {
  const normalized = name.trim().toLowerCase();
  for (const p of room.players.values()) {
    if (p.name.trim().toLowerCase() === normalized) return true;
  }
  return false;
}

function makePlayer({ clientId, socketId, name, isHost }) {
  return {
    clientId,
    socketId,
    name,
    team: null,
    role: null,
    connected: true,
    isHost,
    joinedAt: Date.now(),
  };
}

function makeRoom(code, expectedPlayers) {
  return {
    code,
    hostClientId: null,
    expectedPlayers: expectedPlayers || null,
    players: new Map(), // clientId -> player
    phase: "lobby", // lobby | voting | tiebreak | playing | ended
    board: [],
    turn: null,
    startingTeam: null,
    clue: null,
    winner: null,
    winReason: null,
    turnEndsAt: null,
    turnTimeoutHandle: null,
    // Each team's very first clue-giving turn of the match has no time
    // limit; set to true the moment that free turn is consumed.
    firstTurnGiven: { red: false, blue: false },
    // Whether the *current* turn is exempt from timing (true only while
    // playing out a team's free first turn). Decided once when the turn
    // starts and reused when the clue-phase timer hands off to the
    // guessing-phase timer.
    turnUntimed: false,
    // clientId -> "easy" | "medium" | "hard", collected during phase "voting".
    modeVotes: new Map(),
    difficulty: null,
    // Set during phase "tiebreak": { options, winner, endsAt }. The winner
    // is already decided server-side; endsAt just paces the reveal
    // animation shown to everyone.
    tiebreak: null,
    tiebreakTimeoutHandle: null,
    matchScore: { red: 0, blue: 0 },
    createdAt: Date.now(),
  };
}

export function getRoom(code) {
  return rooms.get(String(code || "").toUpperCase());
}

export function getRoomForSocket(socketId) {
  const meta = socketIndex.get(socketId);
  if (!meta) return { room: null, clientId: null };
  const room = rooms.get(meta.roomCode);
  return { room, clientId: meta.clientId };
}

export function createRoom({ socketId, clientId, nickname, expectedPlayers }) {
  const code = generateRoomCode(new Set(rooms.keys()));
  const room = makeRoom(code, expectedPlayers);
  const player = makePlayer({
    clientId,
    socketId,
    name: sanitizeNickname(nickname),
    isHost: true,
  });
  room.hostClientId = clientId;
  room.players.set(clientId, player);
  rooms.set(code, room);
  socketIndex.set(socketId, { roomCode: code, clientId });
  return { ok: true, room };
}

export function joinRoom({ socketId, clientId, nickname, roomCode }) {
  const room = getRoom(roomCode);
  if (!room) return { ok: false, error: "Oda bulunamadı. Kodu kontrol edin." };
  if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
    return { ok: false, error: "Oda dolu." };
  }
  // Reconnection of a client that already has a seat.
  const existing = room.players.get(clientId);
  if (existing) {
    existing.socketId = socketId;
    existing.connected = true;
    socketIndex.set(socketId, { roomCode: room.code, clientId });
    return { ok: true, room };
  }
  const cleanNickname = sanitizeNickname(nickname);
  if (isNicknameTaken(room, cleanNickname)) {
    return { ok: false, error: "Bu isim bu odada zaten kullanılıyor. Farklı bir rumuz deneyin." };
  }
  const player = makePlayer({
    clientId,
    socketId,
    name: cleanNickname,
    isHost: false,
  });
  room.players.set(clientId, player);
  socketIndex.set(socketId, { roomCode: room.code, clientId });
  return { ok: true, room };
}

export function rejoinRoom({ socketId, clientId, roomCode }) {
  const room = getRoom(roomCode);
  if (!room) return { ok: false, error: "Oda artık mevcut değil." };
  const player = room.players.get(clientId);
  if (!player) return { ok: false, error: "Bu odada bir oyuncu kaydınız yok." };
  player.socketId = socketId;
  player.connected = true;
  socketIndex.set(socketId, { roomCode: room.code, clientId });
  return { ok: true, room };
}

export function handleDisconnect(socketId) {
  const meta = socketIndex.get(socketId);
  if (!meta) return null;
  socketIndex.delete(socketId);
  const room = rooms.get(meta.roomCode);
  if (!room) return null;
  const player = room.players.get(meta.clientId);
  if (player && player.socketId === socketId) {
    player.connected = false;
  }
  return room;
}

export function leaveRoom(socketId) {
  const meta = socketIndex.get(socketId);
  if (!meta) return null;
  const room = rooms.get(meta.roomCode);
  if (!room) return null;
  room.players.delete(meta.clientId);
  socketIndex.delete(socketId);
  if (room.hostClientId === meta.clientId) {
    const next = [...room.players.values()][0];
    room.hostClientId = next ? next.clientId : null;
    if (next) next.isHost = true;
  }
  if (room.players.size === 0) {
    clearTurnTimer(room);
    clearTiebreakTimer(room);
    rooms.delete(room.code);
    return null;
  }
  return room;
}

export function clearTurnTimer(room) {
  if (room.turnTimeoutHandle) {
    clearTimeout(room.turnTimeoutHandle);
    room.turnTimeoutHandle = null;
  }
}

export function clearTiebreakTimer(room) {
  if (room.tiebreakTimeoutHandle) {
    clearTimeout(room.tiebreakTimeoutHandle);
    room.tiebreakTimeoutHandle = null;
  }
}

// ---- Game actions ----

export function selectRole({ room, clientId, team, role }) {
  if (room.phase !== "lobby") return { ok: false, error: "Oyun zaten başladı." };
  if (!TEAMS.includes(team)) return { ok: false, error: "Geçersiz takım." };
  if (!["spymaster", "operative"].includes(role)) {
    return { ok: false, error: "Geçersiz rol." };
  }
  const player = room.players.get(clientId);
  if (!player) return { ok: false, error: "Oyuncu bulunamadı." };

  if (role === "spymaster") {
    const occupied = [...room.players.values()].some(
      (p) => p.clientId !== clientId && p.team === team && p.role === "spymaster"
    );
    if (occupied) return { ok: false, error: "Bu ajan yuvası dolu." };
  }

  player.team = team;
  player.role = role;
  return { ok: true };
}

export function clearRole({ room, clientId }) {
  if (room.phase !== "lobby") return { ok: false, error: "Oyun zaten başladı." };
  const player = room.players.get(clientId);
  if (!player) return { ok: false, error: "Oyuncu bulunamadı." };
  player.team = null;
  player.role = null;
  return { ok: true };
}

export function randomizeTeams({ room, clientId }) {
  if (clientId !== room.hostClientId) {
    return { ok: false, error: "Sadece oda kurucusu rastgele dağıtabilir." };
  }
  if (room.phase !== "lobby") return { ok: false, error: "Oyun zaten başladı." };
  const players = [...room.players.values()];
  if (players.length < 4) {
    return { ok: false, error: "Rastgele dağıtım için en az 4 oyuncu gerekli." };
  }
  const shuffled = players
    .map((p) => ({ p, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.p);

  const half = Math.ceil(shuffled.length / 2);
  const redGroup = shuffled.slice(0, half);
  const blueGroup = shuffled.slice(half);

  redGroup.forEach((p, i) => {
    p.team = "red";
    p.role = i === 0 ? "spymaster" : "operative";
  });
  blueGroup.forEach((p, i) => {
    p.team = "blue";
    p.role = i === 0 ? "spymaster" : "operative";
  });

  return { ok: true };
}

export function startGame({ room, clientId }) {
  if (clientId !== room.hostClientId) {
    return { ok: false, error: "Sadece oda kurucusu oyunu başlatabilir." };
  }
  if (room.phase !== "lobby") return { ok: false, error: "Oyun zaten başladı." };
  if (!canStartGame(room)) {
    return {
      ok: false,
      error: "Her takımda 1 Ajan ve en az 1 Operatör olmalı.",
    };
  }
  room.phase = "voting";
  room.modeVotes = new Map();
  return { ok: true, votingStarted: true };
}

function countVotes(modeVotes) {
  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const vote of modeVotes.values()) counts[vote] = (counts[vote] || 0) + 1;
  return counts;
}

// Oy dağılımına göre sonucu belirler. Tek bir mod en yüksek oyu aldıysa
// `tied: false` ile doğrudan döner. Birden fazla mod eşit oy aldıysa,
// kazanan yine de hemen (rastgele) belirlenir — ama `tied: true` ile
// işaretlenir, böylece çağıran taraf sonucu göstermeden önce herkesin
// göreceği bir yazı-tura/rulet animasyonu başlatabilir.
function resolveVoteOutcome(modeVotes) {
  const counts = countVotes(modeVotes);
  const max = Math.max(...Object.values(counts));
  if (max === 0) return { winner: "medium", tied: false, options: ["medium"] };
  const top = DIFFICULTIES.filter((d) => counts[d] === max);
  const winner = top[Math.floor(Math.random() * top.length)];
  return { winner, tied: top.length > 1, options: top };
}

function beginMatch(room, difficulty) {
  // First match of the room: pick randomly. A rematch (room.startingTeam
  // already set from a previous match): alternate so both teams get a turn
  // at the first-move advantage over a session.
  const startingTeam = room.startingTeam
    ? otherTeam(room.startingTeam)
    : Math.random() < 0.5
    ? "red"
    : "blue";
  room.board = generateBoard(startingTeam, difficulty);
  room.startingTeam = startingTeam;
  room.turn = startingTeam;
  room.difficulty = difficulty;
  room.clue = null;
  room.winner = null;
  room.winReason = null;
  room.phase = "playing";
  room.firstTurnGiven = { red: false, blue: false };
  room.turnUntimed = false;
  room.modeVotes = new Map();
  room.tiebreak = null;
}

// Oylamayı kapatır: tek kazanan varsa maçı doğrudan başlatır; eşitlik
// varsa "tiebreak" fazına geçer (kazanan zaten belli, ama gösterimi
// index.js'teki zamanlayıcı yönetir).
function finishVoting(room) {
  const outcome = resolveVoteOutcome(room.modeVotes);
  room.modeVotes = new Map();
  if (!outcome.tied) {
    beginMatch(room, outcome.winner);
    return { tiebreakStarted: false };
  }
  room.phase = "tiebreak";
  room.tiebreak = {
    options: outcome.options,
    winner: outcome.winner,
    endsAt: Date.now() + TIEBREAK_ANIMATION_MS,
  };
  return { tiebreakStarted: true };
}

// Animasyon süresi dolunca çağrılır: tiebreak sonucunu uygulayıp maçı
// kararlaştırılmış zorlukla başlatır.
export function resolveTiebreak(room) {
  if (room.phase !== "tiebreak" || !room.tiebreak) return { ok: false };
  const { winner } = room.tiebreak;
  beginMatch(room, winner);
  return { ok: true, newTurnStarted: true };
}

export function castVote({ room, clientId, difficulty }) {
  if (room.phase !== "voting") return { ok: false, error: "Şu anda oylama aktif değil." };
  if (!DIFFICULTIES.includes(difficulty)) return { ok: false, error: "Geçersiz zorluk seviyesi." };
  const player = room.players.get(clientId);
  if (!player) return { ok: false, error: "Oyuncu bulunamadı." };

  room.modeVotes.set(clientId, difficulty);

  const connectedIds = [...room.players.values()].filter((p) => p.connected).map((p) => p.clientId);
  const allVoted = connectedIds.every((id) => room.modeVotes.has(id));
  if (allVoted) {
    const { tiebreakStarted } = finishVoting(room);
    return { ok: true, newTurnStarted: !tiebreakStarted, tiebreakStarted };
  }
  return { ok: true, voteRecorded: true };
}

export function forceFinalizeVoting({ room, clientId }) {
  if (clientId !== room.hostClientId) {
    return { ok: false, error: "Sadece oda kurucusu oylamayı sonlandırabilir." };
  }
  if (room.phase !== "voting") return { ok: false, error: "Oylama aktif değil." };
  const { tiebreakStarted } = finishVoting(room);
  return { ok: true, newTurnStarted: !tiebreakStarted, tiebreakStarted };
}

export function giveClue({ room, clientId, word, number }) {
  if (room.phase !== "playing") return { ok: false, error: "Oyun aktif değil." };
  const player = room.players.get(clientId);
  if (!player || player.team !== room.turn || player.role !== "spymaster") {
    return { ok: false, error: "Şu anda sadece sıradaki takımın ajanı ipucu verebilir." };
  }
  if (room.clue) return { ok: false, error: "Bu tur için zaten bir ipucu verildi." };

  const cleanWord = String(word ?? "").trim().slice(0, MAX_CLUE_LENGTH);
  const num = Number(number);
  if (!cleanWord) return { ok: false, error: "İpucu kelimesi boş olamaz." };
  if (/\s/.test(cleanWord)) {
    return { ok: false, error: "İpucu sadece tek kelime olabilir." };
  }
  if (!Number.isInteger(num) || num < 0 || num > 9) {
    return { ok: false, error: "Sayı 0 ile 9 arasında olmalı." };
  }
  const normalizedClue = normalizeWord(cleanWord);
  const isOnBoard = room.board.some((cell) => normalizeWord(cell.word) === normalizedClue);
  if (isOnBoard) {
    return { ok: false, error: "İpucu, tahtadaki bir kelime olamaz." };
  }

  room.clue = {
    word: cleanWord,
    number: num,
    guessesLeft: num === 0 ? Infinity : num + 1,
    by: clientId,
  };
  return { ok: true, clueGiven: true };
}

export function revealCard({ room, clientId, cardIndex }) {
  if (room.phase !== "playing") return { ok: false, error: "Oyun aktif değil." };
  const player = room.players.get(clientId);
  if (!player || player.team !== room.turn || player.role !== "operative") {
    return { ok: false, error: "Şu anda sadece sıradaki takımın operatörü kart açabilir." };
  }
  if (!room.clue) return { ok: false, error: "Önce ajanın ipucu vermesi gerekiyor." };

  const cell = room.board[cardIndex];
  if (!cell || cell.revealed) return { ok: false, error: "Geçersiz veya zaten açılmış kart." };

  cell.revealed = true;
  const color = cell.color;

  if (color === "assassin") {
    endGame(room, otherTeam(room.turn), "assassin");
    return { ok: true, gameEnded: true, color };
  }

  const counts = remainingCounts(room.board);
  if (counts.red === 0) {
    endGame(room, "red", "all_words_found");
    return { ok: true, gameEnded: true, color };
  }
  if (counts.blue === 0) {
    endGame(room, "blue", "all_words_found");
    return { ok: true, gameEnded: true, color };
  }

  if (color === room.turn) {
    if (room.clue.guessesLeft !== Infinity) {
      room.clue.guessesLeft -= 1;
      if (room.clue.guessesLeft <= 0) {
        switchTurn(room);
        return { ok: true, turnEnded: true, color };
      }
    }
    return { ok: true, color };
  }

  switchTurn(room);
  return { ok: true, turnEnded: true, color };
}

export function endTurn({ room, clientId }) {
  if (room.phase !== "playing") return { ok: false, error: "Oyun aktif değil." };
  const player = room.players.get(clientId);
  if (!player || player.team !== room.turn || player.role !== "operative") {
    return { ok: false, error: "Sadece sıradaki takımın operatörü turu bitirebilir." };
  }
  if (!room.clue) return { ok: false, error: "Henüz bir ipucu verilmedi." };
  switchTurn(room);
  return { ok: true, turnEnded: true };
}

export function forceTimeoutTurn(room) {
  if (room.phase !== "playing") return { ok: false };
  switchTurn(room);
  return { ok: true, turnEnded: true };
}

export function restartGame({ room, clientId }) {
  if (clientId !== room.hostClientId) {
    return { ok: false, error: "Sadece oda kurucusu yeni oyun başlatabilir." };
  }
  if (room.phase !== "ended") return { ok: false, error: "Oyun henüz bitmedi." };
  room.phase = "voting";
  room.modeVotes = new Map();
  return { ok: true, votingStarted: true };
}

export function returnToLobby({ room, clientId }) {
  if (clientId !== room.hostClientId) {
    return { ok: false, error: "Sadece oda kurucusu lobiye dönebilir." };
  }
  if (room.phase === "lobby") return { ok: false, error: "Zaten lobidesiniz." };
  clearTurnTimer(room);
  clearTiebreakTimer(room);
  room.board = [];
  room.turn = null;
  room.startingTeam = null;
  room.clue = null;
  room.winner = null;
  room.winReason = null;
  room.turnEndsAt = null;
  room.modeVotes = new Map();
  room.difficulty = null;
  room.tiebreak = null;
  room.phase = "lobby";
  return { ok: true };
}

// ---- Serialization ----

export function getPublicState(room, forClientId) {
  const me = room.players.get(forClientId) || null;
  const canSeeAllColors = me?.role === "spymaster" || room.phase === "ended";

  const players = [...room.players.values()]
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((p) => ({
      clientId: p.clientId,
      name: p.name,
      team: p.team,
      role: p.role,
      connected: p.connected,
      isHost: p.clientId === room.hostClientId,
    }));

  const board = room.board.map((cell) => {
    if (cell.revealed || canSeeAllColors) {
      return { id: cell.id, word: cell.word, color: cell.color, revealed: cell.revealed };
    }
    return { id: cell.id, word: cell.word, color: null, revealed: false };
  });

  return {
    code: room.code,
    phase: room.phase,
    expectedPlayers: room.expectedPlayers,
    hostClientId: room.hostClientId,
    players,
    me: me
      ? {
          clientId: me.clientId,
          team: me.team,
          role: me.role,
          isHost: me.clientId === room.hostClientId,
        }
      : null,
    turn: room.turn,
    startingTeam: room.startingTeam,
    clue: room.clue
      ? {
          word: room.clue.word,
          number: room.clue.number,
          guessesLeft:
            room.clue.guessesLeft === Infinity ? "unlimited" : room.clue.guessesLeft,
          by: room.clue.by,
        }
      : null,
    scores: room.board.length ? remainingCounts(room.board) : null,
    matchScore: room.matchScore,
    winner: room.winner,
    winReason: room.winReason,
    turnEndsAt: room.turnEndsAt,
    difficulty: room.difficulty,
    voting:
      room.phase === "voting"
        ? {
            counts: countVotes(room.modeVotes),
            votedCount: room.modeVotes.size,
            connectedCount: [...room.players.values()].filter((p) => p.connected).length,
            myVote: room.modeVotes.get(forClientId) || null,
          }
        : null,
    tiebreak:
      room.phase === "tiebreak" && room.tiebreak
        ? {
            options: room.tiebreak.options,
            winner: room.tiebreak.winner,
            endsAt: room.tiebreak.endsAt,
          }
        : null,
    board,
  };
}

export function allRooms() {
  return rooms;
}
