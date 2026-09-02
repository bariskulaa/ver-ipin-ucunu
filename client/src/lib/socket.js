import { io } from "socket.io-client";

// In production (single-service deploy) the client is served by the same
// server as the socket, so no URL is needed — it connects to same-origin.
// In local dev, default to the standalone backend on :3001 unless overridden.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? "http://localhost:3001" : undefined);

// Same-tab testing helper: opening ?player=2, ?player=3, etc. gives each tab
// its own isolated identity so several "players" can run in one browser
// without needing separate profiles or private windows.
const TEST_SUFFIX = (() => {
  const p = new URLSearchParams(window.location.search).get("player");
  return p ? `_p${p}` : "";
})();

const CLIENT_ID_KEY = `veripinucunu_client_id${TEST_SUFFIX}`;
const ROOM_CODE_KEY = `veripinucunu_room_code${TEST_SUFFIX}`;
const NICKNAME_KEY = `veripinucunu_nickname${TEST_SUFFIX}`;

export function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function saveSession({ roomCode, nickname }) {
  if (roomCode) localStorage.setItem(ROOM_CODE_KEY, roomCode);
  if (nickname) localStorage.setItem(NICKNAME_KEY, nickname);
}

export function getSavedRoomCode() {
  return localStorage.getItem(ROOM_CODE_KEY);
}

export function getSavedNickname() {
  return localStorage.getItem(NICKNAME_KEY) || "";
}

export function clearSession() {
  localStorage.removeItem(ROOM_CODE_KEY);
}

export const socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
