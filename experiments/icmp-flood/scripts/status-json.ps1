$targetId = docker compose ps -q target

if (-not $targetId) {
    Write-Output '{"status":"stopped","healthy":false}'
    exit 0
}

$running = docker inspect $targetId --format "{{.State.Running}}"
$health = docker inspect $targetId --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}"

if ($running -eq "true" -and $health -eq "healthy") {
    Write-Output '{"status":"running","healthy":true}'
} elseif ($running -eq "true") {
    Write-Output '{"status":"starting","healthy":false}'
} else {
    Write-Output '{"status":"stopped","healthy":false}'
}
