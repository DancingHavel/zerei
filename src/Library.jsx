import { useMemo, useState } from "react";
import { STATUSES, STATUS, SORTS } from "./constants.js";
import { yearOf } from "./igdb.js";
import { Cover, Stars, StatusBadge, Empty, Modal } from "./ui.jsx";
import { TagFilter, ActiveTags, matchTags } from "./TagUI.jsx";

function usePersisted(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem("zerei.ui." + key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  const set = (x) => {
    setV(x);
    try { localStorage.setItem("zerei.ui." + key, JSON.stringify(x)); } catch { /* ignore */ }
  };
  return [v, set];
}

const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Library({ games, statusFilter, setStatusFilter, tagFilter, setTagFilter, onOpen, onUpdate, onAdd }) {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("");
  const [genre, setGenre] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = usePersisted("sort", "updated");
  const [layout, setLayout] = usePersisted("layout", "grid");
  const [pick, setPick] = useState(null);

  const platforms = useMemo(() => {
    const s = new Set();
    for (const g of games) {
      if (g.myPlatform) s.add(g.myPlatform);
    }
    return [...s].sort();
  }, [games]);

  const genres = useMemo(() => {
    const s = new Set();
    for (const g of games) for (const x of g.genres || []) s.add(x);
    return [...s].sort();
  }, [games]);

  const list = useMemo(() => {
    const nq = norm(q);
    let r = games.filter((g) => {
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (favOnly && !g.favorite) return false;
      if (platform && g.myPlatform !== platform) return false;
      if (genre && !(g.genres || []).includes(genre)) return false;
      if (!matchTags(g, tagFilter)) return false;
      if (nq) {
        const hay = norm([g.name, g.franchise, ...(g.developers || []), ...(g.tags || []), g.notes].join(" "));
        if (!hay.includes(nq)) return false;
      }
      return true;
    });
    const cmp = {
      updated: (a, b) => b.updatedAt - a.updatedAt,
      added: (a, b) => b.addedAt - a.addedAt,
      name: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      igdb: (a, b) => (b.igdbRating || 0) - (a.igdbRating || 0),
      release: (a, b) => (b.releaseDate || 0) - (a.releaseDate || 0),
      hours: (a, b) => (b.hours || 0) - (a.hours || 0),
    }[sort];
    return r.sort(cmp);
  }, [games, statusFilter, favOnly, platform, genre, q, sort, tagFilter]);

  const roll = () => {
    const pool = games.filter((g) => g.status === "backlog");
    if (!pool.length) return setPick({ none: true });
    setPick(pool[Math.floor(Math.random() * pool.length)]);
  };

  const title = statusFilter === "all" ? "Minha estante" : STATUS[statusFilter].label;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="muted">
            {list.length} {list.length === 1 ? "jogo" : "jogos"}
            {list.length !== games.length && ` de ${games.length}`}
          </p>
        </div>
        <button className="btn ghost" onClick={roll} title="Sorteia um jogo da lista 'Quero jogar'">
          🎲 O que jogar agora?
        </button>
      </header>

      <div className="tabs">
        <button className={statusFilter === "all" ? "on" : ""} onClick={() => setStatusFilter("all")}>Todos</button>
        {STATUSES.map((s) => (
          <button
            key={s.id}
            style={{ "--c": s.color }}
            className={statusFilter === s.id ? "on" : ""}
            onClick={() => setStatusFilter(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input className="search" placeholder="Buscar na estante (nome, estúdio, anotação, tag...)" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">Todas plataformas</option>
          {platforms.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">Todos gêneros</option>
          {genres.map((p) => <option key={p}>{p}</option>)}
        </select>
        <TagFilter games={games} filter={tagFilter} setFilter={setTagFilter} />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className={`btn icon ${favOnly ? "on" : ""}`} title="Só favoritos" onClick={() => setFavOnly(!favOnly)}>♥</button>
        <div className="seg">
          <button className={layout === "grid" ? "on" : ""} onClick={() => setLayout("grid")} title="Grade">▦</button>
          <button className={layout === "list" ? "on" : ""} onClick={() => setLayout("list")} title="Lista">☰</button>
        </div>
      </div>

      <ActiveTags filter={tagFilter} setFilter={setTagFilter} />

      {games.length === 0 ? (
        <Empty title="Sua estante está vazia">
          <p>Comece adicionando os jogos que você já zerou e os que quer jogar.</p>
          <button className="btn primary" onClick={onAdd}>+ Adicionar primeiro jogo</button>
        </Empty>
      ) : list.length === 0 ? (
        <Empty title="Nada encontrado">
          <p>Tente mudar os filtros.</p>
        </Empty>
      ) : layout === "grid" ? (
        <div className="grid">
          {list.map((g) => <Card key={g.id} g={g} onOpen={onOpen} onUpdate={onUpdate} />)}
        </div>
      ) : (
        <div className="rows">
          {list.map((g) => <Row key={g.id} g={g} onOpen={onOpen} onUpdate={onUpdate} />)}
        </div>
      )}

      {pick && (
        <Modal onClose={() => setPick(null)} className="pick">
          {pick.none ? (
            <p>Sua lista "Quero jogar" está vazia. Adicione alguns jogos nela primeiro!</p>
          ) : (
            <>
              <p className="muted">O destino escolheu:</p>
              <Cover game={pick} className="pick-cover" />
              <h2>{pick.name}</h2>
              <div className="row gap center">
                <button className="btn ghost" onClick={roll}>🎲 Sortear de novo</button>
                <button
                  className="btn primary"
                  onClick={() => {
                    onUpdate(pick.id, { status: "playing", startedAt: new Date().toISOString().slice(0, 10) });
                    setPick(null);
                  }}
                >
                  ▶ Começar a jogar
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function QuickStatus({ g, onUpdate }) {
  return (
    <select
      className="quick-status"
      value={g.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const status = e.target.value;
        const patch = { status };
        const today = new Date().toISOString().slice(0, 10);
        if ((status === "finished" || status === "completed") && !g.finishedAt) patch.finishedAt = today;
        if (status === "playing" && !g.startedAt) patch.startedAt = today;
        onUpdate(g.id, patch);
      }}
    >
      {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
    </select>
  );
}

function Card({ g, onOpen, onUpdate }) {
  const extrasDone = g.extras?.filter((x) => x.played).length || 0;
  return (
    <div className="card" onClick={() => onOpen(g.id)}>
      <div className="card-cover">
        <Cover game={g} />
        <button
          className={`fav ${g.favorite ? "on" : ""}`}
          onClick={(e) => { e.stopPropagation(); onUpdate(g.id, { favorite: !g.favorite }); }}
          title="Favorito"
        >
          ♥
        </button>
        <div className="card-hover">
          <QuickStatus g={g} onUpdate={onUpdate} />
        </div>
        <div className="card-status" style={{ "--c": STATUS[g.status]?.color }} />
      </div>
      <div className="card-body">
        <div className="card-title" title={g.name}>{g.name}</div>
        <div className="card-meta">
          <span>{g.myPlatform || g.platforms?.[0]?.abbr || ""}</span>
          <span>{yearOf(g.releaseDate) || ""}</span>
        </div>
        <div className="card-foot">
          {g.rating ? <Stars value={g.rating} size={12} /> : <StatusBadge status={g.status} />}
          {g.extras?.length > 0 && (
            <span className="mini" title="Expansões/DLCs jogadas">+{extrasDone}/{g.extras.length}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ g, onOpen, onUpdate }) {
  return (
    <div className="row-item" onClick={() => onOpen(g.id)}>
      <Cover game={g} size="cover_small" className="row-cover" />
      <div className="row-main">
        <b>{g.favorite && <span className="heart">♥ </span>}{g.name}</b>
        <span className="muted">
          {[yearOf(g.releaseDate), g.developers?.[0], (g.tags || []).slice(0, 4).join(", ")].filter(Boolean).join(" · ")}
        </span>
      </div>
      <span className="row-plat">{g.myPlatform || "—"}</span>
      <span className="row-hours">{g.hours ? `${g.hours} h` : ""}</span>
      <Stars value={g.rating} size={13} />
      <QuickStatus g={g} onUpdate={onUpdate} />
    </div>
  );
}
