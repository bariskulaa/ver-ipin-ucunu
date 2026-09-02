import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  socket,
  getClientId,
  saveSession,
  getSavedRoomCode,
  clearSession,
} from "../lib/socket.js";

const GameContext = createContext(null);

function emitAck(event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (res) => resolve(res || { ok: false, error: "Sunucudan yanıt alınamadı." }));
  });
}

export function GameProvider({ children }) {
  const [connected, setConnected] = useState(socket.connected);
  const [state, setState] = useState(null); // personalized room snapshot from server
  const [error, setError] = useState("");
  const [rejoining, setRejoining] = useState(true);
  const clientIdRef = useRef(getClientId());

  useEffect(() => {
    function onConnect() {
      setConnected(true);
      const savedRoom = getSavedRoomCode();
      if (savedRoom) {
        emitAck("rejoin_room", { clientId: clientIdRef.current, roomCode: savedRoom }).then((res) => {
          if (!res.ok) clearSession();
          setRejoining(false);
        });
      } else {
        setRejoining(false);
      }
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onState(payload) {
      setState(payload);
      saveSession({ roomCode: payload.code });
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("state", onState);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("state", onState);
    };
  }, []);

  const clearError = useCallback(() => setError(""), []);

  const createRoom = useCallback(async (nickname, expectedPlayers) => {
    const res = await emitAck("create_room", {
      clientId: clientIdRef.current,
      nickname,
      expectedPlayers,
    });
    if (!res.ok) setError(res.error || "Oda oluşturulamadı.");
    else saveSession({ roomCode: res.roomCode, nickname });
    return res;
  }, []);

  const joinRoom = useCallback(async (nickname, roomCode) => {
    const res = await emitAck("join_room", {
      clientId: clientIdRef.current,
      nickname,
      roomCode: roomCode.trim().toUpperCase(),
    });
    if (!res.ok) setError(res.error || "Odaya katılınamadı.");
    else saveSession({ roomCode: res.roomCode, nickname });
    return res;
  }, []);

  const selectRole = useCallback(async (team, role) => {
    const res = await emitAck("select_role", { team, role });
    if (!res.ok) setError(res.error || "Rol seçilemedi.");
    return res;
  }, []);

  const clearRole = useCallback(async () => {
    const res = await emitAck("clear_role", {});
    if (!res.ok) setError(res.error || "İşlem başarısız.");
    return res;
  }, []);

  const randomizeTeams = useCallback(async () => {
    const res = await emitAck("randomize_teams", {});
    if (!res.ok) setError(res.error || "Takımlar dağıtılamadı.");
    return res;
  }, []);

  const startGame = useCallback(async () => {
    const res = await emitAck("start_game", {});
    if (!res.ok) setError(res.error || "Oyun başlatılamadı.");
    return res;
  }, []);

  const castVote = useCallback(async (difficulty) => {
    const res = await emitAck("cast_vote", { difficulty });
    if (!res.ok) setError(res.error || "Oy kaydedilemedi.");
    return res;
  }, []);

  const forceFinalizeVoting = useCallback(async () => {
    const res = await emitAck("force_finalize_voting", {});
    if (!res.ok) setError(res.error || "Oylama sonlandırılamadı.");
    return res;
  }, []);

  const giveClue = useCallback(async (word, number) => {
    const res = await emitAck("give_clue", { word, number });
    if (!res.ok) setError(res.error || "İpucu gönderilemedi.");
    return res;
  }, []);

  const revealCard = useCallback(async (cardIndex) => {
    const res = await emitAck("reveal_card", { cardIndex });
    if (!res.ok) setError(res.error || "Kart açılamadı.");
    return res;
  }, []);

  const endTurn = useCallback(async () => {
    const res = await emitAck("end_turn", {});
    if (!res.ok) setError(res.error || "Tur bitirilemedi.");
    return res;
  }, []);

  const restartGame = useCallback(async () => {
    const res = await emitAck("restart_game", {});
    if (!res.ok) setError(res.error || "Yeni oyun başlatılamadı.");
    return res;
  }, []);

  const returnToLobby = useCallback(async () => {
    const res = await emitAck("return_to_lobby", {});
    if (!res.ok) setError(res.error || "Lobiye dönülemedi.");
    return res;
  }, []);

  const leaveRoomAction = useCallback(() => {
    socket.emit("leave_room");
    clearSession();
    setState(null);
  }, []);

  const value = {
    connected,
    rejoining,
    state,
    error,
    clearError,
    createRoom,
    joinRoom,
    selectRole,
    clearRole,
    randomizeTeams,
    startGame,
    castVote,
    forceFinalizeVoting,
    giveClue,
    revealCard,
    endTurn,
    restartGame,
    returnToLobby,
    leaveRoomAction,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame, GameProvider içinde kullanılmalı.");
  return ctx;
}
