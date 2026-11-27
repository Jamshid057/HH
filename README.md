# MyJob — job portal

Django REST API (`accounts`, `candidates`, `companies`, `jobs`, `common`, `socials`) + React frontend (`frontend/`).

## Run locally
```bash
cp .env.example .env              # fill SECRET_KEY (see file)
uv sync
uv run python manage.py migrate
make seed                         # demo data: employer@demo.uz / candidate@demo.uz (password in common/management/commands/seed_demo.py)
make run                          # API + Swagger on http://localhost:8000
make front                        # frontend on http://localhost:3000  (cd frontend && npm ci first)
```
Redis is used for e-mail OTP codes and password-reset tokens (`REDIS_URL`, default `redis://127.0.0.1:6379/1`).

## Tests
```bash
uv run python manage.py test
```

## CI/CD
GitHub Actions run tests on every push/PR and deploy `main` via Docker — see [docs/DEPLOY.md](docs/DEPLOY.md).
