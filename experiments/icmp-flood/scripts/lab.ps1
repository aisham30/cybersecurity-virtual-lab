param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "attack", "stop", "reset", "status", "logs")]
    [string]$Action
)

switch ($Action) {
    "start" {
        docker compose up -d
    }

    "attack" {
        docker compose --profile attack run --rm simulator
    }

    "stop" {
        docker compose stop
    }

    "reset" {
        docker compose down -v
    }

    "status" {
        docker compose ps
    }

    "logs" {
        docker compose logs --tail=100
    }
}
