// Dados falsos usados SOMENTE quando a tela é aberta no navegador para teste.
// No programa de verdade (Tauri) os dados vêm da IGDB.
const P = {
  pc: { id: 6, name: "PC (Microsoft Windows)", abbreviation: "PC" },
  ps5: { id: 167, name: "PlayStation 5", abbreviation: "PS5" },
  ps4: { id: 48, name: "PlayStation 4", abbreviation: "PS4" },
  sw: { id: 130, name: "Nintendo Switch", abbreviation: "Switch" },
  xs: { id: 169, name: "Xbox Series X|S", abbreviation: "Series X|S" },
  snes: { id: 19, name: "Super Nintendo Entertainment System", abbreviation: "SNES" },
};
const g = (id, name, year, plats, genres, extra = {}) => ({
  id,
  name,
  first_release_date: Date.UTC(year, 2, 1) / 1000,
  platforms: plats,
  genres: genres.map((n, i) => ({ id: i, name: n })),
  game_type: { type: "Main Game" },
  summary:
    "Jogo de demonstração. No programa instalado, aqui aparece a descrição oficial vinda da IGDB, com capa, fotos, plataformas e expansões.",
  total_rating: 70 + (id % 25),
  ...extra,
});

export const DEMO_RESULTS = {
  platforms: Object.values(P),
  games: [
    g(1, "Elden Ring", 2022, [P.pc, P.ps5, P.ps4, P.xs], ["RPG", "Adventure"], {
      expansions: [{ id: 101, name: "Elden Ring: Shadow of the Erdtree", first_release_date: 1718928000 }],
      involved_companies: [{ developer: true, company: { name: "FromSoftware" } }],
    }),
    g(2, "The Witcher 3: Wild Hunt", 2015, [P.pc, P.ps4, P.ps5, P.sw, P.xs], ["RPG"], {
      expansions: [
        { id: 201, name: "The Witcher 3: Wild Hunt - Hearts of Stone", first_release_date: 1444694400 },
        { id: 202, name: "The Witcher 3: Wild Hunt - Blood and Wine", first_release_date: 1464048000 },
      ],
      involved_companies: [{ developer: true, company: { name: "CD Projekt RED" } }],
    }),
    g(3, "Hollow Knight", 2017, [P.pc, P.sw, P.ps4], ["Platform", "Adventure", "Indie"]),
    g(4, "Hades", 2020, [P.pc, P.sw, P.ps5, P.xs], ["Roguelike", "Indie"]),
    g(5, "Celeste", 2018, [P.pc, P.sw, P.ps4], ["Platform", "Indie"]),
    g(6, "Chrono Trigger", 1995, [P.snes, P.pc], ["RPG"]),
    g(7, "Stardew Valley", 2016, [P.pc, P.sw, P.ps4], ["Simulator", "RPG", "Indie"]),
    g(8, "God of War Ragnarök", 2022, [P.ps4, P.ps5, P.pc], ["Adventure", "Hack and slash"], {
      dlcs: [{ id: 801, name: "God of War Ragnarök: Valhalla", first_release_date: 1702512000 }],
    }),
  ],
};

// Estante de exemplo para prints (abra no navegador com ?demo).
export function demoLibrary() {
  const now = Date.now();
  const mk = (name, status, extra) => ({
    id: name.replace(/\W+/g, "-").toLowerCase(), name, status, cover: null, customCover: "", summary: "",
    platforms: [], genres: [], extras: [], screenshots: [], tags: [], rating: 0, hours: 0, startedAt: "",
    finishedAt: "", notes: "", myPlatform: "", favorite: false, autoTagged: true, addedAt: now, updatedAt: now,
    ...extra,
  });
  const y = (n) => Date.UTC(n, 5, 1) / 1000;
  return [
    mk("Elden Ring", "playing", { myPlatform: "PS5", hours: 64, rating: 10, favorite: true, releaseDate: y(2022), tags: ["RPG", "Soulslike", "Mundo aberto", "Fantasia sombria", "Difícil"], extras: [{ igdbId: 1, name: "Shadow of the Erdtree", kind: "Expansão", played: false }] }),
    mk("The Witcher 3: Wild Hunt", "completed", { myPlatform: "PC", hours: 140, rating: 10, releaseDate: y(2015), finishedAt: "2024-03-10", tags: ["RPG", "Medieval", "Fantasia", "Mundo aberto", "História forte"], extras: [{ igdbId: 2, name: "Hearts of Stone", kind: "Expansão", played: true }, { igdbId: 3, name: "Blood and Wine", kind: "Expansão", played: true }] }),
    mk("Hollow Knight", "finished", { myPlatform: "Switch", hours: 42, rating: 9, releaseDate: y(2017), finishedAt: "2024-08-10", tags: ["Metroidvania", "Indie", "Difícil", "2D"] }),
    mk("Hades", "completed", { myPlatform: "PC", hours: 90, rating: 10, favorite: true, releaseDate: y(2020), finishedAt: "2025-02-01", tags: ["Roguelike", "Indie", "Mitologia grega"] }),
    mk("Halo Infinite", "backlog", { myPlatform: "Series X|S", releaseDate: y(2021), tags: ["FPS", "Shooter", "Ficção científica", "Multiplayer"] }),
    mk("Cyberpunk 2077", "paused", { myPlatform: "PC", hours: 30, rating: 8, releaseDate: y(2020), tags: ["RPG", "FPS", "Cyberpunk", "Mundo aberto"] }),
    mk("Stardew Valley", "finished", { myPlatform: "Switch", hours: 120, rating: 9, releaseDate: y(2016), finishedAt: "2023-12-20", tags: ["Fazenda", "Simulação", "Relaxante / Cozy", "Co-op"] }),
    mk("Chrono Trigger", "backlog", { myPlatform: "SNES", releaseDate: y(1995), tags: ["JRPG", "Clássico", "Pixel art"] }),
    mk("Gears 5", "dropped", { myPlatform: "PC", hours: 6, rating: 6, releaseDate: y(2019), tags: ["TPS", "Shooter", "Co-op"] }),
    mk("Kingdom Come: Deliverance", "backlog", { myPlatform: "PC", releaseDate: y(2018), tags: ["RPG", "Medieval", "Histórico", "Primeira pessoa"] }),
    mk("Celeste", "finished", { myPlatform: "PC", hours: 12, rating: 9, releaseDate: y(2018), finishedAt: "2025-06-02", tags: ["Plataforma", "Indie", "Pixel art", "Difícil"] }),
    mk("Hollow Knight: Silksong", "wishlist", { releaseDate: y(2025), tags: ["Metroidvania", "Indie"] }),
  ];
}
