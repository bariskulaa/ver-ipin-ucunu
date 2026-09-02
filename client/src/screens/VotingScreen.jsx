import { useState } from "react";
import { useGame } from "../context/GameContext.jsx";

const DIFFICULTY_OPTIONS = [
  {
    value: "easy",
    label: "Kolay",
    emoji: "🟢",
    description: "Bağımsız, birbiriyle ilgisiz kelimeler. İpucu vermek kolaydır.",
  },
  {
    value: "medium",
    label: "Orta",
    emoji: "🟡",
    description: "Aynı kategoriden birkaç kelime bir arada (ör. birkaç hayvan, birkaç ülke).",
  },
  {
    value: "hard",
    label: "Zor",
    emoji: "🔴",
    description: "Birbiriyle sıkı ilişkili kelime kümeleri (ör. \"Testere\" ve \"Marangoz\" aynı tahtada).",
  },
];

export default function VotingScreen() {
  const { state, castVote, forceFinalizeVoting } = useGame();
  const [busy, setBusy] = useState(false);
  const voting = state.voting;
  const myVote = voting?.myVote || null;
  const isHost = state.me?.isHost;

  async function handleVote(value) {
    if (busy) return;
    setBusy(true);
    await castVote(value);
    setBusy(false);
  }

  async function handleForceFinalize() {
    if (busy) return;
    setBusy(true);
    await forceFinalizeVoting();
    setBusy(false);
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 max-w-lg mx-auto w-full">
      <div className="text-center mb-6">
        <h1 className="text-xl font-extrabold text-white mb-1">Zorluk Modu Oylaması</h1>
        <p className="text-sm text-slate-400">
          Her oyuncu bir mod seçer, en çok oyu alan mod oynanır.
        </p>
        {voting && (
          <p className="text-xs text-slate-500 mt-2">
            Oy kullanan: {voting.votedCount} / {voting.connectedCount}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {DIFFICULTY_OPTIONS.map((opt) => {
          const count = voting?.counts?.[opt.value] ?? 0;
          const selected = myVote === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleVote(opt.value)}
              disabled={busy}
              className={`text-left rounded-2xl border p-4 transition disabled:opacity-60 ${
                selected
                  ? "bg-indigo-600/20 border-indigo-400 ring-1 ring-indigo-400"
                  : "bg-slate-900 border-slate-800 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">
                  {opt.emoji} {opt.label}
                </span>
                <span className="text-sm font-mono text-slate-300 tabular-nums">
                  {count} oy
                </span>
              </div>
              <p className="text-xs text-slate-400">{opt.description}</p>
              {selected && <p className="text-xs text-indigo-300 mt-1.5">Seçimin ✓</p>}
            </button>
          );
        })}
      </div>

      {isHost ? (
        <button
          onClick={handleForceFinalize}
          disabled={busy}
          className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold transition"
        >
          Oylamayı Bitir ve Başlat
        </button>
      ) : (
        <p className="text-center text-sm text-slate-400">
          Herkes oy verince oyun otomatik başlar.
        </p>
      )}
    </div>
  );
}
