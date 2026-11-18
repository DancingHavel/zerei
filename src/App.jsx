import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadLibrary, saveLibrary, loadSettings, saveSettings, isTauri } from "./backend.js";
import { gameDetails, igdbToEntry } from "./igdb.js";
import { newEntry, STATUSES, errorMessage } from "./constants.js";
import Library from "./Library.jsx";
import AddGame from "./AddGame.jsx";
import Explore from "./Explore.jsx";
import GameModal from "./GameModal.jsx";
import Stats from "./Stats.jsx";
import Settings from "./Settings.jsx";
import { Spinner } from "./ui.jsx";
import { autoTags, mergeTags, tagColor } from "./tags.js";
import { checkUpdate, installUpdate } from "./updater.js";

const NAV = [
  { id: "library", label: "Minha estante", icon: "▦" },
  { id: "explore", label: "Explorar jogos", icon: "✦" },
  { id: "stats", label: "Estatísticas", icon: "▤" },
  { id: "settings", label: "Configurações", icon: "⚙" },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [games, setGames] = useState([]);
  const [settings, setSettings] = useState({});
  const [view, setView] = useState(() => new URLSearchParams(location.search).get("view") || "library");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState({ tags: [], mode: "all" });
  const [openId, setOpenId] = useState(null);
  const [preview, setPreview] = useState(null); // jogo da IGDB ainda não adicionado
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);
  const saveTimer = useRef(null);
  const [update, setUpdate] = useState(null);
  const [updating, setUpdating] = useState(null); // % do download

  // procura atualização alguns segundos depois de abrir
  useEffect(() => {
    const t = setTimeout(() => checkUpdate().then((u) => u && setUpdate(u)).catch(() => {}), 3000);
    return () => clearTimeout(t);
  }, []);

  const doUpdate = async (u = update) => {
    try {
      setUpdating(0);
      await saveLibrary(games); // garante que nada se perde
      await installUpdate(u, setUpdating);
    } catch (e) {
      setUpdating(null);
      notify("Erro ao atualizar: " + e, "error");
    }
  };

  useEffect(() => {
    Promise.all([loadLibrary(), loadSettings()]).then(([g, s]) => {
      // jogos antigos ganham tags automáticas uma única vez
      setGames(
        g.map((x) =>
          x.autoTagged ? x : { ...x, tags: mergeTags(x.tags, autoTags(x)), autoTagged: true }
        )
      );
      setSettings(s);
      setReady(true);
    });
  }, []);

  // salva automaticamente (meio segundo depois da última mudança)
  useEffect(() => {
    if (!ready) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveLibrary(games).catch((e) => notify("Erro ao salvar: " + e, "error"));
    }, 500);
  }, [games, ready]);

  const notify = useCallback((msg, kind = "ok") => {
    setToast({ msg, kind, t: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  // atalho Ctrl+K para adicionar jogo
  useEffect(() => {
    const k = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAdding(true);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const updateSettings = (s) => {
    setSettings(s);
    saveSettings(s).catch((e) => notify("Erro ao salvar configurações: " + e, "error"));
  };

  const byIgdb = useMemo(() => {
    const m = new Map();
    for (const g of games) if (g.igdbId) m.set(g.igdbId, g);
    return m;
  }, [games]);

  const updateGame = useCallback((id, patch) => {
    setGames((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: Date.now() } : g)));
  }, []);

  const removeGame = useCallback((id) => {
    setGames((gs) => gs.filter((g) => g.id !== id));
    setOpenId(null);
    notify("Jogo removido da estante.");
  }, [notify]);

  const addManual = (data, status) => {
    const e = newEntry(data, status);
    setGames((gs) => [e, ...gs]);
    notify(`"${e.name}" adicionado!`);
    return e;
  };

  // adiciona um jogo da IGDB buscando todos os detalhes (expansões, fotos...)
  const addFromIgdb = async (igdbId, status = "backlog") => {
    const existing = byIgdb.get(igdbId);
    if (existing) {
      updateGame(existing.id, { status });
      notify(`"${existing.name}" já estava na estante — status atualizado.`);
      return existing;
    }
    try {
      const d = await gameDetails(settings, igdbId);
      if (!d) throw new Error("Jogo não encontrado na IGDB.");
      const e = newEntry(igdbToEntry(d), status);
      e.tags = autoTags(e);
      e.autoTagged = true;
      if (status === "playing") e.startedAt = new Date().toISOString().slice(0, 10);
      setGames((gs) => [e, ...gs]);
      notify(`"${e.name}" adicionado em ${STATUSES.find((s) => s.id === status).label}!`);
      return e;
    } catch (err) {
      notify(errorMessage(err), "error");
      return null;
    }
  };

  // atualiza capa/expansões/plataformas de um jogo já salvo
  const refreshFromIgdb = async (game) => {
    try {
      const d = await gameDetails(settings, game.igdbId);
      if (!d) return;
      const fresh = igdbToEntry(d);
      const played = new Set(game.extras.filter((x) => x.played).map((x) => x.igdbId));
      fresh.extras = fresh.extras.map((x) => ({ ...x, played: played.has(x.igdbId) }));
      fresh.tags = mergeTags(game.tags, autoTags(fresh));
      updateGame(game.id, fresh);
      notify("Dados atualizados da IGDB.");
    } catch (err) {
      notify(errorMessage(err), "error");
    }
  };

  const openPreview = async (igdbId) => {
    const existing = byIgdb.get(igdbId);
    if (existing) return setOpenId(existing.id);
    setPreview({ loading: true });
    try {
      const d = await gameDetails(settings, igdbId);
      setPreview(d ? newEntry(igdbToEntry(d), null) : null);
    } catch (err) {
      setPreview(null);
      notify(errorMessage(err), "error");
    }
  };

  const importGames = (list, mode) => {
    setGames((gs) => {
      if (mode === "replace") return list;
      const ids = new Set(gs.map((g) => g.id));
      const igdb = new Set(gs.map((g) => g.igdbId).filter(Boolean));
      const novos = list.filter((g) => !ids.has(g.id) && !(g.igdbId && igdb.has(g.igdbId)));
      return [...gs, ...novos];
    });
  };

  const counts = useMemo(() => {
    const c = { all: games.length };
    for (const g of games) c[g.status] = (c[g.status] || 0) + 1;
    return c;
  }, [games]);

  const tagCounts = useMemo(() => {
    const m = new Map();
    for (const g of games) for (const t of g.tags || []) m.set(t, (m.get(t) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [games]);
  const allTags = useMemo(() => tagCounts.map(([t]) => t), [tagCounts]);

  const filterByTag = (t) => {
    setTagFilter({ tags: [t], mode: "all" });
    setStatusFilter("all");
    setView("library");
    setOpenId(null);
  };

  if (!ready)
    return (
      <div className="boot">
        <Spinner />
      </div>
    );

  const openGame = games.find((g) => g.id === openId);

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <div className="brand-logo">Z</div>
          <div>
            <b>Zerei</b>
            <small>sua estante de jogos · v{__APP_VERSION__}</small>
          </div>
        </div>
        <button className="btn primary add-btn" onClick={() => setAdding(true)}>
          + Adicionar jogo <kbd>Ctrl K</kbd>
        </button>
        <nav>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${view === n.id ? "active" : ""}`}
              onClick={() => setView(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="side-sec">Status</div>
        <nav className="status-nav">
          <button
            className={`nav-item ${view === "library" && statusFilter === "all" ? "active" : ""}`}
            onClick={() => { setView("library"); setStatusFilter("all"); }}
          >
            <i className="dot" style={{ "--c": "#e2e8f0" }} />
            Todos <em>{counts.all || 0}</em>
          </button>
          {STATUSES.map((s) => (
            <button
              key={s.id}
              className={`nav-item ${view === "library" && statusFilter === s.id ? "active" : ""}`}
              onClick={() => { setView("library"); setStatusFilter(s.id); }}
            >
              <i className="dot" style={{ "--c": s.color }} />
              {s.label} <em>{counts[s.id] || 0}</em>
            </button>
          ))}
        </nav>
        {tagCounts.length > 0 && (
          <>
            <div className="side-sec">Tags mais usadas</div>
            <nav className="status-nav">
              {tagCounts.slice(0, 10).map(([t, n]) => (
                <button
                  key={t}
                  className={`nav-item ${view === "library" && tagFilter.tags.length === 1 && tagFilter.tags[0] === t ? "active" : ""}`}
                  onClick={() => filterByTag(t)}
                >
                  <i className="dot" style={{ "--c": tagColor(t) }} />
                  {t} <em>{n}</em>
                </button>
              ))}
            </nav>
          </>
        )}
        {!isTauri && <div className="demo-flag">Modo demonstração (navegador)</div>}
      </aside>

      <main className="main">
        {update && (
          <div className="update-bar">
            <span>
              🚀 Nova versão <b>{update.version}</b> disponível!
              {update.body && <em> {update.body}</em>}
            </span>
            {updating == null ? (
              <span className="row gap">
                <button className="btn small ghost" onClick={() => setUpdate(null)}>Depois</button>
                <button className="btn small primary" onClick={() => doUpdate()}>Atualizar agora</button>
              </span>
            ) : (
              <span className="update-progress">
                Baixando... {updating}%
                <i><b style={{ width: `${updating}%` }} /></i>
              </span>
            )}
          </div>
        )}
        {view === "library" && (
          <Library
            games={games}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            onOpen={setOpenId}
            onUpdate={updateGame}
            onAdd={() => setAdding(true)}
          />
        )}
        {view === "explore" && (
          <Explore settings={settings} byIgdb={byIgdb} onAdd={addFromIgdb} onOpen={openPreview} goSettings={() => setView("settings")} />
        )}
        {view === "stats" && (
          <Stats games={games} onOpen={setOpenId} tagFilter={tagFilter} setTagFilter={setTagFilter} onTag={filterByTag} />
        )}
        {view === "settings" && (
          <Settings
            settings={settings}
            onChange={updateSettings}
            games={games}
            onImport={importGames}
            notify={notify}
            onFoundUpdate={(u) => setUpdate(u)}
          />
        )}
      </main>

      {adding && (
        <AddGame
          settings={settings}
          byIgdb={byIgdb}
          onClose={() => setAdding(false)}
          onAdd={addFromIgdb}
          onAddManual={addManual}
          onOpen={(id) => { setAdding(false); openPreview(id); }}
          goSettings={() => { setAdding(false); setView("settings"); }}
        />
      )}

      {openGame && (
        <GameModal
          game={openGame}
          onClose={() => setOpenId(null)}
          onUpdate={(p) => updateGame(openGame.id, p)}
          onRemove={() => removeGame(openGame.id)}
          onRefresh={() => refreshFromIgdb(openGame)}
          onOpenIgdb={openPreview}
          onAddIgdb={addFromIgdb}
          byIgdb={byIgdb}
          allTags={allTags}
          onTag={filterByTag}
        />
      )}

      {preview && (
        <GameModal
          game={preview}
          isPreview
          onClose={() => setPreview(null)}
          onAddIgdb={async (id, st) => {
            const e = await addFromIgdb(id, st);
            setPreview(null);
            if (e) setOpenId(e.id);
          }}
          onOpenIgdb={openPreview}
          byIgdb={byIgdb}
        />
      )}

      {toast && (
        <div key={toast.t} className={`toast ${toast.kind}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
