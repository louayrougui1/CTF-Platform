# AGENTS.md

NestJS 11 + Prisma 6 + PostgreSQL (Supabase) REST API for a CTF (capture-the-flag) platform — teams compete on challenges within events. Frontend is in the sibling `frontend/` folder; this file covers the `backend/` package only.

## Commands

Run from `backend/`:

```bash
npm install
npm run start:dev      # watch mode; server on PORT (default 3000)
npm run lint           # eslint --fix (type-checked rules + prettier, endOfLine=auto)
npm run test           # jest unit tests (specs alongside source in src/)
npm run test:e2e       # jest --config ./test/jest-e2e.json
npm run build          # nest build -> dist/
```

Verify order: `npm run lint` -> `npm run build` -> `npm run test`.

## DB / Prisma

- Schema: `prisma/schema.prisma`. Prisma client is generated into `node_modules` (NOT `src/generated`) — commit-time `prisma generate` is normal and safe. There is **no `postinstall` hook**, so after a fresh `npm install` run `npx prisma generate` explicitly before building or booting.
- After any schema change: `npx prisma migrate dev` (this regenerates the client automatically). Use `--name` for a descriptive migration name, matching the timestamped convention in `prisma/migrations/`.
- The datasource requires BOTH `DATABASE_URL` and `DIRECT_URL`. `DIRECT_URL` (unpooled) is mandatory for migrations; `DATABASE_URL` is the transaction pooler. `prisma migrate` opens DIRECT_URL — an agent "fixing" only DATABASE_URL will break migrations.
- Run `npx prisma studio` if you need an interactive DB view.

## Isolated features

Everything is behind environment variables; nothing is mocked. No `.env` = boot or runtime failures. Note: there is **no `ConfigModule.forRoot()` or dotenv import** — the `.env` file is NOT auto-loaded at runtime; every variable must be present in the process environment (`google-oauth.config.ts`'s `requireEnv` throws at boot on any missing var).

- Prisma/Postgres: `DATABASE_URL`, `DIRECT_URL`
- Supabase (Storage for challenge files): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Auth: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Email OTP: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`
- `PORT`

## Architecture notes

- Monolithic Nest app; all modules registered in `src/app.module.ts`. Feature folders: `auth`, `user`, `event`, `team`, `event-member`, `challenge`, `leaderboard`, plus `prisma`, `supabase`, `storage`.
- Routes (no global prefix): `auth`, `user`, `events`, `events/:eventId/teams`, `events/:eventId/challenges`, `events/:eventId/leaderboard`, `event-member`. Most are `@ApiBearerAuth('bearer')`-protected except auth.
- Endpoints requiring an event+team context have the caller resolved from the JWT; there is no entity-level ownership guard layer — permissions are enforced inline in services (e.g. owner/admin checks on `EventMember`/`TeamMember`).
- Response shaping: each module returns DTOs from `dto/` (hand-wired, no `@nestjs/mapped-types`). Keep new endpoints returning the matching `*-response.dto.ts` style.
- Global `ValidationPipe` (whitelist + transform) forces class-validator DTOs on all bodies; validation errors will fail requests if a DTO lacks validation decorators.
- CORS is intentionally commented out in `src/main.ts` (line 14); do not silently re-enable without checking the frontend setup.
- `src/main.ts` writes `openapi.json` to the repo root on every boot (server side effect, file is committed). Don't be surprised by this change after running the server. Swagger UI: `/docs`.

## Conventions

- Pairs of `controller.spec.ts` / `service.spec.ts` exist per feature and use `@nestjs/testing` mocks — extend them when changing controllers/services.
- Auth flow: OTP email verification on register (users can't log in until `emailVerified`), JWT bearer access token (30 min) + httpOnly `refresh_token` cookie (7 days). Registering with an email that belongs to a Google-only account throws `ConflictException` (no silent password link — passwords are added only via the authenticated `setPassword` flow).
- Import Prisma enums/types from `@prisma/client`, not `prisma/`.