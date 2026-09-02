import { customAlphabet } from "nanoid";
import { pickBoardWords } from "./words.js";

// Ambiguous characters (0/O, 1/I) excluded for readability on mobile screens.
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const nanoidRoomCode = customAlphabet(ROOM_CODE_ALPHABET, 5);

export const TURN_DURATION_MS = 120 * 1000;
// Oy eşitliği durumunda, kazananı rastgele belirlerken tüm oyunculara
// gösterilen yazı-tura/rulet animasyonunun süresi.
export const TIEBREAK_ANIMATION_MS = 3000;
export const TEAMS = ["red", "blue"];

export function otherTeam(team) {
  return team === "red" ? "blue" : "red";
}

export function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateRoomCode(existingCodes) {
  let code;
  do {
    code = nanoidRoomCode();
  } while (existingCodes.has(code));
  return code;
}

// Kelimeleri renklere atar. `clusters` içindeki (anlamca ilişkili) kelime
// gruplarının üyelerini kasıtlı olarak farklı renklere/takımlara dağıtır —
// aksi halde ilişkili kelimeler aynı takıma yığılıp o takıma bedava, tek
// kelimelik bir ipucu fırsatı sunar. Dağıtım, ilişkili kelimeleri ayırmak
// yerine tam tersini yapan düz rastgele atamaya göre belirgin şekilde daha
// zor ve riskli bir tahta üretir (ör. "Marangoz" kırmızıda, "Testere"
// mavide ya da suikastçıda olabilir).
function assignColors(words, clusters, colorCounts) {
  const pool = shuffle(
    Object.entries(colorCounts).flatMap(([color, n]) => Array(n).fill(color))
  );

  const clusterIndexByWord = new Map();
  clusters.forEach((cluster, ci) => {
    for (const word of cluster) clusterIndexByWord.set(word, ci);
  });

  const groups = new Map(); // clusterIndex -> words[]
  const singles = [];
  for (const word of words) {
    const ci = clusterIndexByWord.get(word);
    if (ci === undefined) {
      singles.push(word);
    } else {
      if (!groups.has(ci)) groups.set(ci, []);
      groups.get(ci).push(word);
    }
  }

  const processingOrder = shuffle([...groups.values(), ...singles.map((w) => [w])]);

  const colorByWord = new Map();
  for (const group of processingOrder) {
    const usedInGroup = new Set();
    for (const word of group) {
      let idx = pool.findIndex((c) => !usedInGroup.has(c));
      if (idx === -1) idx = 0;
      const [color] = pool.splice(idx, 1);
      usedInGroup.add(color);
      colorByWord.set(word, color);
    }
  }

  return words.map((word) => colorByWord.get(word));
}

export function generateBoard(startingTeam, difficulty = "medium") {
  const { words, clusters } = pickBoardWords(25, difficulty);
  const other = otherTeam(startingTeam);

  // Starting team moves first, which is itself an advantage, so it's given
  // one extra word to find (9 vs 8) — otherwise the team with fewer words
  // would stack an easier task on top of the first-move edge, making the
  // other team doubly disadvantaged.
  const colorCounts = {
    [startingTeam]: 9,
    [other]: 8,
    neutral: 7,
    assassin: 1,
  };
  const colors = assignColors(words, clusters, colorCounts);

  return words.map((word, index) => ({
    id: index,
    word,
    color: colors[index],
    revealed: false,
  }));
}

export function remainingCounts(board) {
  const counts = { red: 0, blue: 0 };
  for (const cell of board) {
    if (!cell.revealed && (cell.color === "red" || cell.color === "blue")) {
      counts[cell.color]++;
    }
  }
  return counts;
}

export function switchTurn(room) {
  room.turn = otherTeam(room.turn);
  room.clue = null;
}

export function endGame(room, winner, reason) {
  room.phase = "ended";
  room.winner = winner;
  room.winReason = reason;
  room.clue = null;
  room.matchScore[winner] += 1;
}

export function teamRoster(room, team) {
  return [...room.players.values()].filter((p) => p.team === team);
}

export function isTeamValid(room, team) {
  const roster = teamRoster(room, team);
  const spymasters = roster.filter((p) => p.role === "spymaster");
  const operatives = roster.filter((p) => p.role === "operative");
  return spymasters.length === 1 && operatives.length >= 1;
}

export function canStartGame(room) {
  return isTeamValid(room, "red") && isTeamValid(room, "blue");
}
