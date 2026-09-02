import { useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import { getSavedNickname } from "../lib/socket.js";

export default function HomeScreen() {
  const { createRoom, joinRoom } = useGame();
  const [nickname, setNickname] = useState(getSavedNickname());
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [expectedPlayers, setExpectedPlayers] = useState(6);
  const [roomCode, setRoomCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nameValid = nickname.trim().length > 0;

  async function handleCreate() {
    if (!nameValid || submitting) return;
    setSubmitting(true);
    await createRoom(nickname.trim(), expectedPlayers);
    setSubmitting(false);
  }

  async function handleJoin() {
    if (!nameValid || roomCode.trim().length < 4 || submitting) return;
    setSubmitting(true);
    await joinRoom(nickname.trim(), roomCode.trim());
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🕵️‍♂️</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">VER İPİN UCUNU</h1>
          <p className="text-slate-400 text-sm mt-1">Gerçek zamanlı çok oyunculu kelime oyunu</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Rumuzun</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            placeholder="Örn. Ajan47"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            maxLength={20}
          />

          {mode === null && (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setMode("create")}
                disabled={!nameValid}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition"
              >
                Oyun Oluştur
              </button>
              <button
                onClick={() => setMode("join")}
                disabled={!nameValid}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition border border-slate-700"
              >
                Oyuna Katıl
              </button>
            </div>
          )}

          {mode === "create" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Beklenen Oyuncu Sayısı
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpectedPlayers((n) => Math.max(4, n - 1))}
                    className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-white text-xl font-bold active:bg-slate-700"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center text-2xl font-bold text-white">
                    {expectedPlayers}
                  </div>
                  <button
                    onClick={() => setExpectedPlayers((n) => Math.min(20, n + 1))}
                    className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-white text-xl font-bold active:bg-slate-700"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Bilgi amaçlıdır, oyun en az 4 oyuncuyla başlar.</p>
              </div>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-base transition"
              >
                {submitting ? "Oluşturuluyor..." : "Odayı Oluştur"}
              </button>
              <button
                onClick={() => setMode(null)}
                className="text-slate-400 text-sm py-1 hover:text-slate-300"
              >
                ← Geri
              </button>
            </div>
          )}

          {mode === "join" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Oda Kodu</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="Örn. A3XQ9"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-lg tracking-[0.3em] text-center font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={submitting || roomCode.trim().length < 4}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-base transition"
              >
                {submitting ? "Katılıyor..." : "Odaya Katıl"}
              </button>
              <button
                onClick={() => setMode(null)}
                className="text-slate-400 text-sm py-1 hover:text-slate-300"
              >
                ← Geri
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
