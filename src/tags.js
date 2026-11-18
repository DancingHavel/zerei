// Tags prontas, organizadas por grupo. O usuário também pode criar as suas.
export const TAG_GROUPS = [
  {
    name: "Gênero",
    color: "#a78bfa",
    tags: [
      "RPG", "JRPG", "Action RPG", "CRPG", "MMORPG", "FPS", "TPS", "Shooter", "Looter shooter", "Hero shooter",
      "Ação", "Aventura", "Ação-aventura", "Plataforma", "Metroidvania", "Soulslike", "Roguelike", "Roguelite",
      "Hack and slash", "Beat 'em up", "Luta", "Corrida", "Esporte", "Futebol", "Basquete", "Simulação",
      "Simulador de voo", "Simulador de veículos", "Estratégia", "RTS", "Tática por turnos", "Tática", "4X",
      "Grand strategy", "Tower defense", "Puzzle", "Survival", "Survival horror", "Terror", "Stealth", "Sandbox",
      "Battle royale", "MOBA", "Ritmo / Música", "Visual novel", "Point and click", "Cartas", "Deckbuilder",
      "Tabuleiro", "Party game", "Gerenciamento", "City builder", "Construção", "Colônia", "Fazenda", "Life sim",
      "Arcade", "Shoot 'em up", "Bullet hell", "Pinball", "Quiz", "Idle / Incremental", "Walking simulator",
      "Investigação", "Educativo", "Mundo aberto", "Extraction shooter", "Dating sim", "Pesca", "Caça",
    ],
  },
  {
    name: "Ambientação",
    color: "#fbbf24",
    tags: [
      "Medieval", "Fantasia", "Fantasia sombria", "Ficção científica", "Cyberpunk", "Steampunk", "Pós-apocalíptico",
      "Espacial", "Histórico", "Guerra", "Segunda Guerra", "Guerra moderna", "Militar", "Velho Oeste", "Zumbis",
      "Vampiros", "Lovecraft", "Mitologia", "Mitologia nórdica", "Mitologia grega", "Japão feudal", "Ninja / Samurai",
      "Piratas", "Crime / Máfia", "Policial", "Super-herói", "Anime", "Cartoon", "Natureza", "Subaquático",
      "Urbano", "Contemporâneo", "Futurista", "Distopia", "Alienígenas", "Robôs / Mechas", "Dinossauros",
      "Dragões", "Magia", "Sobrenatural", "Psicológico", "Mistério", "Suspense", "Comédia", "Drama", "Romance",
      "Infantil", "Esportes reais", "Baseado em filme / série",
    ],
  },
  {
    name: "Modo de jogo",
    color: "#38bdf8",
    tags: [
      "Single-player", "Multiplayer", "Co-op", "Co-op local", "Co-op online", "Split-screen", "Online", "PvP",
      "PvE", "Competitivo", "MMO", "Crossplay",
    ],
  },
  {
    name: "Estilo",
    color: "#34d399",
    tags: [
      "Primeira pessoa", "Terceira pessoa", "Isométrico", "Visão de cima", "Side-scroller", "2D", "2.5D", "3D",
      "Pixel art", "Retrô", "Low poly", "Cel shading", "Realista", "Indie", "AAA", "VR",
      "História forte", "Escolhas importam", "Múltiplos finais", "Difícil", "Relaxante / Cozy", "Curto", "Longo",
      "Rejogável", "Linear", "Crafting", "Loot", "Permadeath", "Combate por turnos", "Combate em tempo real",
      "Personalização de personagem", "Árvore de habilidades", "Exploração", "Coleta", "Física",
      "Remake", "Remaster", "Clássico", "Early access", "Free to play", "Gacha", "Live service", "Mods",
    ],
  },
  {
    name: "Pessoal",
    color: "#f472b6",
    tags: [
      "Obra-prima", "Favorito da infância", "Jogar com amigos", "Jogar com a família", "Pra relaxar",
      "Pra jogar de novo", "Comprado", "Na promoção", "Game Pass", "PS Plus", "Emprestado", "Físico", "Digital",
      "Recomendação", "Decepção",
    ],
  },
];

export const ALL_TAGS = TAG_GROUPS.flatMap((g) => g.tags);
const groupOf = new Map(TAG_GROUPS.flatMap((g) => g.tags.map((t) => [t.toLowerCase(), g])));
export const tagColor = (t) => groupOf.get(t.toLowerCase())?.color || "#94a3b8";
export const tagGroup = (t) => groupOf.get(t.toLowerCase())?.name || "Minhas tags";

// Tradução dos campos da IGDB para as tags acima.
const MAP = {
  // gêneros
  "role-playing (rpg)": ["RPG"],
  shooter: ["Shooter"],
  platform: ["Plataforma"],
  puzzle: ["Puzzle"],
  racing: ["Corrida"],
  "real time strategy (rts)": ["RTS", "Estratégia"],
  simulator: ["Simulação"],
  sport: ["Esporte"],
  strategy: ["Estratégia"],
  "turn-based strategy (tbs)": ["Tática por turnos", "Estratégia"],
  tactical: ["Tática"],
  "hack and slash/beat 'em up": ["Hack and slash"],
  fighting: ["Luta"],
  adventure: ["Aventura"],
  indie: ["Indie"],
  arcade: ["Arcade"],
  "visual novel": ["Visual novel"],
  "card & board game": ["Cartas"],
  moba: ["MOBA"],
  "point-and-click": ["Point and click"],
  music: ["Ritmo / Música"],
  pinball: ["Pinball"],
  "quiz/trivia": ["Quiz"],
  // temas
  action: ["Ação"],
  fantasy: ["Fantasia"],
  "science fiction": ["Ficção científica"],
  horror: ["Terror"],
  thriller: ["Suspense"],
  survival: ["Survival"],
  historical: ["Histórico"],
  stealth: ["Stealth"],
  comedy: ["Comédia"],
  business: ["Gerenciamento"],
  drama: ["Drama"],
  sandbox: ["Sandbox"],
  educational: ["Educativo"],
  kids: ["Infantil"],
  "open world": ["Mundo aberto"],
  warfare: ["Guerra"],
  party: ["Party game"],
  "4x (explore, expand, exploit, and exterminate)": ["4X"],
  mystery: ["Mistério"],
  romance: ["Romance"],
  // modos
  "single player": ["Single-player"],
  multiplayer: ["Multiplayer"],
  "co-operative": ["Co-op"],
  "split screen": ["Split-screen", "Co-op local"],
  "massively multiplayer online (mmo)": ["MMO"],
  "battle royale": ["Battle royale"],
  // perspectivas
  "first person": ["Primeira pessoa"],
  "third person": ["Terceira pessoa"],
  "bird view / isometric": ["Isométrico"],
  "side view": ["Side-scroller"],
  "virtual reality": ["VR"],
  text: [],
  auditory: [],
};

// Gera tags automáticas a partir dos dados do jogo.
export function autoTags(game) {
  const src = [
    ...(game.genres || []),
    ...(game.themes || []),
    ...(game.modes || []),
    ...(game.perspectives || []),
  ].map((s) => s.toLowerCase());
  const out = new Set();
  for (const s of src) for (const t of MAP[s] || []) out.add(t);
  if (out.has("Shooter") && out.has("Primeira pessoa")) out.add("FPS");
  if (out.has("Shooter") && out.has("Terceira pessoa")) out.add("TPS");
  if (out.has("RPG") && out.has("Ação")) out.add("Action RPG");
  if (out.has("Terror") && out.has("Survival")) out.add("Survival horror");
  if (out.has("Ação") && out.has("Aventura")) out.add("Ação-aventura");
  const t = (game.gameType || "").toLowerCase();
  if (t === "remake") out.add("Remake");
  if (t === "remaster") out.add("Remaster");
  return [...out];
}

export const mergeTags = (a = [], b = []) => {
  const seen = new Set(a.map((x) => x.toLowerCase()));
  return [...a, ...b.filter((x) => !seen.has(x.toLowerCase()))];
};
