Write-Host "=== ICMP Lab Infrastructure Test ==="

Write-Host "
[1] Checking Docker..."
docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker daemon is not available."
    exit 1
}

Write-Host "[2] Starting target..."
docker compose up -d target

if ($LASTEXITCODE -ne 0) {
    Write-Error "Target failed to start."
    exit 1
}

Start-Sleep -Seconds 6

Write-Host "[3] Checking target health..."
$health = docker inspect $(docker compose ps -q target) --format "{{.State.Health.Status}}"

if ($health -ne "healthy") {
    Write-Error "Target is not healthy. Status: $health"
    exit 1
}

Write-Host "Target health: $health"

Write-Host "[4] Testing simulator connectivity..."
docker compose --profile attack run --rm simulator

if ($LASTEXITCODE -ne 0) {
    Write-Error "Simulator test failed."
    exit 1
}

Write-Host "[5] Cleaning up..."
docker compose down -v

Write-Host "
=== ALL INFRASTRUCTURE TESTS PASSED ==="
