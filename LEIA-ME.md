# Zerei — sua estante de jogos

## 1. Instalar as ferramentas (uma vez só)

Abra o PowerShell e rode:

```
winget install --id Rustlang.Rustup -e
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Feche e abra o PowerShell de novo depois.

## 2. Rodar o programa

Na pasta `zerei`:

```
npm run app
```

A primeira vez demora alguns minutos (compila o Rust). Depois é rápido.

## 3. Gerar o instalador (.exe)

```
npm run instalador
```

O instalador fica em `C:\zerei-build\release\bundle\nsis\Zerei_1.0.0_x64-setup.exe`.

## 4. Chave da IGDB (para buscar jogos, capas e expansões)

No programa: **Configurações** → siga o passo a passo na tela (é grátis, via conta Twitch).

## Onde ficam meus dados?

Em `%APPDATA%\com.zerei.app\biblioteca.json` (com cópia `.bak` automática).
Use **Configurações → Fazer backup** de vez em quando.

## Publicar uma versão nova (atualização automática)

1. Aumente a versão em `package.json`, `src-tauri/tauri.conf.json` e `src-tauri/Cargo.toml`.
2. Faça commit das mudanças.
3. Rode:

```
powershell -ExecutionPolicy Bypass -File scripts\publicar.ps1 -Notas "O que mudou"
```

Os PCs com o Zerei instalado avisam da versão nova ao abrir.

**Importante:** a chave que assina as atualizações fica em `%USERPROFILE%\.tauri\zerei.key`.
Guarde uma cópia dela em lugar seguro. Sem ela, não dá pra publicar atualizações.
