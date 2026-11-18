// Ponte entre a interface e o "motor" em Rust.
// Quando roda fora do Tauri (no navegador, só pra testar a tela),
// usa o localStorage e dados de demonstração.
import { DEMO_RESULTS } from "./demo.js";

export const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;

async function invoke(cmd, args) {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(cmd, args);
}

function lsGet(key) {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

export async function loadLibrary() {
  const raw = isTauri ? await invoke("load_library") : lsGet("zerei.biblioteca");
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : data.games || [];
  } catch {
    return [];
  }
}

export async function saveLibrary(games) {
  const data = JSON.stringify({ version: 1, savedAt: Date.now(), games });
  if (isTauri) return invoke("save_library", { data });
  lsSet("zerei.biblioteca", data);
}

export async function loadSettings() {
  const raw = isTauri ? await invoke("load_settings") : lsGet("zerei.config");
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export async function saveSettings(settings) {
  const data = JSON.stringify(settings);
  if (isTauri) return invoke("save_settings", { data });
  lsSet("zerei.config", data);
}

export async function dataFolder() {
  return isTauri ? invoke("data_folder") : "(modo navegador: localStorage)";
}

export async function igdbRaw(settings, endpoint, body) {
  if (!isTauri) {
    // modo demonstração no navegador
    await new Promise((r) => setTimeout(r, 300));
    return demoQuery(endpoint, body);
  }
  if (!settings.igdbClientId || !settings.igdbClientSecret) {
    throw new Error("NO_KEYS");
  }
  return invoke("igdb_query", {
    clientId: settings.igdbClientId,
    clientSecret: settings.igdbClientSecret,
    endpoint,
    body,
  });
}

function demoQuery(endpoint, body) {
  if (endpoint === "platforms") return DEMO_RESULTS.platforms;
  const idMatch = body.match(/where id = (\d+)/);
  if (idMatch) return DEMO_RESULTS.games.filter((g) => g.id === Number(idMatch[1]));
  const s = body.match(/search "([^"]*)"/);
  if (s) {
    const q = s[1].toLowerCase();
    return DEMO_RESULTS.games.filter((g) => g.name.toLowerCase().includes(q));
  }
  return DEMO_RESULTS.games;
}
