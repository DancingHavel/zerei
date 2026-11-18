import { useEffect, useRef, useState } from "react";
import { searchGames, mapPlatform, yearOf } from "./igdb.js";
import { STATUSES, errorMessage } from "./constants.js";
import { Cover, Modal, PlatformChip, Spinner } from "./ui.jsx";

export default function AddGame({ settings, byIgdb, onClose, onAdd, onAddManual, onOpen, goSettings }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("backlog");
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(null);
  const inputRef = useRef();
  const seq = useRef(0);

  useEffect(() => inputRef.current?.focus(), [manual]);

  // busca automática enquanto digita
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }
    const my = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchGames(settings, q.trim());
        if (my !== seq.current) return;
        setResults(r);
        setError("");
      } catch (e) {
        if (my !== seq.current) return;
        setError(errorMessage(e));
        setResults([]);
      } finally {
        if (my === seq.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, settings]);

  const add = async (id) => {
    setBusy(id);
    await onAdd(id, status);
    setBusy(null);
  };

  return (
    <Modal onClose={onClose} wide className="add-modal">
      <h2>Adicionar jogo</h2>
      {!manual ? (
        <>
          <div className="add-bar">
            <input
              ref={inputRef}
              className="search big"
              placeholder="Digite o nome do jogo (ex.: Zelda, Mario, God of War...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)} title="Status ao adicionar">
              {STATUSES.map((s) => <option key={s.id} value={s.id}>Adicionar como: {s.label}</option>)}
            </select>
          </div>

          {error && (
            <div className="alert">
              {error}
              {error.includes("Configurações") && (
                <button className="btn small" onClick={goSettings}>Abrir Configurações</button>
              )}
            </div>
          )}

          <div className="results">
            {loading && <div className="center pad"><Spinner /></div>}
            {!loading && q.trim().length >= 2 && !error && results.length === 0 && (
              <p className="muted center pad">Nenhum jogo encontrado. Tente outro nome ou cadastre manualmente.</p>
            )}
            {!loading &&
              results.map((r) => {
                const have = byIgdb.get(r.id);
                const type = r.game_type?.type;
                return (
                  <div key={r.id} className="result" onClick={() => onOpen(r.id)}>
                    <Cover game={{ name: r.name, cover: r.cover?.image_id }} size="cover_small" className="result-cover" />
                    <div className="result-main">
                      <b>{r.name}</b>
                      <span className="muted">
                        {yearOf(r.first_release_date) || "sem data"}
                        {type && type !== "Main Game" && <span className="tag">{traduzTipo(type)}</span>}
                        {r.parent_game && <span> · de {r.parent_game.name}</span>}
                      </span>
                      <div className="chips">
                        {(r.platforms || []).slice(0, 8).map((p) => <PlatformChip key={p.id} p={mapPlatform(p)} small />)}
                        {(r.platforms || []).length > 8 && <span className="chip small">+{r.platforms.length - 8}</span>}
                      </div>
                    </div>
                    {have ? (
                      <span className="have">✓ Na estante</span>
                    ) : (
                      <button
                        className="btn primary"
                        disabled={busy === r.id}
                        onClick={(e) => { e.stopPropagation(); add(r.id); }}
                      >
                        {busy === r.id ? "..." : "+ Adicionar"}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
          <p className="muted small-note">
            Não achou? <a onClick={() => setManual(true)}>Cadastrar manualmente</a>
          </p>
        </>
      ) : (
        <ManualForm
          inputRef={inputRef}
          initialName={q}
          status={status}
          onCancel={() => setManual(false)}
          onSave={(data, st) => { onAddManual(data, st); onClose(); }}
        />
      )}
    </Modal>
  );
}

export function traduzTipo(t) {
  return (
    {
      "Main Game": "Jogo",
      DLC: "DLC",
      "DLC Addon": "DLC",
      Expansion: "Expansão",
      "Standalone Expansion": "Expansão independente",
      Bundle: "Pacote",
      Mod: "Mod",
      Episode: "Episódio",
      Season: "Temporada",
      Remake: "Remake",
      Remaster: "Remaster",
      "Expanded Game": "Versão expandida",
      Port: "Port",
      Fork: "Variante",
      Pack: "Pack",
      Update: "Atualização",
    }[t] || t
  );
}

function ManualForm({ inputRef, initialName, status, onCancel, onSave }) {
  const [f, setF] = useState({ name: initialName, myPlatform: "", year: "", genres: "", customCover: "", status });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    onSave(
      {
        name: f.name.trim(),
        myPlatform: f.myPlatform.trim(),
        releaseDate: f.year ? Date.UTC(Number(f.year), 0, 1) / 1000 : null,
        genres: f.genres.split(",").map((s) => s.trim()).filter(Boolean),
        customCover: f.customCover.trim(),
      },
      f.status
    );
  };
  return (
    <form className="form" onSubmit={submit}>
      <label>Nome<input ref={inputRef} value={f.name} onChange={set("name")} required /></label>
      <div className="form-row">
        <label>Plataforma<input value={f.myPlatform} onChange={set("myPlatform")} placeholder="ex.: PS2" /></label>
        <label>Ano<input type="number" value={f.year} onChange={set("year")} placeholder="ex.: 2004" /></label>
      </div>
      <label>Gêneros (separados por vírgula)<input value={f.genres} onChange={set("genres")} /></label>
      <label>Link da imagem da capa (opcional)<input value={f.customCover} onChange={set("customCover")} placeholder="https://..." /></label>
      <label>
        Status
        <select value={f.status} onChange={set("status")}>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>
      <div className="row gap end">
        <button type="button" className="btn ghost" onClick={onCancel}>Voltar à busca</button>
        <button className="btn primary">Salvar</button>
      </div>
    </form>
  );
}
