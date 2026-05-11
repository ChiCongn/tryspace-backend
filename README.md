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

3. Start local PostgreSQL:

   ```bash
   docker compose up -d
   ```

4. Run migrations and seed data:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the development server:

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

## API Base URL

Local API base URL:

```text
http://localhost:3000/api/v1
```

Health check:

```text
http://localhost:3000/health
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
