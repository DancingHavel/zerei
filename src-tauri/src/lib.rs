use std::fs;
use std::path::PathBuf;
use std::time::{Duration, Instant};

use serde::Deserialize;
use serde_json::Value;
use tauri::{AppHandle, Manager, State};
use tokio::sync::Mutex;

/// Token de acesso da IGDB guardado em memória enquanto o programa está aberto.
#[derive(Default)]
struct IgdbToken {
    client_id: String,
    token: String,
    expires: Option<Instant>,
}

struct AppState {
    token: Mutex<IgdbToken>,
    http: reqwest::Client,
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn read_file(app: &AppHandle, name: &str) -> Result<String, String> {
    let path = data_dir(app)?.join(name);
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

/// Grava de forma segura: escreve num arquivo temporário, guarda o anterior
/// como .bak e só então troca. Assim um travamento nunca corrompe a lista.
fn write_file(app: &AppHandle, name: &str, data: &str) -> Result<(), String> {
    serde_json::from_str::<Value>(data).map_err(|e| format!("JSON inválido: {e}"))?;
    let dir = data_dir(app)?;
    let path = dir.join(name);
    let tmp = dir.join(format!("{name}.tmp"));
    fs::write(&tmp, data).map_err(|e| e.to_string())?;
    if path.exists() {
        let _ = fs::copy(&path, dir.join(format!("{name}.bak")));
    }
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_library(app: AppHandle) -> Result<String, String> {
    read_file(&app, "biblioteca.json")
}

#[tauri::command]
fn save_library(app: AppHandle, data: String) -> Result<(), String> {
    write_file(&app, "biblioteca.json", &data)
}

#[tauri::command]
fn load_settings(app: AppHandle) -> Result<String, String> {
    read_file(&app, "config.json")
}

#[tauri::command]
fn save_settings(app: AppHandle, data: String) -> Result<(), String> {
    write_file(&app, "config.json", &data)
}

#[tauri::command]
fn data_folder(app: AppHandle) -> Result<String, String> {
    Ok(data_dir(&app)?.to_string_lossy().to_string())
}

#[derive(Deserialize)]
struct TwitchToken {
    access_token: String,
    expires_in: u64,
}

async fn get_token(state: &AppState, client_id: &str, secret: &str) -> Result<String, String> {
    let mut t = state.token.lock().await;
    let valid = t.client_id == client_id
        && !t.token.is_empty()
        && t.expires.map(|e| e > Instant::now()).unwrap_or(false);
    if valid {
        return Ok(t.token.clone());
    }
    let resp = state
        .http
        .post("https://id.twitch.tv/oauth2/token")
        .form(&[
            ("client_id", client_id),
            ("client_secret", secret),
            ("grant_type", "client_credentials"),
        ])
        .send()
        .await
        .map_err(|e| format!("Sem conexão com a Twitch: {e}"))?;
    if !resp.status().is_success() {
        return Err("Client ID ou Client Secret inválidos. Confira em Configurações.".into());
    }
    let tok: TwitchToken = resp.json().await.map_err(|e| e.to_string())?;
    t.client_id = client_id.to_string();
    t.token = tok.access_token.clone();
    // renova um pouco antes de expirar
    t.expires = Some(Instant::now() + Duration::from_secs(tok.expires_in.saturating_sub(300)));
    Ok(tok.access_token)
}

/// Faz uma consulta na API da IGDB (banco de dados de jogos da Twitch).
/// `endpoint` ex.: "games", `body` é uma consulta no formato Apicalypse.
#[tauri::command]
async fn igdb_query(
    state: State<'_, AppState>,
    client_id: String,
    client_secret: String,
    endpoint: String,
    body: String,
) -> Result<Value, String> {
    if !endpoint.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return Err("Endpoint inválido".into());
    }
    let client_id = client_id.trim().to_string();
    let client_secret = client_secret.trim().to_string();
    for attempt in 0..2 {
        let token = get_token(&state, &client_id, &client_secret).await?;
        let resp = state
            .http
            .post(format!("https://api.igdb.com/v4/{endpoint}"))
            .header("Client-ID", &client_id)
            .header("Authorization", format!("Bearer {token}"))
            .header("Accept", "application/json")
            .body(body.clone())
            .send()
            .await
            .map_err(|e| format!("Sem conexão com a IGDB: {e}"))?;
        let status = resp.status();
        if status.as_u16() == 401 && attempt == 0 {
            // token expirou: limpa e tenta de novo
            state.token.lock().await.token.clear();
            continue;
        }
        if status.as_u16() == 429 {
            return Err("Muitas buscas seguidas. Espere um segundo e tente de novo.".into());
        }
        if !status.is_success() {
            let txt = resp.text().await.unwrap_or_default();
            return Err(format!("IGDB respondeu {status}: {txt}"));
        }
        return resp.json::<Value>().await.map_err(|e| e.to_string());
    }
    Err("Não foi possível autenticar na IGDB.".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let http = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .build()
        .expect("http client");
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(AppState {
            token: Mutex::new(IgdbToken::default()),
            http,
        })
        .invoke_handler(tauri::generate_handler![
            load_library,
            save_library,
            load_settings,
            save_settings,
            data_folder,
            igdb_query
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Zerei");
}
