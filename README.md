# TrySpace Backend

Node.js, Express, TypeScript, Prisma, and PostgreSQL API for TrySpace.

## Local Setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL installed on your laptop:

   ```bash
   sudo systemctl start postgresql
   ```

4. Create a local PostgreSQL user and database once:

   ```bash
   sudo -u postgres psql -c "CREATE USER tryspace WITH PASSWORD 'tryspace';"
   sudo -u postgres psql -c "CREATE DATABASE tryspace OWNER tryspace;"
   ```

   If the `tryspace` user already exists but has a different password, reset it:

   ```bash
   sudo -u postgres psql -c "ALTER USER tryspace WITH PASSWORD 'tryspace';"
   ```

   If your laptop PostgreSQL uses a different username, password, database, or
   port, update `DATABASE_URL` in `.env` instead.

5. Run migrations and seed data:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

The API runs locally at `http://localhost:3000`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `JWT_SECRET` | Yes | Secret used to sign access JWTs. |
| `JWT_REFRESH_SECRET` | Yes | Reserved refresh-token secret. |
| `JWT_ACCESS_EXPIRES_IN` | Yes | Access-token lifetime, for example `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | Yes | Refresh-token lifetime, for example `7d`. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret. |
| `PORT` | No | HTTP port. Defaults to `3000`. |
| `NODE_ENV` | No | Runtime environment, for example `development` or `production`. |
| `FRONTEND_URL` | Yes | Allowed CORS origin for the frontend. |
| `LOG_LEVEL` | No | Minimum log level: `debug`, `info`, `warn`, `error`, or `silent`. Defaults to `info`. |
| `LOG_FORMAT` | No | Log output format: `pretty` or `json`. Defaults to `json` in production and `pretty` otherwise. |
| `SLOW_REQUEST_MS` | No | Request duration threshold for slow request warnings. Defaults to `1000`. |
| `LOG_HEALTHCHECKS` | No | Set to `true` to include `/health` request logs. Defaults to `false`. |
| `LOG_PRISMA_QUERIES` | No | Set to `true` with `LOG_LEVEL=debug` to log Prisma query text and duration. Defaults to `false`. |

## API Base URL

Local API base URL:

```text
http://localhost:3000/api/v1
```

Health check:

```text
http://localhost:3000/health
```

Local seed assets are served from:

```text
http://localhost:3000/assets
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server with Nodemon and ts-node. |
| `npm run build` | Run `prisma generate` and compile TypeScript to `dist/`. |
| `npm start` | Run production migrations with `prisma migrate deploy`, then start `dist/index.js`. |
| `npm run typecheck` | Run TypeScript type checking without emitting files. |
| `npm run db:migrate` | Run Prisma development migrations. |
| `npm run db:seed` | Seed local database data. |
| `npm run db:studio` | Open Prisma Studio. |

`npm run db:seed` resets local data and creates 50+ products, 5 Gmail seed accounts using password `Tryspace@123`, delivered orders for 2 users, and sample reviews. Product media uses a mix of local demo assets and online Unsplash/three.js assets; see `SEED_ASSET_SOURCES.md`.

## Production

Production host: Railway.

Production URL:

```text
https://<your-railway-service>.up.railway.app
```

Set the final Railway service URL after the service is created.

## Deployment Checklist

- [ ] `DATABASE_URL` set in Railway.
- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET`, Cloudinary variables, `FRONTEND_URL`, and `NODE_ENV` set in Railway.
- [x] Prisma migrate deploy runs on startup through `npm start`.
- [x] Health endpoint accessible at `/health`.
