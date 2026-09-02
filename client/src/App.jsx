import { useEffect, useState } from "react";
import { useGame } from "./context/GameContext.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import LobbyScreen from "./screens/LobbyScreen.jsx";
import VotingScreen from "./screens/VotingScreen.jsx";
import TiebreakScreen from "./screens/TiebreakScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";

export default function App() {
  const { connected, rejoining, state, error, clearError } = useGame();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 safe-top safe-bottom">
      {!connected && (
        <div className="bg-amber-500 text-amber-950 text-center text-sm font-medium py-1.5 px-3">
          Bağlantı kesildi, yeniden bağlanılıyor...
        </div>
      )}

      <ErrorToast message={error} onClose={clearError} />

      {rejoining ? (
        <SplashLoading />
      ) : !state ? (
        <HomeScreen />
      ) : state.phase === "lobby" ? (
        <LobbyScreen />
      ) : state.phase === "voting" ? (
        <VotingScreen />
      ) : state.phase === "tiebreak" ? (
        <TiebreakScreen />
      ) : (
        <GameScreen />
      )}
    </div>
  );
}

function SplashLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-4xl">🕵️</div>
      <p className="text-slate-400 text-sm">Bağlanılıyor...</p>
    </div>
  );
}

function ErrorToast({ message, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3500);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message || !visible) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-4">
      <div className="bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg text-center">
        {message}
      </div>
    </div>
  );
}
