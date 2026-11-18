import { useEffect, useRef, useState } from "react";
import { dataFolder, isTauri } from "./backend.js";
import { searchGames } from "./igdb.js";
import { STATUS, errorMessage } from "./constants.js";
import { checkUpdate } from "./updater.js";

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function UpdateSection({ notify, onFoundUpdate }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const u = await checkUpdate();
      if (u) {
        onFoundUpdate(u);
        notify(`Versão ${u.version} encontrada! Clique em "Atualizar agora" no topo.`);
      } else notify(isTauri ? "Você já está na versão mais nova." : "Só funciona no programa instalado.");
    } catch (e) {
      notify("Não consegui verificar: " + e, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="stat-card">
      <h3>Atualizações</h3>
      <p className="muted">
        Versão instalada: <b>{__APP_VERSION__}</b>. O Zerei procura versões novas sozinho toda vez que abre.
      </p>
      <button className="btn" onClick={run} disabled={busy}>{busy ? "Procurando..." : "↻ Procurar atualização agora"}</button>
    </section>
  );
}

export default function Settings({ settings, onChange, games, onImport, notify, onFoundUpdate }) {
  const [id, setId] = useState(settings.igdbClientId || "");
  const [secret, setSecret] = useState(settings.igdbClientSecret || "");
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [folder, setFolder] = useState("");
  const fileRef = useRef();
  const [importMode, setImportMode] = useState("merge");

  useEffect(() => { dataFolder().then(setFolder).catch(() => {}); }, []);

  const save = async () => {
    const s = { ...settings, igdbClientId: id.trim(), igdbClientSecret: secret.trim() };
    onChange(s);
    setTesting(true);
    try {
      await searchGames(s, "mario");
      notify("Conectado à IGDB! Já pode buscar jogos.");
    } catch (e) {
      notify(errorMessage(e), "error");
    } finally {
      setTesting(false);
    }
  };

  const stamp = new Date().toISOString().slice(0, 10);

  const exportJson = () => {
    download(`zerei-backup-${stamp}.json`, JSON.stringify({ version: 1, games }, null, 2), "application/json");
    notify("Backup salvo na pasta Downloads.");
  };

  const exportCsv = () => {
    const head = ["Nome", "Status", "Plataforma", "Nota (0-5)", "Horas", "Comecei", "Terminei", "Ano", "Gêneros", "Favorito", "Tags", "Anotações"];
    const rows = games.map((g) => [
      g.name,
      STATUS[g.status]?.label,
      g.myPlatform,
      g.rating ? g.rating / 2 : "",
      g.hours || "",
      g.startedAt,
      g.finishedAt,
      g.releaseDate ? new Date(g.releaseDate * 1000).getUTCFullYear() : "",
      (g.genres || []).join(", "),
      g.favorite ? "Sim" : "",
      (g.tags || []).join(", "),
      g.notes,
    ]);
    const csv = "﻿" + [head, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
    download(`zerei-lista-${stamp}.csv`, csv, "text/csv");
    notify("Planilha salva na pasta Downloads.");
  };

  const importFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const list = Array.isArray(data) ? data : data.games;
      if (!Array.isArray(list)) throw new Error("Arquivo não é um backup do Zerei.");
      onImport(list.filter((g) => g && g.name && g.id), importMode);
      notify(`${list.length} jogos importados.`);
    } catch (err) {
      notify("Erro ao importar: " + err.message, "error");
    }
  };

  return (
    <div className="page settings">
      <header className="page-head"><h1>Configurações</h1></header>

      <UpdateSection notify={notify} onFoundUpdate={onFoundUpdate} />

      <section className="stat-card">
        <h3>Banco de jogos (IGDB)</h3>
        <p className="muted">
          O Zerei busca nomes, capas, fotos, plataformas, expansões e DLCs na <b>IGDB</b>, o maior banco de jogos
          gratuito (mantido pela Twitch). Você precisa de uma chave grátis, feita uma única vez:
        </p>
        <ol className="steps">
          <li>Entre em <code>dev.twitch.tv/console</code> com sua conta da Twitch (ative a verificação em duas etapas, é exigido).</li>
          <li>Clique em <b>Register Your Application</b>.</li>
          <li>Nome: qualquer um (ex.: <i>Zerei do Gui</i>). OAuth Redirect URL: <code>http://localhost</code>. Categoria: <i>Application Integration</i>. Tipo: <i>Confidential</i>.</li>
          <li>Abra o app criado, copie o <b>Client ID</b> e clique em <b>New Secret</b> para gerar o <b>Client Secret</b>.</li>
          <li>Cole os dois aqui embaixo e clique em Salvar.</li>
        </ol>
        {!isTauri && <div className="alert">No modo navegador a busca usa dados de demonstração. As chaves só funcionam no programa instalado.</div>}
        <div className="form">
          <label>Client ID<input value={id} onChange={(e) => setId(e.target.value)} spellCheck={false} /></label>
          <label>
            Client Secret
            <div className="row gap">
              <input type={show ? "text" : "password"} value={secret} onChange={(e) => setSecret(e.target.value)} spellCheck={false} style={{ flex: 1 }} />
              <button className="btn ghost" type="button" onClick={() => setShow(!show)}>{show ? "Ocultar" : "Mostrar"}</button>
            </div>
          </label>
          <div className="row end">
            <button className="btn primary" onClick={save} disabled={testing}>{testing ? "Testando..." : "Salvar e testar"}</button>
          </div>
        </div>
        <p className="muted tiny">As chaves ficam salvas só no seu computador.</p>
      </section>

      <section className="stat-card">
        <h3>Backup e exportação</h3>
        <p className="muted">Tudo é salvo automaticamente no seu PC. Faça backups de vez em quando por segurança.</p>
        <div className="row gap wrap">
          <button className="btn" onClick={exportJson}>⬇ Fazer backup (.json)</button>
          <button className="btn" onClick={exportCsv}>⬇ Exportar planilha (.csv / Excel)</button>
        </div>
        <div className="row gap wrap" style={{ marginTop: 14 }}>
          <select value={importMode} onChange={(e) => setImportMode(e.target.value)}>
            <option value="merge">Importar juntando com a estante atual</option>
            <option value="replace">Importar substituindo tudo</option>
          </select>
          <button className="btn" onClick={() => fileRef.current.click()}>⬆ Restaurar backup</button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importFile} />
        </div>
        <p className="muted tiny">Pasta dos dados: <code>{folder}</code></p>
      </section>
    </div>
  );
}
