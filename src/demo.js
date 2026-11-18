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
