import { useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import Card from "../components/Card.jsx";
import Timer from "../components/Timer.jsx";
import { playYourTurnSound, playWinSound, playLoseSound } from "../lib/sound.js";

const TEAM_LABEL = { red: "Kırmızı", blue: "Mavi" };
const DIFFICULTY_LABEL = { easy: "🟢 Kolay", medium: "🟡 Orta", hard: "🔴 Zor" };
const WIN_REASON_LABEL = {
  assassin: "suikastçı kartını açtı ve elendi!",
  all_words_found: "tüm kelimelerini buldu!",
};

export default function GameScreen() {
  const { state, giveClue, revealCard, endTurn, restartGame, returnToLobby, leaveRoomAction } = useGame();
  const { me, turn, clue, scores, board, phase, winner, winReason, turnEndsAt, matchScore } = state;

  const isSpymaster = me?.role === "spymaster";
  const myTurn = me?.team === turn;
  const iCanGiveClue = phase === "playing" && myTurn && isSpymaster && !clue;
  const iCanGuess = phase === "playing" && myTurn && !isSpymaster && !!clue;

  const prevMyTurnRef = useRef(myTurn);
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    if (phase === "playing" && myTurn && !prevMyTurnRef.current) {
      playYourTurnSound();
    }
    prevMyTurnRef.current = myTurn;
  }, [myTurn, phase]);

  useEffect(() => {
    if (phase === "ended" && prevPhaseRef.current !== "ended" && me?.team) {
      if (me.team === winner) playWinSound();
      else playLoseSound();
    }
    prevPhaseRef.current = phase;
  }, [phase, winner, me?.team]);

  return (
    <div className="min-h-screen flex flex-col px-3 py-4 sm:px-4 max-w-3xl mx-auto w-full">
      <header className="flex items-center justify-between mb-3">
        <div className="text-xs text-slate-500 font-mono">
          Oda: {state.code}
          {state.difficulty && (
            <span className="ml-2 text-slate-400">{DIFFICULTY_LABEL[state.difficulty]}</span>
          )}
        </div>
        <Timer endsAt={phase === "playing" ? turnEndsAt : null} />
        <button onClick={leaveRoomAction} className="text-xs text-slate-500 hover:text-red-400">
          Ayrıl
        </button>
      </header>

      <MatchScoreboard matchScore={matchScore} />

      <ScoreBar scores={scores} turn={turn} phase={phase} />

      <TurnBanner
        phase={phase}
        turn={turn}
        me={me}
        clue={clue}
        isSpymaster={isSpymaster}
        myTurn={myTurn}
      />

      {iCanGiveClue && <ClueForm onSubmit={giveClue} />}

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 my-3">
        {board.map((cell) => (
          <Card
            key={cell.id}
            cell={cell}
            isSpymaster={isSpymaster || phase === "ended"}
            clickable={iCanGuess && !cell.revealed}
            onClick={() => revealCard(cell.id)}
          />
        ))}
      </div>

      {iCanGuess && (
        <button
          onClick={endTurn}
          className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-semibold transition mt-1"
        >
          Turu Bitir
        </button>
      )}

      {phase === "ended" && (
        <EndOverlay
          winner={winner}
          winReason={winReason}
          matchScore={matchScore}
          isHost={me?.isHost}
          onRestart={restartGame}
          onLobby={returnToLobby}
        />
      )}
    </div>
  );
}

function MatchScoreboard({ matchScore }) {
  if (!matchScore || matchScore.red + matchScore.blue === 0) return null;
  return (
    <div className="flex items-center justify-center gap-2 mb-2 text-xs">
      <span className="text-slate-400">Skor Tahtası:</span>
      <span className="font-bold text-red-400">🔴 {matchScore.red}</span>
      <span className="text-slate-600">—</span>
      <span className="font-bold text-blue-400">{matchScore.blue} 🔵</span>
    </div>
  );
}

function ScoreBar({ scores, turn, phase }) {
  if (!scores) return null;
  return (
    <div className="flex items-stretch gap-2 mb-3">
      <ScorePill color="red" label="Kırmızı" value={scores.red} active={phase === "playing" && turn === "red"} />
      <ScorePill color="blue" label="Mavi" value={scores.blue} active={phase === "playing" && turn === "blue"} />
    </div>
  );
}

function ScorePill({ color, label, value, active }) {
  const base = color === "red" ? "bg-team-red" : "bg-team-blue";
  return (
    <div
      className={`flex-1 rounded-xl px-3 py-2 flex items-center justify-between text-white font-bold ${base} ${
        active ? "ring-2 ring-white/70" : "opacity-80"
      }`}
    >
      <span className="text-xs sm:text-sm">{label}</span>
      <span className="text-xl sm:text-2xl tabular-nums">{value}</span>
    </div>
  );
}

function TurnBanner({ phase, turn, me, clue, isSpymaster, myTurn }) {
  if (phase !== "playing") return null;

  const teamLabel = TEAM_LABEL[turn];
  const teamColorClass = turn === "red" ? "text-red-400" : "text-blue-400";

  let subtitle = "";
  if (myTurn && isSpymaster && !clue) {
    subtitle = "Takımın için bir ipucu ver.";
  } else if (myTurn && !isSpymaster && !clue) {
    subtitle = "Ajanınızın ipucu vermesi bekleniyor...";
  } else if (myTurn && !isSpymaster && clue) {
    subtitle = "Kartlardan birini seçin.";
  } else if (!myTurn) {
    subtitle = "Rakip takımın sırası, bekleyin.";
  }

  return (
    <div className="text-center mb-2">
      <p className={`text-lg font-extrabold ${teamColorClass}`}>{teamLabel} Takımın Sırası</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      {clue && (
        <div className="mt-2 inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5">
          <span className="text-sm font-bold text-white uppercase tracking-wide">{clue.word}</span>
          <span className="text-sm font-mono text-indigo-300">
            {clue.number === 0 ? "∞" : clue.number}
          </span>
          {clue.guessesLeft !== undefined && (
            <span className="text-xs text-slate-400">
              (Kalan tahmin: {clue.guessesLeft === "unlimited" ? "Sınırsız" : clue.guessesLeft})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ClueForm({ onSubmit }) {
  const [word, setWord] = useState("");
  const [number, setNumber] = useState(1);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!word.trim() || busy) return;
    setBusy(true);
    await onSubmit(word.trim(), number);
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3">
      <p className="text-sm font-semibold text-slate-300 mb-2">İpucu Ver</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value.replace(/\s+/g, "").slice(0, 30))}
          placeholder="İpucu kelimesi"
          className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-1.5">
          <button
            type="button"
            onClick={() => setNumber((n) => Math.max(0, n - 1))}
            disabled={number <= 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
            aria-label="Sayıyı azalt"
          >
            −
          </button>
          <span className="w-6 text-center text-lg font-mono font-bold text-white tabular-nums">
            {number === 0 ? "∞" : number}
          </span>
          <button
            type="button"
            onClick={() => setNumber((n) => Math.min(9, n + 1))}
            disabled={number >= 9}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
            aria-label="Sayıyı artır"
          >
            +
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2">Tek kelime olmalı, tahtadaki bir kelime olamaz.</p>
      <button
        type="submit"
        disabled={!word.trim() || busy}
        className="w-full mt-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold transition"
      >
        İpucu Ver
      </button>
    </form>
  );
}

function EndOverlay({ winner, winReason, matchScore, isHost, onRestart, onLobby }) {
  const teamLabel = TEAM_LABEL[winner];
  const teamColorClass = winner === "red" ? "text-red-400" : "text-blue-400";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center px-5 z-40">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="text-5xl mb-2">{winReason === "assassin" ? "💀" : "🏆"}</div>
        <h2 className={`text-2xl font-extrabold mb-1 ${teamColorClass}`}>{teamLabel} Takım Kazandı!</h2>
        <p className="text-slate-400 text-sm mb-3">
          {(winReason === "assassin" ? TEAM_LABEL[winner === "red" ? "blue" : "red"] : teamLabel)}{" "}
          {WIN_REASON_LABEL[winReason] || ""}
        </p>

        {matchScore && (
          <p className="text-xs text-slate-500 mb-6">
            Genel skor: 🔴 {matchScore.red} — {matchScore.blue} 🔵
          </p>
        )}

        {isHost ? (
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onRestart}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
            >
              Yeni Oyun Başlat
            </button>
            <button
              onClick={onLobby}
              className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-semibold transition"
            >
              Lobiye Dön
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Oda kurucusunun yeni bir tur başlatması bekleniyor...</p>
        )}
      </div>
    </div>
  );
}
