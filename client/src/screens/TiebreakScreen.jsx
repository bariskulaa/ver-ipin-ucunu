import { useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext.jsx";

const DIFFICULTY_INFO = {
  easy: { label: "Kolay", emoji: "🟢" },
  medium: { label: "Orta", emoji: "🟡" },
  hard: { label: "Zor", emoji: "🔴" },
};

// Kazanan sunucu tarafında zaten belirlenmiş olsa da, tüm oyunculara aynı
// anda görünen bir "çevirme" animasyonuyla gösterilir — art arda azalan
// aralıklarla seçenekler arasında gezinip sonunda kazanana kilitlenir.
const TICK_DELAYS = [70, 70, 80, 90, 100, 120, 140, 170, 200, 240, 290, 350, 420];

export default function TiebreakScreen() {
  const { state } = useGame();
  const tiebreak = state.tiebreak;
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [landed, setLanded] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!tiebreak) return;
    const { options, winner } = tiebreak;
    const winnerIdx = options.indexOf(winner);
    setLanded(false);

    let step = 0;
    function tick() {
      if (step >= TICK_DELAYS.length) {
        setHighlightIdx(winnerIdx < 0 ? 0 : winnerIdx);
        setLanded(true);
        return;
      }
      setHighlightIdx(step % options.length);
      timeoutRef.current = setTimeout(() => {
        step++;
        tick();
      }, TICK_DELAYS[step]);
    }
    tick();

    return () => clearTimeout(timeoutRef.current);
  }, [tiebreak?.winner, tiebreak?.endsAt]);

  if (!tiebreak) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">Yükleniyor...</p>
      </div>
    );
  }

  const { options } = tiebreak;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 text-center">
      <div className="text-5xl mb-3">🪙</div>
      <h1 className="text-xl font-extrabold text-white mb-1">Oy Eşitliği!</h1>
      <p className="text-sm text-slate-400 mb-8">
        {landed ? "Kazanan belirlendi!" : "Kazanan mod belirleniyor..."}
      </p>

      <div className="flex gap-3">
        {options.map((opt, idx) => {
          const info = DIFFICULTY_INFO[opt];
          const active = idx === highlightIdx;
          return (
            <div
              key={opt}
              className={`rounded-2xl border px-5 py-6 flex flex-col items-center gap-2 transition-all duration-100 ${
                active
                  ? landed
                    ? "bg-emerald-600/20 border-emerald-400 ring-2 ring-emerald-400 scale-110"
                    : "bg-indigo-600/20 border-indigo-400 ring-2 ring-indigo-400 scale-110"
                  : "bg-slate-900 border-slate-800 opacity-50 scale-95"
              }`}
            >
              <span className="text-3xl">{info.emoji}</span>
              <span className="font-bold text-white text-sm">{info.label}</span>
            </div>
          );
        })}
      </div>

      {landed && (
        <p className="text-emerald-400 text-sm font-semibold mt-8 animate-pulse">
          Oyun başlıyor...
        </p>
      )}
    </div>
  );
}
