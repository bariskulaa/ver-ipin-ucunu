import express from "express";
import http from "http";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { randomUUID } from "crypto";

import { TURN_DURATION_MS } from "./gameLogic.js";
import {
  createRoom,
  joinRoom,
  rejoinRoom,
  handleDisconnect,
  leaveRoom,
  getRoomForSocket,
  getRoom,
  clearTurnTimer,
  clearTiebreakTimer,
  selectRole,
  clearRole,
  randomizeTeams,
  startGame,
  castVote,
  forceFinalizeVoting,
  resolveTiebreak,
  giveClue,
  revealCard,
  endTurn,
  forceTimeoutTurn,
  restartGame,
  returnToLobby,
  getPublicState,
  allRooms,
} from "./roomManager.js";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: allRooms().size });
});

// If the client has been built (npm run build), serve it from this same
// server so the whole app is reachable from a single URL/port in production.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
});

function broadcastState(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;
  for (const player of room.players.values()) {
    if (!player.connected) continue;
    const socket = io.sockets.sockets.get(player.socketId);
    if (!socket) continue;
    socket.emit("state", getPublicState(room, player.clientId));
  }
}

// Turn kaç fazdan oluşur: ipucu bekleme (spymaster) ve tahmin (operatifler).
// Her biri kendi 2 dakikalık süresini alır — ipucu 1 dakikada verilse bile
// tahmin süresi sıfırdan tam 2 dakika başlar.
function onTurnTimeout(room) {
  const fresh = getRoom(room.code);
  if (!fresh || fresh.phase !== "playing") return;
  forceTimeoutTurn(fresh);
  scheduleTurnTimer(fresh);
  broadcastState(fresh.code);
}

// Bir takımın turu başladığında (ipucu bekleme fazı) çağrılır.
function scheduleTurnTimer(room) {
  clearTurnTimer(room);
  // Each team's first clue-giving turn of the match is untimed; it becomes
  // timed the moment that free turn is consumed. This exemption covers the
  // whole turn (both the clue and guessing phases).
  if (!room.firstTurnGiven[room.turn]) {
    room.firstTurnGiven[room.turn] = true;
    room.turnUntimed = true;
    room.turnEndsAt = null;
    return;
  }
  room.turnUntimed = false;
  room.turnEndsAt = Date.now() + TURN_DURATION_MS;
  room.turnTimeoutHandle = setTimeout(() => onTurnTimeout(room), TURN_DURATION_MS);
}

// Ajan ipucu verdiği an çağrılır: kalan ipucu süresi ne olursa olsun,
// operatörler için sıfırdan taze bir 2 dakikalık tahmin süresi başlatılır.
function scheduleGuessTimer(room) {
  clearTurnTimer(room);
  if (room.turnUntimed) {
    room.turnEndsAt = null;
    return;
  }
  room.turnEndsAt = Date.now() + TURN_DURATION_MS;
  room.turnTimeoutHandle = setTimeout(() => onTurnTimeout(room), TURN_DURATION_MS);
}

function scheduleTiebreakResolve(room) {
  clearTiebreakTimer(room);
  const delay = Math.max(0, room.tiebreak.endsAt - Date.now());
  room.tiebreakTimeoutHandle = setTimeout(() => {
    const fresh = getRoom(room.code);
    if (!fresh || fresh.phase !== "tiebreak") return;
    const result = resolveTiebreak(fresh);
    if (result.ok) scheduleTurnTimer(fresh);
    broadcastState(fresh.code);
  }, delay);
}

function afterAction(room, result) {
  if (!room) return;
  if (result?.tiebreakStarted) {
    scheduleTiebreakResolve(room);
  } else if (room.phase === "ended") {
    clearTurnTimer(room);
    room.turnEndsAt = null;
  } else if (room.phase === "playing" && result?.clueGiven) {
    scheduleGuessTimer(room);
  } else if (room.phase === "playing" && (result?.turnEnded || result?.newTurnStarted)) {
    scheduleTurnTimer(room);
  }
  broadcastState(room.code);
}

function withRoom(socket, handler) {
  return (payload, ack) => {
    const { room, clientId } = getRoomForSocket(socket.id);
    if (!room) {
      if (typeof ack === "function") ack({ ok: false, error: "Bir odada değilsiniz." });
      return;
    }
    const result = handler({ room, clientId, payload: payload || {} });
    if (typeof ack === "function") ack(result);
    if (result?.ok) afterAction(room, result);
  };
}

io.on("connection", (socket) => {
  socket.on("create_room", ({ clientId, nickname, expectedPlayers } = {}, ack) => {
    const id = clientId || randomUUID();
    const result = createRoom({
      socketId: socket.id,
      clientId: id,
      nickname,
      expectedPlayers,
    });
    if (typeof ack === "function") {
      ack({ ok: true, roomCode: result.room.code, clientId: id });
    }
    broadcastState(result.room.code);
  });

  socket.on("join_room", ({ clientId, nickname, roomCode } = {}, ack) => {
    const id = clientId || randomUUID();
    const result = joinRoom({
      socketId: socket.id,
      clientId: id,
      nickname,
      roomCode,
    });
    if (!result.ok) {
      if (typeof ack === "function") ack({ ok: false, error: result.error });
      return;
    }
    if (typeof ack === "function") {
      ack({ ok: true, roomCode: result.room.code, clientId: id });
    }
    broadcastState(result.room.code);
  });

  socket.on("rejoin_room", ({ clientId, roomCode } = {}, ack) => {
    const result = rejoinRoom({ socketId: socket.id, clientId, roomCode });
    if (!result.ok) {
      if (typeof ack === "function") ack({ ok: false, error: result.error });
      return;
    }
    if (typeof ack === "function") ack({ ok: true, roomCode: result.room.code, clientId });
    broadcastState(result.room.code);
  });

  socket.on(
    "select_role",
    withRoom(socket, ({ room, clientId, payload }) =>
      selectRole({ room, clientId, team: payload.team, role: payload.role })
    )
  );

  socket.on(
    "clear_role",
    withRoom(socket, ({ room, clientId }) => clearRole({ room, clientId }))
  );

  socket.on(
    "randomize_teams",
    withRoom(socket, ({ room, clientId }) => randomizeTeams({ room, clientId }))
  );

  socket.on(
    "start_game",
    withRoom(socket, ({ room, clientId }) => startGame({ room, clientId }))
  );

  socket.on(
    "cast_vote",
    withRoom(socket, ({ room, clientId, payload }) =>
      castVote({ room, clientId, difficulty: payload.difficulty })
    )
  );

  socket.on(
    "force_finalize_voting",
    withRoom(socket, ({ room, clientId }) => forceFinalizeVoting({ room, clientId }))
  );

  socket.on(
    "give_clue",
    withRoom(socket, ({ room, clientId, payload }) =>
      giveClue({ room, clientId, word: payload.word, number: payload.number })
    )
  );

  socket.on(
    "reveal_card",
    withRoom(socket, ({ room, clientId, payload }) =>
      revealCard({ room, clientId, cardIndex: payload.cardIndex })
    )
  );

  socket.on(
    "end_turn",
    withRoom(socket, ({ room, clientId }) => endTurn({ room, clientId }))
  );

  socket.on(
    "restart_game",
    withRoom(socket, ({ room, clientId }) => restartGame({ room, clientId }))
  );

  socket.on(
    "return_to_lobby",
    withRoom(socket, ({ room, clientId }) => returnToLobby({ room, clientId }))
  );

  socket.on("leave_room", () => {
    const room = leaveRoom(socket.id);
    if (room) broadcastState(room.code);
  });

  socket.on("disconnect", () => {
    const room = handleDisconnect(socket.id);
    if (room) broadcastState(room.code);
  });
});

// Periodic sweep: remove rooms that have had zero connected players for a while.
const ROOM_IDLE_LIMIT_MS = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of allRooms()) {
    const anyoneConnected = [...room.players.values()].some((p) => p.connected);
    if (!anyoneConnected && now - room.createdAt > ROOM_IDLE_LIMIT_MS) {
      clearTurnTimer(room);
      clearTiebreakTimer(room);
      allRooms().delete(code);
    }
  }
}, 5 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`Ver İpin Ucunu sunucusu ${PORT} portunda çalışıyor.`);
});
