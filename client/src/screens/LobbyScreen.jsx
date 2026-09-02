import { useMemo, useState } from "react";
import { useGame } from "../context/GameContext.jsx";

function isTeamValid(players, team) {
  const roster = players.filter((p) => p.team === team);
  const spymasters = roster.filter((p) => p.role === "spymaster");
  const operatives = roster.filter((p) => p.role === "operative");
  return spymasters.length === 1 && operatives.length >= 1;
}

export default function LobbyScreen() {
  const { state, selectRole, clearRole, randomizeTeams, startGame, leaveRoomAction } = useGame();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const players = state.players;
  const me = state.me;
  const isHost = me?.isHost;
  const unassigned = players.filter((p) => !p.team);
  const matchScore = state.matchScore;
  const hasPlayedBefore = matchScore && matchScore.red + matchScore.blue > 0;

  const redValid = useMemo(() => isTeamValid(players, "red"), [players]);
  const blueValid = useMemo(() => isTeamValid(players, "blue"), [players]);
  const canStart = redValid && blueValid;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable; ignore silently.
    }
  }

  async function handleRandomize() {
    setBusy(true);
    await randomizeTeams();
    setBusy(false);
  }

  async function handleStart() {
    setBusy(true);
    await startGame();
    setBusy(false);
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-2xl mx-auto w-full">
      <header className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">Oda Kodu</p>
          <button onClick={copyCode} className="flex items-center gap-2 text-2xl font-extrabold tracking-[0.2em] text-white">
            {state.code}
            <span className="text-xs font-medium text-indigo-400">{copied ? "Kopyalandı!" : "Kopyala"}</span>
          </button>
        </div>
        <button onClick={leaveRoomAction} className="text-sm text-slate-400 hover:text-red-400 px-2 py-1">
          Ayrıl
        </button>
      </header>

      {hasPlayedBefore && (
        <div className="mb-5 flex items-center justify-center gap-3 bg-slate-900 border border-slate-800 rounded-xl py-2.5">
          <span className="text-sm font-bold text-red-400">🔴 {matchScore.red}</span>
          <span className="text-xs text-slate-500">Skor Tahtası</span>
          <span className="text-sm font-bold text-blue-400">{matchScore.blue} 🔵</span>
        </div>
      )}

      <div className="mb-5">
        <p className="text-sm font-medium text-slate-300 mb-2">
          Bağlı Oyuncular ({players.length}
          {state.expectedPlayers ? ` / ${state.expectedPlayers}` : ""})
        </p>
        <div className="flex flex-wrap gap-2">
          {unassigned.length === 0 && (
            <p className="text-xs text-slate-500 italic">Tüm oyuncular bir takıma atandı.</p>
          )}
          {unassigned.map((p) => (
            <PlayerChip key={p.clientId} player={p} isMe={p.clientId === me?.clientId} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <TeamPanel
          team="red"
          label="🔴 Kırmızı Takım"
          players={players.filter((p) => p.team === "red")}
          me={me}
          valid={redValid}
          onSelectRole={selectRole}
          onClearRole={clearRole}
        />
        <TeamPanel
          team="blue"
          label="🔵 Mavi Takım"
          players={players.filter((p) => p.team === "blue")}
          me={me}
          valid={blueValid}
          onSelectRole={selectRole}
          onClearRole={clearRole}
        />
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-2">
        {isHost && (
          <button
            onClick={handleRandomize}
            disabled={busy || players.length < 4}
            className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold transition"
          >
            🎲 Rastgele Dağıt
          </button>
        )}

        {players.length < 4 && (
          <p className="text-center text-xs text-amber-400">Rastgele dağıtım ve başlangıç için en az 4 oyuncu gerekli.</p>
        )}

        {isHost ? (
          <button
            onClick={handleStart}
            disabled={busy || !canStart}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base transition"
          >
            Oyunu Başlat
          </button>
        ) : (
          <p className="text-center text-sm text-slate-400">Oda kurucusunun oyunu başlatması bekleniyor...</p>
        )}
        {!canStart && (
          <p className="text-center text-xs text-slate-500">
            Her takımda tam olarak 1 Ajan ve en az 1 Operatör olmalı.
          </p>
        )}
      </div>
    </div>
  );
}

function PlayerChip({ player, isMe }) {
  return (
    <span
      className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
        isMe ? "bg-indigo-600 border-indigo-400 text-white" : "bg-slate-800 border-slate-700 text-slate-200"
      } ${!player.connected ? "opacity-40" : ""}`}
    >
      {player.name}
      {isMe && " (sen)"}
    </span>
  );
}

function TeamPanel({ team, label, players, me, valid, onSelectRole, onClearRole }) {
  const spymaster = players.find((p) => p.role === "spymaster");
  const operatives = players.filter((p) => p.role === "operative");
  const accent = team === "red" ? "border-team-red/50 bg-team-red/10" : "border-team-blue/50 bg-team-blue/10";
  const btnAccent =
    team === "red"
      ? "bg-team-red/20 hover:bg-team-red/30 text-red-200 border-team-red/40"
      : "bg-team-blue/20 hover:bg-team-blue/30 text-blue-200 border-team-blue/40";

  const myTeamRole = me?.team === team ? me.role : null;

  return (
    <div className={`rounded-2xl border p-4 ${accent}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white">{label}</h3>
        {valid && <span className="text-emerald-400 text-xs font-semibold">Hazır ✓</span>}
      </div>

      <div className="mb-3">
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1.5">Ajan (Spymaster)</p>
        {spymaster ? (
          <SlotFilled
            name={spymaster.name}
            icon="🕵️"
            isMe={spymaster.clientId === me?.clientId}
            onLeave={spymaster.clientId === me?.clientId ? onClearRole : null}
          />
        ) : (
          <button
            onClick={() => onSelectRole(team, "spymaster")}
            disabled={myTeamRole === "spymaster"}
            className={`w-full py-2.5 rounded-xl border border-dashed text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${btnAccent}`}
          >
            + Ajan Ol
          </button>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1.5">Operatörler</p>
        <div className="flex flex-col gap-1.5">
          {operatives.map((p) => (
            <SlotFilled
              key={p.clientId}
              name={p.name}
              icon="🔎"
              isMe={p.clientId === me?.clientId}
              onLeave={p.clientId === me?.clientId ? onClearRole : null}
            />
          ))}
          <button
            onClick={() => onSelectRole(team, "operative")}
            disabled={myTeamRole === "operative"}
            className={`w-full py-2.5 rounded-xl border border-dashed text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${btnAccent}`}
          >
            + Operatör Ol
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotFilled({ name, icon, isMe, onLeave }) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium ${
        isMe ? "bg-white/20 ring-1 ring-white/40 text-white" : "bg-black/20 text-slate-200"
      }`}
    >
      <span>
        {icon} {name}
        {isMe && " (sen)"}
      </span>
      {onLeave && (
        <button onClick={onLeave} className="text-xs text-slate-300 hover:text-white underline">
          Ayrıl
        </button>
      )}
    </div>
  );
}
