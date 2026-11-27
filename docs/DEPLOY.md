# CI/CD

Two GitHub Actions workflows live in `.github/workflows/`.

## CI (`ci.yml`) — every push to `main` and every pull request
- **Backend**: `manage.py check`, `makemigrations --check`, full test suite — on **SQLite and Postgres 17** (with Redis).
- **Frontend**: `npm ci` + `npm run build` (skipped automatically if `frontend/` is not committed).
- **Docker**: builds the production image (no push) so a broken Dockerfile fails the PR.

## Deploy (`deploy.yml`) — after CI passes on `main`, or manually (Actions → Deploy → Run workflow)
1. Builds the image and pushes it to **GitHub Container Registry** (`ghcr.io/<owner>/<repo>:<sha>` and `:latest`).
2. Copies `docker-compose.prod.yml` + `deploy/Caddyfile` to the server over SSH.
3. Pulls the new image and runs `docker compose up -d` (migrations run on container start).
4. Smoke-tests `https://$DEPLOY_DOMAIN/api/v1/common/statistics/`.

Stack on the server: Django (gunicorn) + Postgres + Redis + Caddy (automatic HTTPS, serves `/media`).

## One-time setup

**On the server** (any Linux VPS with Docker + the compose plugin, ports 80/443 open):
```bash
mkdir -p ~/myjob && cd ~/myjob
cp .env.example .env      # then fill in real values (SECRET_KEY, POSTGRES_PASSWORD, DOMAIN, email, ...)
```
Point your domain's DNS A record at the server.

**In GitHub → Settings → Environments → `production`** (add required reviewers if you want manual approval):

| Type | Name | Value |
|---|---|---|
| Secret | `DEPLOY_HOST` | server IP / hostname |
| Secret | `DEPLOY_USER` | SSH user (must be allowed to run docker) |
| Secret | `DEPLOY_SSH_KEY` | private key of a **dedicated** deploy key |
| Secret | `DEPLOY_PATH` | e.g. `/home/deploy/myjob` |
| Secret (optional) | `DEPLOY_PORT` | SSH port, default 22 |
| Variable | `DEPLOY_DOMAIN` | e.g. `myjob.uz` (used by the smoke test) |

Secrets such as `SECRET_KEY`, the Gmail app password and the DB password live **only** in `.env` on the server, never in the repository or in GitHub.

## Local checks
```bash
uv run python manage.py test            # backend tests
docker build -t myjob .                    # production image
```
