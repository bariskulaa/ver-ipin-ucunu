import { useEffect, useState } from "react";

export default function Timer({ endsAt }) {
  const [remainingMs, setRemainingMs] = useState(() => (endsAt ? endsAt - Date.now() : 0));

  useEffect(() => {
    if (!endsAt) return;
    setRemainingMs(endsAt - Date.now());
    const interval = setInterval(() => {
      setRemainingMs(endsAt - Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!endsAt) return null;

  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isLow = totalSeconds <= 15;

  return (
    <div
      className={`font-mono font-bold text-lg tabular-nums px-2.5 py-1 rounded-lg ${
        isLow ? "text-red-400 bg-red-950/60 animate-pulse" : "text-slate-200 bg-slate-800"
      }`}
    >
      {minutes}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
