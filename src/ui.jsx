import { useEffect } from "react";
import { img } from "./igdb.js";
import { STATUS } from "./constants.js";

// Capa do jogo. Sem imagem, mostra um degradê com as iniciais.
export function Cover({ game, size = "cover_big", className = "" }) {
  const src = game.customCover || img(game.cover, size);
  if (src) return <img className={`cover ${className}`} src={src} alt={game.name} loading="lazy" />;
  let h = 0;
  for (const c of game.name || "?") h = (h * 31 + c.charCodeAt(0)) % 360;
  const initials = (game.name || "?")
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9À-ÿ]/.test(w[0]))
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`cover cover-fallback ${className}`}
      style={{ background: `linear-gradient(145deg, hsl(${h} 55% 32%), hsl(${(h + 60) % 360} 60% 18%))` }}
    >
      <span>{initials}</span>
    </div>
  );
}

export function PlatformChip({ p, small }) {
  return (
    <span className={`chip platform ${small ? "small" : ""}`} title={p.name}>
      {p.logo && <img src={img(p.logo, "logo_med", "png")} alt="" />}
      {p.abbr || p.name}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span className="status-badge" style={{ "--c": s.color }}>
      <i />
      {s.label}
    </span>
  );
}

// Nota de 0 a 10 mostrada como 5 estrelas (meia estrela = 1 ponto).
export function Stars({ value = 0, onChange, size = 22 }) {
  const stars = [1, 2, 3, 4, 5];
  const handle = (e, n) => {
    if (!onChange) return;
    const r = e.currentTarget.getBoundingClientRect();
    const half = e.clientX - r.left < r.width / 2;
    const v = n * 2 - (half ? 1 : 0);
    onChange(v === value ? 0 : v);
  };
  return (
    <div className={`stars ${onChange ? "editable" : ""}`} style={{ "--s": `${size}px` }}>
      {stars.map((n) => {
        const fill = Math.max(0, Math.min(1, (value - (n - 1) * 2) / 2));
        return (
          <span key={n} className="star" onClick={(e) => handle(e, n)}>
            <span className="star-bg">★</span>
            <span className="star-fg" style={{ width: `${fill * 100}%` }}>★</span>
          </span>
        );
      })}
      {onChange && <em className="stars-num">{value ? (value / 2).toFixed(1).replace(".0", "") : "—"}</em>}
    </div>
  );
}

export function Modal({ onClose, children, wide, className = "" }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""} ${className}`}>
        <button className="modal-x" onClick={onClose} aria-label="Fechar">✕</button>
        {children}
      </div>
    </div>
  );
}

export function Spinner() {
  return <div className="spinner" />;
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">🎮</div>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
