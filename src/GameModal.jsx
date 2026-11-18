import { useState } from "react";
import { STATUSES } from "./constants.js";
import { fmtDate } from "./constants.js";
import { img, yearOf } from "./igdb.js";
import { Cover, Modal, PlatformChip, Spinner, Stars } from "./ui.jsx";
import { TagPicker, TagChip } from "./TagUI.jsx";
import { autoTags } from "./tags.js";

export default function GameModal({ game, isPreview, onClose, onUpdate, onRemove, onRefresh, onOpenIgdb, onAddIgdb, byIgdb, allTags, onTag }) {
  const [tab, setTab] = useState("about");
  const [shot, setShot] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);

  if (game.loading)
    return (
      <Modal onClose={onClose} wide>
        <div className="center pad"><Spinner /></div>
      </Modal>
    );

  const hero = game.screenshots?.[0];
  const extras = game.extras || [];
  const set = (k) => (e) => onUpdate({ [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  const tabs = [
    ["about", "Sobre"],
    extras.length && ["extras", `Expansões e DLCs (${extras.length})`],
    game.screenshots?.length && ["shots", `Fotos (${game.screenshots.length})`],
    game.similar?.length && ["similar", "Parecidos"],
  ].filter(Boolean);


  return (
    <Modal onClose={onClose} wide className="game-modal">
      <div className="hero" style={hero ? { backgroundImage: `url(${img(hero, "screenshot_big")})` } : undefined}>
        <div className="hero-shade" />
        <div className="hero-content">
          <Cover game={game} className="hero-cover" />
          <div className="hero-info">
            {game.parentName && <div className="muted">Conteúdo de {game.parentName}</div>}
            <h1>{game.name}</h1>
            <div className="hero-meta">
              {yearOf(game.releaseDate) && <span>{fmtDate(game.releaseDate)}</span>}
              {game.developers?.length > 0 && <span>{game.developers.join(", ")}</span>}
              {game.igdbRating && <span className="score" title="Nota média da crítica e usuários (IGDB)">{game.igdbRating}</span>}
            </div>
            <div className="chips">
              {(game.platforms || []).map((p) => <PlatformChip key={p.id} p={p} />)}
            </div>
            <div className="chips">
              {(isPreview ? autoTags(game) : game.tags || []).map((t) => (
                <TagChip key={t} tag={t} onClick={onTag ? () => onTag(t) : undefined} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="gm-body">
        <div className="gm-left">
          <div className="tabs small">
            {tabs.map(([id, label]) => (
              <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          {tab === "about" && (
            <div className="about">
              {game.summary ? <p className="summary">{game.summary}</p> : <p className="muted">Sem descrição.</p>}
              {game.storyline && (
                <details>
                  <summary>História</summary>
                  <p>{game.storyline}</p>
                </details>
              )}
              <dl className="facts">
                {game.publishers?.length > 0 && (<><dt>Publicadora</dt><dd>{game.publishers.join(", ")}</dd></>)}
                {game.franchise && (<><dt>Franquia</dt><dd>{game.franchise}</dd></>)}
                {game.modes?.length > 0 && (<><dt>Modos</dt><dd>{game.modes.join(", ")}</dd></>)}
                {game.themes?.length > 0 && (<><dt>Temas</dt><dd>{game.themes.join(", ")}</dd></>)}
              </dl>
            </div>
          )}

          {tab === "extras" && (
            <div className="extras">
              {!isPreview && <p className="muted">Marque as que você já jogou.</p>}
              {extras.map((x) => (
                <div key={x.igdbId} className={`extra ${x.played ? "done" : ""}`}>
                  {!isPreview && (
                    <input
                      type="checkbox"
                      checked={x.played}
                      onChange={() =>
                        onUpdate({ extras: extras.map((e) => (e.igdbId === x.igdbId ? { ...e, played: !e.played } : e)) })
                      }
                    />
                  )}
                  <Cover game={{ name: x.name, cover: x.cover }} size="cover_small" className="extra-cover" />
                  <div className="extra-main">
                    <b>{x.name}</b>
                    <span className="muted">{x.kind} · {x.releaseDate ? fmtDate(x.releaseDate) : "sem data"}</span>
                  </div>
                  <button className="btn small ghost" onClick={() => onOpenIgdb(x.igdbId)}>Ver</button>
                </div>
              ))}
            </div>
          )}

          {tab === "shots" && (
            <div className="shots">
              {game.screenshots.map((s) => (
                <img key={s} src={img(s, "screenshot_med")} alt="" loading="lazy" onClick={() => setShot(s)} />
              ))}
            </div>
          )}

          {tab === "similar" && (
            <div className="similar">
              {game.similar.map((s) => (
                <div key={s.igdbId} className="sim" onClick={() => onOpenIgdb(s.igdbId)}>
                  <Cover game={{ name: s.name, cover: s.cover }} />
                  <span>{s.name}</span>
                  {byIgdb?.get(s.igdbId) && <em className="have-dot">✓</em>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="gm-right">
          {isPreview ? (
            <div className="panel">
              <h3>Adicionar à estante</h3>
              <div className="status-pick">
                {STATUSES.map((s) => (
                  <button key={s.id} style={{ "--c": s.color }} onClick={() => onAddIgdb(game.igdbId, s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="panel">
              <div className="panel-head">
                <h3>Meu progresso</h3>
                <button
                  className={`fav-big ${game.favorite ? "on" : ""}`}
                  onClick={() => onUpdate({ favorite: !game.favorite })}
                  title="Favorito"
                >
                  ♥
                </button>
              </div>
              <div className="status-pick">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    style={{ "--c": s.color }}
                    className={game.status === s.id ? "on" : ""}
                    onClick={() => {
                      const p = { status: s.id };
                      const today = new Date().toISOString().slice(0, 10);
                      if ((s.id === "finished" || s.id === "completed") && !game.finishedAt) p.finishedAt = today;
                      if (s.id === "playing" && !game.startedAt) p.startedAt = today;
                      onUpdate(p);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <label className="lbl">Minha nota</label>
              <Stars value={game.rating} onChange={(v) => onUpdate({ rating: v })} />

              <label className="lbl">Joguei em</label>
              <input
                list={`plats-${game.id}`}
                value={game.myPlatform}
                onChange={set("myPlatform")}
                placeholder="Escolha ou digite a plataforma"
              />
              <datalist id={`plats-${game.id}`}>
                {(game.platforms || []).map((p) => <option key={p.id} value={p.abbr} >{p.name}</option>)}
              </datalist>

              <div className="form-row">
                <div>
                  <label className="lbl">Comecei</label>
                  <input type="date" value={game.startedAt} onChange={set("startedAt")} />
                </div>
                <div>
                  <label className="lbl">Terminei</label>
                  <input type="date" value={game.finishedAt} onChange={set("finishedAt")} />
                </div>
              </div>

              <label className="lbl">Horas jogadas</label>
              <input type="number" min="0" step="0.5" value={game.hours || ""} onChange={set("hours")} placeholder="0" />

              <label className="lbl">Tags</label>
              <TagPicker game={game} allTags={allTags || []} onChange={(tags) => onUpdate({ tags })} />

              <label className="lbl">Anotações</label>
              <textarea rows={4} value={game.notes} onChange={set("notes")} placeholder="O que achou, onde parou, dicas..." />

              <div className="panel-foot">
                {game.igdbId && <button className="btn small ghost" onClick={onRefresh}>↻ Atualizar dados</button>}
                {!confirmDel ? (
                  <button className="btn small danger-ghost" onClick={() => setConfirmDel(true)}>Remover</button>
                ) : (
                  <span className="confirm">
                    Remover mesmo?
                    <button className="btn small danger" onClick={onRemove}>Sim</button>
                    <button className="btn small ghost" onClick={() => setConfirmDel(false)}>Não</button>
                  </span>
                )}
              </div>
              <p className="muted tiny">Adicionado em {new Date(game.addedAt).toLocaleDateString("pt-BR")}</p>
            </div>
          )}
        </div>
      </div>

      {shot && (
        <div className="lightbox" onClick={() => setShot(null)}>
          <img src={img(shot, "1080p")} alt="" />
        </div>
      )}
    </Modal>
  );
}
