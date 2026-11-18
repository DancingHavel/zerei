import { useMemo } from "react";
import { STATUSES } from "./constants.js";
import { Cover, Empty, Stars } from "./ui.jsx";
import { TagFilter, ActiveTags, matchTags } from "./TagUI.jsx";
import { tagColor, tagGroup } from "./tags.js";

function Bars({ data, color, onClick }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars">
      {data.map((d) => (
        <div
          key={d.label}
          className={`bar-row ${onClick ? "clickable" : ""}`}
          onClick={onClick ? () => onClick(d.label) : undefined}
          title={onClick ? "Ver esses jogos na estante" : undefined}
        >
          <span className="bar-label" title={d.label}>{d.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: d.color || color }} />
          </div>
          <span className="bar-val">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

const count = (arr) => {
  const m = new Map();
  for (const k of arr) if (k) m.set(k, (m.get(k) || 0) + 1);
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
};

export default function Stats({ games: allGames, onOpen, tagFilter, setTagFilter, onTag }) {
  const games = useMemo(() => allGames.filter((g) => matchTags(g, tagFilter)), [allGames, tagFilter]);
  const s = useMemo(() => {
    const allTags = count(games.flatMap((g) => g.tags || []));
    const byGroup = (name) =>
      allTags.filter((t) => tagGroup(t.label) === name).slice(0, 10).map((t) => ({ ...t, color: tagColor(t.label) }));
    const done = games.filter((g) => g.status === "finished" || g.status === "completed");
    const rated = games.filter((g) => g.rating);
    const hours = games.reduce((a, g) => a + (Number(g.hours) || 0), 0);
    const extras = games.flatMap((g) => g.extras || []);
    const years = count(done.map((g) => g.finishedAt?.slice(0, 4))).sort((a, b) => a.label.localeCompare(b.label));
    return {
      total: games.length,
      done: done.length,
      playing: games.filter((g) => g.status === "playing").length,
      backlog: games.filter((g) => g.status === "backlog").length,
      hours,
      avg: rated.length ? rated.reduce((a, g) => a + g.rating, 0) / rated.length / 2 : 0,
      extrasDone: extras.filter((x) => x.played).length,
      extrasTotal: extras.length,
      byStatus: STATUSES.map((st) => ({ label: st.label, value: games.filter((g) => g.status === st.id).length, color: st.color })),
      byPlatform: count(games.map((g) => g.myPlatform)).slice(0, 12),
      byGenre: byGroup("Gênero"),
      bySetting: byGroup("Ambientação"),
      byStyle: [...byGroup("Estilo"), ...byGroup("Modo de jogo")].sort((a, b) => b.value - a.value).slice(0, 10),
      byMine: [...byGroup("Pessoal"), ...byGroup("Minhas tags")].sort((a, b) => b.value - a.value).slice(0, 10),
      tagDone: allTags
        .filter((t) => t.value >= 2)
        .map((t) => {
          const inTag = games.filter((g) => (g.tags || []).includes(t.label));
          const d = inTag.filter((g) => g.status === "finished" || g.status === "completed").length;
          return { label: t.label, value: Math.round((d / inTag.length) * 100), color: tagColor(t.label) };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      byYear: years,
      byDecade: count(games.map((g) => (g.releaseDate ? `Anos ${String(Math.floor(new Date(g.releaseDate * 1000).getUTCFullYear() / 10) * 10).slice(2)}` : null))).sort((a, b) => a.label.localeCompare(b.label)),
      top: [...rated].sort((a, b) => b.rating - a.rating).slice(0, 6),
      mostPlayed: [...games].filter((g) => g.hours).sort((a, b) => b.hours - a.hours).slice(0, 6),
    };
  }, [games]);

  const head = (
    <>
      <header className="page-head">
        <div>
          <h1>Estatísticas</h1>
          {tagFilter.tags.length > 0 && <p className="muted">{games.length} de {allGames.length} jogos</p>}
        </div>
        <TagFilter games={allGames} filter={tagFilter} setFilter={setTagFilter} />
      </header>
      <ActiveTags filter={tagFilter} setFilter={setTagFilter} />
    </>
  );

  if (!games.length)
    return (
      <div className="page">
        {head}
        <Empty title="Sem dados ainda"><p>Nenhum jogo para mostrar aqui.</p></Empty>
      </div>
    );

  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
  const tagBars = (title, data, hint) => (
    <section className="stat-card">
      <h3>{title}</h3>
      {data.length ? <Bars data={data} onClick={onTag} /> : <p className="muted">{hint}</p>}
    </section>
  );

  return (
    <div className="page">
      {head}
      <div className="tiles">
        <div className="tile"><b>{s.total}</b><span>jogos na estante</span></div>
        <div className="tile green"><b>{s.done}</b><span>zerados ({pct}%)</span></div>
        <div className="tile blue"><b>{s.playing}</b><span>jogando agora</span></div>
        <div className="tile purple"><b>{s.backlog}</b><span>na fila pra jogar</span></div>
        <div className="tile"><b>{Math.round(s.hours).toLocaleString("pt-BR")}</b><span>horas jogadas</span></div>
        <div className="tile"><b>{s.avg ? s.avg.toFixed(1) : "—"}</b><span>nota média (★)</span></div>
        {s.extrasTotal > 0 && <div className="tile"><b>{s.extrasDone}/{s.extrasTotal}</b><span>expansões e DLCs</span></div>}
      </div>

      <div className="progress-big" title="Zerados em relação ao total">
        <div style={{ width: `${pct}%` }} />
      </div>

      <div className="stat-grid">
        <section className="stat-card"><h3>Por status</h3><Bars data={s.byStatus} /></section>
        <section className="stat-card"><h3>Por plataforma</h3>{s.byPlatform.length ? <Bars data={s.byPlatform} color="#38bdf8" /> : <p className="muted">Preencha "Joguei em" nos jogos.</p>}</section>
        {tagBars("Gêneros (tags)", s.byGenre, "Adicione tags de gênero aos jogos.")}
        {tagBars("Ambientação (tags)", s.bySetting, "Adicione tags como Medieval, Cyberpunk...")}
        {tagBars("Estilo e modo (tags)", s.byStyle, "Adicione tags como Co-op, Pixel art...")}
        {s.byMine.length > 0 && tagBars("Tags pessoais", s.byMine, "")}
        {s.tagDone.length > 0 && (
          <section className="stat-card">
            <h3>% zerado por tag</h3>
            <Bars data={s.tagDone.map((t) => ({ ...t, label: t.label }))} onClick={onTag} />
          </section>
        )}
        <section className="stat-card"><h3>Zerados por ano</h3>{s.byYear.length ? <Bars data={s.byYear} color="#34d399" /> : <p className="muted">Preencha a data em que terminou.</p>}</section>
        <section className="stat-card"><h3>Época dos jogos</h3><Bars data={s.byDecade} color="#fbbf24" /></section>
        <section className="stat-card">
          <h3>Minhas maiores notas</h3>
          {s.top.length ? s.top.map((g) => (
            <div key={g.id} className="mini-row" onClick={() => onOpen(g.id)}>
              <Cover game={g} size="cover_small" className="mini-cover" />
              <span>{g.name}</span>
              <Stars value={g.rating} size={12} />
            </div>
          )) : <p className="muted">Dê notas aos jogos.</p>}
        </section>
        {s.mostPlayed.length > 0 && (
          <section className="stat-card">
            <h3>Mais horas</h3>
            {s.mostPlayed.map((g) => (
              <div key={g.id} className="mini-row" onClick={() => onOpen(g.id)}>
                <Cover game={g} size="cover_small" className="mini-cover" />
                <span>{g.name}</span>
                <b>{g.hours} h</b>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
