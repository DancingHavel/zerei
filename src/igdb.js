// Consultas à IGDB (banco com praticamente todos os jogos já lançados,
// mantido pela Twitch) e conversão para o formato da biblioteca.
import { igdbRaw } from "./backend.js";

export const img = (id, size = "cover_big", ext = "jpg") =>
  id ? `https://images.igdb.com/igdb/image/upload/t_${size}/${id}.${ext}` : null;

const PLATFORM_FIELDS =
  "platforms.name,platforms.abbreviation,platforms.platform_logo.image_id";

const LIST_FIELDS = [
  "name",
  "slug",
  "cover.image_id",
  "first_release_date",
  PLATFORM_FIELDS,
  "genres.name",
  "total_rating",
  "parent_game.name",
].join(",");

const DETAIL_FIELDS = [
  LIST_FIELDS,
  "summary",
  "storyline",
  "themes.name",
  "game_modes.name",
  "player_perspectives.name",
  "involved_companies.company.name",
  "involved_companies.developer",
  "involved_companies.publisher",
  "total_rating_count",
  "screenshots.image_id",
  "artworks.image_id",
  "franchises.name",
  "collections.name",
  "expansions.name",
  "expansions.cover.image_id",
  "expansions.first_release_date",
  "standalone_expansions.name",
  "standalone_expansions.cover.image_id",
  "standalone_expansions.first_release_date",
  "dlcs.name",
  "dlcs.cover.image_id",
  "dlcs.first_release_date",
  "remakes.name",
  "remasters.name",
  "similar_games.name",
  "similar_games.cover.image_id",
].join(",");

// game_type é o campo novo da IGDB (tipo: jogo principal, DLC, expansão...).
// Se a API recusar, tenta de novo sem ele.
async function query(settings, endpoint, build) {
  try {
    return await igdbRaw(settings, endpoint, build(",game_type.type"));
  } catch (e) {
    if (String(e).includes("game_type")) return igdbRaw(settings, endpoint, build(""));
    throw e;
  }
}

const esc = (s) => s.replace(/["\\]/g, " ").trim();

export function searchGames(settings, text, { includeDlc = true } = {}) {
  const where = includeDlc ? "" : " where parent_game = null;";
  return query(
    settings,
    "games",
    (gt) => `search "${esc(text)}"; fields ${LIST_FIELDS}${gt};${where} limit 50;`
  );
}

export async function gameDetails(settings, igdbId) {
  const res = await query(
    settings,
    "games",
    (gt) => `fields ${DETAIL_FIELDS}${gt}; where id = ${Number(igdbId)};`
  );
  return res[0] || null;
}

const now = () => Math.floor(Date.now() / 1000);
export const EXPLORE_MODES = {
  top: { label: "Mais bem avaliados", sort: "total_rating desc", where: () => "total_rating_count > 80" },
  popular: { label: "Mais avaliados", sort: "total_rating_count desc", where: () => "total_rating_count > 10" },
  recent: {
    label: "Lançamentos recentes",
    sort: "first_release_date desc",
    where: () => `first_release_date < ${now()} & first_release_date > ${now() - 180 * 86400} & hypes > 0`,
  },
  upcoming: { label: "Em breve", sort: "first_release_date asc", where: () => `first_release_date > ${now()} & hypes > 2` },
};

export function exploreGames(settings, { mode = "top", platformId = null, offset = 0 }) {
  const m = EXPLORE_MODES[mode];
  const conds = [m.where(), "parent_game = null"];
  if (platformId) conds.push(`platforms = (${Number(platformId)})`);
  return query(
    settings,
    "games",
    (gt) =>
      `fields ${LIST_FIELDS}${gt}; where ${conds.join(" & ")}; sort ${m.sort}; limit 60; offset ${offset};`
  );
}

let platformCache = null;
export async function listPlatforms(settings) {
  if (platformCache) return platformCache;
  const res = await igdbRaw(
    settings,
    "platforms",
    "fields name,abbreviation,platform_logo.image_id,generation,category; limit 500; sort name asc;"
  );
  platformCache = res;
  return res;
}

// ---------- conversão para o formato da biblioteca ----------

export const mapPlatform = (p) => ({
  id: p.id,
  name: p.name,
  abbr: p.abbreviation || p.name,
  logo: p.platform_logo?.image_id || null,
});

const mapExtra = (kind) => (e) => ({
  igdbId: e.id,
  name: e.name,
  cover: e.cover?.image_id || null,
  releaseDate: e.first_release_date || null,
  kind,
  played: false,
});

export function igdbToEntry(d) {
  const companies = d.involved_companies || [];
  return {
    igdbId: d.id,
    name: d.name,
    slug: d.slug || "",
    cover: d.cover?.image_id || null,
    summary: d.summary || "",
    storyline: d.storyline || "",
    releaseDate: d.first_release_date || null,
    gameType: d.game_type?.type || "",
    parentName: d.parent_game?.name || "",
    platforms: (d.platforms || []).map(mapPlatform),
    genres: (d.genres || []).map((x) => x.name),
    themes: (d.themes || []).map((x) => x.name),
    modes: (d.game_modes || []).map((x) => x.name),
    perspectives: (d.player_perspectives || []).map((x) => x.name),
    developers: companies.filter((c) => c.developer).map((c) => c.company?.name).filter(Boolean),
    publishers: companies.filter((c) => c.publisher).map((c) => c.company?.name).filter(Boolean),
    franchise: d.franchises?.[0]?.name || d.collections?.[0]?.name || "",
    igdbRating: d.total_rating ? Math.round(d.total_rating) : null,
    screenshots: [...(d.screenshots || []), ...(d.artworks || [])].map((s) => s.image_id).slice(0, 12),
    extras: [
      ...(d.expansions || []).map(mapExtra("Expansão")),
      ...(d.standalone_expansions || []).map(mapExtra("Expansão independente")),
      ...(d.dlcs || []).map(mapExtra("DLC")),
    ].sort((a, b) => (a.releaseDate || 0) - (b.releaseDate || 0)),
    similar: (d.similar_games || []).slice(0, 10).map((s) => ({
      igdbId: s.id,
      name: s.name,
      cover: s.cover?.image_id || null,
    })),
  };
}

export const yearOf = (unix) => (unix ? new Date(unix * 1000).getUTCFullYear() : null);
