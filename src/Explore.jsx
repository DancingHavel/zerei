import { useEffect, useMemo, useState } from "react";
import { EXPLORE_MODES, exploreGames, listPlatforms, yearOf, img } from "./igdb.js";
import { Cover, Spinner, Empty } from "./ui.jsx";
import { errorMessage } from "./constants.js";

// Plataformas mais comuns aparecem primeiro como atalhos.
const FAVORITE_PLATFORMS = [6, 167, 48, 9, 8, 7, 169, 49, 12, 130, 41, 4, 18, 19, 24, 37, 46, 38, 11, 34, 39, 21, 23, 29, 64, 32];

export default function Explore({ settings, byIgdb, onAdd, onOpen, goSettings }) {
  const [mode, setMode] = useState("top");
  const [platformId, setPlatformId] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    listPlatforms(settings).then(setPlatforms).catch(() => {});
  }, [settings]);

  const load = async (reset) => {
    setLoading(true);
    const off = reset ? 0 : offset;
    try {
      const r = await exploreGames(settings, { mode, platformId: platformId || null, offset: off });
      setGames((g) => (reset ? r : [...g, ...r]));
      setOffset(off + r.length);
      setHasMore(r.length >= 60);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, platformId, settings]);

  const sortedPlatforms = useMemo(() => {
    const fav = FAVORITE_PLATFORMS.map((id) => platforms.find((p) => p.id === id)).filter(Boolean);
    const rest = platforms.filter((p) => !FAVORITE_PLATFORMS.includes(p.id));
    return { fav, rest };
  }, [platforms]);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Explorar jogos</h1>
          <p className="muted">Navegue pelo catálogo da IGDB — mais de 300 mil jogos de todas as plataformas.</p>
        </div>
      </header>

      <div className="toolbar">
        <div className="seg wide">
          {Object.entries(EXPLORE_MODES).map(([k, v]) => (
            <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{v.label}</button>
          ))}
        </div>
        <select value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
          <option value="">Todas as plataformas</option>
          <optgroup label="Populares">
            {sortedPlatforms.fav.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </optgroup>
          <optgroup label="Todas">
            {sortedPlatforms.rest.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </optgroup>
        </select>
      </div>

      {platformId && (() => {
        const p = platforms.find((x) => String(x.id) === String(platformId));
        return p?.platform_logo ? (
          <div className="plat-banner">
            <img src={img(p.platform_logo.image_id, "logo_med", "png")} alt="" />
            <b>{p.name}</b>
          </div>
        ) : null;
      })()}

      {error ? (
        <Empty title="Não deu pra carregar">
          <p>{error}</p>
          {error.includes("Configurações") && <button className="btn primary" onClick={goSettings}>Abrir Configurações</button>}
        </Empty>
      ) : (
        <>
          <div className="grid">
            {games.map((g) => {
              const have = byIgdb.get(g.id);
              return (
                <div key={g.id} className="card" onClick={() => onOpen(g.id)}>
                  <div className="card-cover">
                    <Cover game={{ name: g.name, cover: g.cover?.image_id }} />
                    {g.total_rating && <span className="score corner">{Math.round(g.total_rating)}</span>}
                    {have && <span className="have-badge">✓ Na estante</span>}
                  </div>
                  <div className="card-body">
                    <div className="card-title" title={g.name}>{g.name}</div>
                    <div className="card-meta">
                      <span>{(g.genres || []).slice(0, 1).map((x) => x.name)}</span>
                      <span>{yearOf(g.first_release_date) || ""}</span>
                    </div>
                    {!have && (
                      <div className="quick-add" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onAdd(g.id, "backlog")}>+ Quero jogar</button>
                        <button onClick={() => onAdd(g.id, "finished")}>✓ Zerei</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {loading && <div className="center pad"><Spinner /></div>}
          {!loading && hasMore && games.length > 0 && (
            <div className="center pad">
              <button className="btn ghost" onClick={() => load(false)}>Carregar mais</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
