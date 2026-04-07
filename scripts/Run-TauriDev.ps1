$ErrorActionPreference = "Stop"

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    throw "cargo wurde nicht gefunden. Bitte zuerst Rust installieren."
}

try {
    cargo tauri --version | Out-Null
} catch {
    throw "Die Tauri CLI fehlt. Bitte ausfuehren: cargo install tauri-cli --version `"^2.0.0`" --locked"
}

powershell -ExecutionPolicy Bypass -NoLogo -NoProfile -File "$PSScriptRoot\prepare-dist.ps1"
Push-Location (Join-Path $PSScriptRoot "..\src-tauri")
try {
    cargo tauri dev
} finally {
    Pop-Location
}
