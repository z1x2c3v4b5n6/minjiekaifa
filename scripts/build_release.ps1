$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path "$PSScriptRoot/.."
$FrontendDir = Join-Path $RepoRoot "frontend"
$BackendDir = Join-Path $RepoRoot "backend"
$ReleaseDir = Join-Path $RepoRoot "release/TimeGarden"
$BootstrapDir = Join-Path $ReleaseDir "bootstrap"
$BootstrapSounds = Join-Path $BootstrapDir "sounds"
$ManifestPath = Join-Path $RepoRoot "scripts/sound_sources.json"

Write-Host "[1/4] Build frontend"
Push-Location $FrontendDir
npm ci
npm run build
Pop-Location

Write-Host "[2/4] Install backend deps"
Push-Location $BackendDir
pip install -r requirements.txt
Pop-Location

Write-Host "[3/4] Build launcher exe"
Push-Location $BackendDir
pyinstaller --clean --onefile --name TimeGarden --distpath dist --workpath build launcher.py
Pop-Location

Write-Host "[4/4] Assemble release"
if (Test-Path $ReleaseDir) {
  Remove-Item $ReleaseDir -Recurse -Force
}
New-Item -ItemType Directory -Path $BootstrapSounds | Out-Null

Copy-Item (Join-Path $BackendDir "dist/TimeGarden.exe") -Destination $ReleaseDir
Copy-Item (Join-Path $BackendDir "static/app") -Destination (Join-Path $ReleaseDir "static") -Recurse
Copy-Item $ManifestPath -Destination (Join-Path $BootstrapDir "sound_sources.json")

$manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
foreach ($entry in $manifest) {
  if (-not $entry.filename -or -not $entry.url) { continue }
  $target = Join-Path $BootstrapSounds $entry.filename
  if (-not (Test-Path $target)) {
    Write-Host "Downloading $($entry.url)"
    Invoke-WebRequest -Uri $entry.url -OutFile $target
  }
  if ($entry.sha256) {
    $hash = (Get-FileHash $target -Algorithm SHA256).Hash.ToLower()
    if ($hash -ne $entry.sha256.ToLower()) {
      throw "Hash mismatch for $($entry.filename)"
    }
  }
}

Write-Host "Release ready at $ReleaseDir"
