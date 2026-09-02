const REVEALED_STYLES = {
  red: "bg-team-red text-white border-team-redDark",
  blue: "bg-team-blue text-white border-team-blueDark",
  neutral: "bg-slate-400 text-slate-900 border-slate-500",
  assassin: "bg-slate-950 text-white border-black",
};

const SPY_HINT_STYLES = {
  red: "bg-red-950/70 text-red-200 border-team-red",
  blue: "bg-blue-950/70 text-blue-200 border-team-blue",
  neutral: "bg-slate-800 text-slate-300 border-slate-500",
  assassin: "bg-black text-purple-200 border-purple-500",
};

const HIDDEN_STYLE = "bg-slate-100 text-slate-900 border-slate-300";

export default function Card({ cell, isSpymaster, clickable, onClick }) {
  const { word, color, revealed } = cell;

  let styleClass = HIDDEN_STYLE;
  if (revealed) {
    styleClass = REVEALED_STYLES[color] || HIDDEN_STYLE;
  } else if (isSpymaster && color) {
    styleClass = SPY_HINT_STYLES[color] || HIDDEN_STYLE;
  }

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className={`word-card relative aspect-square w-full flex items-center justify-center rounded-lg sm:rounded-xl border-2 px-0.5 text-center font-bold uppercase leading-tight text-[9px] xs:text-[10px] sm:text-xs md:text-sm transition-transform ${styleClass} ${
        clickable ? "active:scale-95 cursor-pointer" : "cursor-default"
      } ${!revealed && !isSpymaster ? "shadow-sm" : ""}`}
    >
      {revealed && color === "assassin" && <span className="absolute top-0.5 right-0.5 text-[10px] sm:text-xs">💀</span>}
      <span className="line-clamp-3">{word}</span>
    </button>
  );
}
