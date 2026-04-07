$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $scriptDir ".."))
$distRoot = Join-Path $projectRoot "dist"

if (Test-Path $distRoot) {
    Remove-Item -LiteralPath $distRoot -Recurse -Force
}

[System.IO.Directory]::CreateDirectory($distRoot) | Out-Null

$items = @(
    "index.html",
    "styles.css",
    "app.js",
    "src"
)

foreach ($item in $items) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $item) -Destination $distRoot -Recurse -Force
}

Write-Host "Dist vorbereitet: $distRoot"
