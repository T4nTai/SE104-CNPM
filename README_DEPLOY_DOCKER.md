# Deploy Backend + Frontend + MySQL via Docker Compose

This repo includes a root `docker-compose.yml` to run the full stack on a VPS.

## Structure
- Backend: Node.js/Express (port 3000 in container)
- Frontend: React + Vite, served by Nginx (port 80 in container)
- Database: MySQL 8

The Frontend is configured to call the API at `/api` and Nginx proxies that path to the backend container, so there is no CORS problem in production.

## 1) Prepare `.env`
Copy `.env.example` to `.env` at the repo root and set secrets:

```
cp .env.example .env
# Edit .env to set strong passwords and DB name
```

Required variables:
- `MYSQL_ROOT_PASSWORD`: MySQL root password
- `MYSQL_DATABASE`: default DB name to create
- `JWT_SECRET`: any strong random string
- `JWT_EXPIRES_IN` (optional): default `1h`

## 2) Bring up the stack
From the repository root:

```
docker compose up -d --build
```

Services:
- Frontend: http://YOUR_SERVER_IP/ (port 80)
- API: http://YOUR_SERVER_IP:4000/api (exposed for debug; in production the UI uses `/api` through Nginx)
- MySQL: 127.0.0.1:3306 (host-only; ssh into the VPS to connect)

The database will be initialized from `Backend/Database.sql` on first run.

## 3) Common operations
- View logs
```
docker compose logs -f backend
# or
docker compose logs -f frontend
```
- Rebuild after code changes
```
docker compose up -d --build frontend backend
```
- Stop and remove
```
docker compose down
```

## Notes
- If you serve on a different public port than 80, change the `ports` mapping for `frontend` in `docker-compose.yml`.
- For SSL/TLS, place Nginx behind a reverse proxy like Caddy/Traefik, or adapt `Frontend/nginx.conf` accordingly.
- Dev hostnames (like `localhost`) are not used in production; the SPA calls `/api` relative to the same origin and Nginx proxies to the backend.
