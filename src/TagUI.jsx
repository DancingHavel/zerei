import { useEffect, useMemo, useRef, useState } from "react";
import { TAG_GROUPS, tagColor, tagGroup, autoTags, mergeTags } from "./tags.js";

const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function TagChip({ tag, onRemove, onClick, active, count }) {
  return (
    <span
      className={`chip tagchip ${onClick ? "clickable" : ""} ${active ? "active" : ""}`}
      style={{ "--c": tagColor(tag) }}
      onClick={onClick}
    >
      {tag}
      {count != null && <em>{count}</em>}
      {onRemove && (
        <b onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remover">✕</b>
      )}
    </span>
  );
}

function useOutside(ref, onOut) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && onOut();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onOut]);
}

// Lista de tags agrupadas, com busca. Usada no jogo e nos filtros.
function TagList({ selected, onToggle, extraTags = [], counts, query, allowCreate, onCreate }) {
  const groups = useMemo(() => {
    const known = new Set(TAG_GROUPS.flatMap((g) => g.tags.map((t) => t.toLowerCase())));
    const mine = [...new Set(extraTags)].filter((t) => !known.has(t.toLowerCase())).sort();
    const all = [...TAG_GROUPS, ...(mine.length ? [{ name: "Minhas tags", color: "#94a3b8", tags: mine }] : [])];
    const q = norm(query);
    return all
      .map((g) => ({
        ...g,
        tags: g.tags.filter((t) => (!q || norm(t).includes(q)) && (!counts || counts.has(t))),
      }))
      .filter((g) => g.tags.length);
  }, [extraTags, counts, query]);

  const exact = groups.some((g) => g.tags.some((t) => norm(t) === norm(query)));

  return (
    <div className="tag-list">
      {allowCreate && query.trim() && !exact && (
        <button className="tag-create" onClick={() => onCreate(query.trim())}>
          + Criar tag “{query.trim()}”
        </button>
      )}
      {groups.map((g) => (
        <div key={g.name} className="tag-group">
          <div className="tag-group-name" style={{ color: g.color }}>{g.name}</div>
          <div className="chips">
            {g.tags.map((t) => (
              <TagChip
                key={t}
                tag={t}
                active={selected.includes(t)}
                count={counts ? counts.get(t) : undefined}
                onClick={() => onToggle(t)}
              />
            ))}
          </div>
        </div>
      ))}
      {!groups.length && !allowCreate && <p className="muted tiny">Nenhuma tag encontrada.</p>}
    </div>
  );
}

// Seletor de tags dentro da tela do jogo.
export function TagPicker({ game, allTags, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef();
  useOutside(ref, () => setOpen(false));
  const tags = game.tags || [];
  const toggle = (t) => onChange(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]);
  const suggested = autoTags(game).filter((t) => !tags.includes(t));

  return (
    <div className="tag-picker" ref={ref}>
      <div className="chips">
        {tags.map((t) => <TagChip key={t} tag={t} onRemove={() => toggle(t)} />)}
        <button className="chip add-tag" onClick={() => setOpen(!open)}>+ Tags</button>
      </div>
      {suggested.length > 0 && (
        <button className="link-btn" onClick={() => onChange(mergeTags(tags, suggested))}>
          ✨ Adicionar sugeridas: {suggested.slice(0, 4).join(", ")}{suggested.length > 4 ? "..." : ""}
        </button>
      )}
      {open && (
        <div className="tag-pop">
          <input
            autoFocus
            placeholder="Buscar ou criar tag..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) {
                const hit = [...TAG_GROUPS.flatMap((g) => g.tags), ...allTags].find((t) => norm(t) === norm(q));
                const t = hit || q.trim();
                if (!tags.includes(t)) onChange([...tags, t]);
                setQ("");
              }
            }}
          />
          <TagList
            selected={tags}
            onToggle={toggle}
            extraTags={allTags}
            query={q}
            allowCreate
            onCreate={(t) => { onChange([...tags, t]); setQ(""); }}
          />
        </div>
      )}
    </div>
  );
}

// Filtro de tags (estante e estatísticas). Mostra só tags que existem na estante.
export function TagFilter({ games, filter, setFilter }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef();
  useOutside(ref, () => setOpen(false));

  const counts = useMemo(() => {
    const m = new Map();
    for (const g of games) for (const t of g.tags || []) m.set(t, (m.get(t) || 0) + 1);
    return m;
  }, [games]);

  const toggle = (t) =>
    setFilter({ ...filter, tags: filter.tags.includes(t) ? filter.tags.filter((x) => x !== t) : [...filter.tags, t] });

  return (
    <div className="tag-filter" ref={ref}>
      <button className={`btn ${filter.tags.length ? "on-accent" : ""}`} onClick={() => setOpen(!open)}>
        🏷 Tags{filter.tags.length ? ` (${filter.tags.length})` : ""}
      </button>
      {open && (
        <div className="tag-pop right">
          <div className="row gap">
            <input autoFocus placeholder="Buscar tag..." value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="seg" title="Como combinar várias tags">
              <button className={filter.mode === "all" ? "on" : ""} onClick={() => setFilter({ ...filter, mode: "all" })}>Todas</button>
              <button className={filter.mode === "any" ? "on" : ""} onClick={() => setFilter({ ...filter, mode: "any" })}>Qualquer</button>
            </div>
          </div>
          {counts.size === 0 ? (
            <p className="muted tiny">Nenhum jogo tem tags ainda. Abra um jogo e adicione tags.</p>
          ) : (
            <TagList selected={filter.tags} onToggle={toggle} extraTags={[...counts.keys()]} counts={counts} query={q} />
          )}
        </div>
      )}
    </div>
  );
}

// Faixa com as tags ativas no filtro.
export function ActiveTags({ filter, setFilter }) {
  if (!filter.tags.length) return null;
  return (
    <div className="active-tags">
      <span className="muted">
        Filtrando por {filter.mode === "all" ? "todas" : "qualquer uma"} destas:
      </span>
      {filter.tags.map((t) => (
        <TagChip key={t} tag={t} onRemove={() => setFilter({ ...filter, tags: filter.tags.filter((x) => x !== t) })} />
      ))}
      <button className="link-btn" onClick={() => setFilter({ ...filter, tags: [] })}>Limpar</button>
    </div>
  );
}

export function matchTags(game, filter) {
  if (!filter.tags.length) return true;
  const set = new Set(game.tags || []);
  return filter.mode === "all" ? filter.tags.every((t) => set.has(t)) : filter.tags.some((t) => set.has(t));
}

export { tagGroup };
