export const STATUSES = [
  { id: "playing", label: "Jogando", color: "#38bdf8" },
  { id: "backlog", label: "Quero jogar", color: "#a78bfa" },
  { id: "paused", label: "Pausado", color: "#fbbf24" },
  { id: "finished", label: "Zerado", color: "#34d399" },
  { id: "completed", label: "100% / Platinado", color: "#f472b6" },
  { id: "dropped", label: "Larguei", color: "#f87171" },
  { id: "wishlist", label: "Lista de desejos", color: "#94a3b8" },
];
export const STATUS = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

export const SORTS = {
  updated: "Mexidos recentemente",
  added: "Adicionados recentemente",
  name: "Nome (A–Z)",
  rating: "Minha nota",
  igdb: "Nota da crítica",
  release: "Lançamento (novo → antigo)",
  hours: "Horas jogadas",
};

export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export function newEntry(data, status = "backlog") {
  const now = Date.now();
  return {
    id: uid(),
    igdbId: null,
    name: "",
    cover: null,
    customCover: "",
    summary: "",
    releaseDate: null,
    platforms: [],
    genres: [],
    developers: [],
    publishers: [],
    extras: [],
    screenshots: [],
    // dados pessoais
    status,
    myPlatform: "",
    rating: 0,
    hours: 0,
    startedAt: "",
    finishedAt: "",
    notes: "",
    favorite: false,
    tags: [],
    addedAt: now,
    updatedAt: now,
    ...data,
  };
}

export function errorMessage(e) {
  const s = String(e?.message || e);
  if (s.includes("NO_KEYS")) return "Configure suas chaves da IGDB em Configurações para buscar jogos.";
  return s;
}

export const fmtDate = (unix) =>
  unix ? new Date(unix * 1000).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";
