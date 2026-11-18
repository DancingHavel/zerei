// Atualizador automático: procura versões novas nos Releases do GitHub.
import { isTauri } from "./backend.js";

export async function checkUpdate() {
  if (!isTauri) return null;
  const { check } = await import("@tauri-apps/plugin-updater");
  return check(); // null se já está na última versão
}

// Baixa, instala e reinicia o programa. onProgress recebe 0..100.
export async function installUpdate(update, onProgress) {
  let total = 0;
  let done = 0;
  await update.downloadAndInstall((ev) => {
    if (ev.event === "Started") total = ev.data.contentLength || 0;
    if (ev.event === "Progress") {
      done += ev.data.chunkLength;
      if (total) onProgress?.(Math.round((done / total) * 100));
    }
    if (ev.event === "Finished") onProgress?.(100);
  });
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}
