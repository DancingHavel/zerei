# Publica uma versão nova do Zerei nos Releases do GitHub.
# Antes: aumente a versão em package.json, src-tauri/tauri.conf.json e src-tauri/Cargo.toml.
# Uso:  powershell -ExecutionPolicy Bypass -File scripts\publicar.ps1 -Notas "O que mudou"
param(
  [Parameter(Mandatory = $true)][string]$Notas,
  [string]$Repo = "DancingHavel/zerei",
  [string]$Conta = "DancingHavel"
)
$ErrorActionPreference = "Stop"
$raiz = Split-Path $PSScriptRoot -Parent
Set-Location $raiz

$versao = (Get-Content "src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json).version
$tag = "v$versao"
Write-Host "Publicando Zerei $versao..." -ForegroundColor Cyan

# chave que assina as atualizações (fica fora do projeto, NUNCA vai pro GitHub)
$chave = Join-Path $env:USERPROFILE ".tauri\zerei.key"
if (-not (Test-Path $chave)) { throw "Chave não encontrada em $chave" }
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $chave -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
$env:Path += ";$env:USERPROFILE\.cargo\bin"

npx tauri build
if ($LASTEXITCODE -ne 0) { throw "Falha ao compilar" }

$pasta = "C:\zerei-build\release\bundle\nsis"
$exe = Join-Path $pasta "Zerei_${versao}_x64-setup.exe"
$sig = Get-Content "$exe.sig" -Raw
$nomeExe = Split-Path $exe -Leaf

$latest = [ordered]@{
  version   = $versao
  notes     = $Notas
  pub_date  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  platforms = @{
    "windows-x86_64" = @{
      signature = $sig.Trim()
      url       = "https://github.com/$Repo/releases/download/$tag/$nomeExe"
    }
  }
}
$json = Join-Path $pasta "latest.json"
[IO.File]::WriteAllText($json, ($latest | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding $false))

$env:GH_TOKEN = gh auth token -u $Conta
git push origin HEAD
gh release create $tag $exe "$exe.sig" $json --repo $Repo --title "Zerei $versao" --notes $Notas
if ($LASTEXITCODE -ne 0) { throw "Falha ao criar o release" }
Write-Host "Pronto! Os PCs com o Zerei vão receber a versão $versao ao abrir." -ForegroundColor Green
