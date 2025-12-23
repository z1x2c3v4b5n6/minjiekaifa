$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot/.."
Push-Location $root

Write-Host "Building frontend..."
Push-Location "$root/frontend"
npm ci
npm run build
Pop-Location

Write-Host "Building backend executable..."
Push-Location "$root/backend"
pyinstaller --noconfirm --clean --onefile launcher.py --name TimeGarden --add-data "static;static"
Pop-Location

$releaseDir = Join-Path $root "release/TimeGarden"
if (Test-Path $releaseDir) {
  Remove-Item -Recurse -Force $releaseDir
}
New-Item -ItemType Directory -Path $releaseDir | Out-Null

Copy-Item "$root/backend/dist/TimeGarden.exe" -Destination $releaseDir
Copy-Item "$root/backend/static" -Destination (Join-Path $releaseDir "static") -Recurse

if (Test-Path "$root/backend/media") {
  Copy-Item "$root/backend/media" -Destination (Join-Path $releaseDir "media") -Recurse
}

Write-Host "Release ready at $releaseDir"
