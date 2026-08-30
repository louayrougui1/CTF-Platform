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

Reliable verification: `npm run build` is the gate. `npm run lint` and `npm run test` are **red pre-existing** (see Known gotchas) — run them only to check you didn't add new errors, never expect green.

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
- Challenge access rules (don't regress): `GET events/:eventId/challenges?teamId=` requires a `teamId` the caller belongs to, UNLESS the caller is the event owner/admin (they skip the "event not started" gate and get `solved: false` everywhere). `GET events/:eventId/challenges/:challengeId` is owner/admin-only. Non-admin callers without a team get 403.
- Every challenge and team route validates the URL `eventId` against the resource's actual event (404 `Challenge not found` / 400 `Team does not belong to this event`) — keep this check on any new nested route.
- Endpoints requiring an event+team context have the caller resolved from the JWT; there is no entity-level ownership guard layer — permissions are enforced inline in services (e.g. owner/admin checks on `EventMember`/`TeamMember`).
- Response shaping: each module returns DTOs from `dto/` (hand-wired, no `@nestjs/mapped-types`). Keep new endpoints returning the matching `*-response.dto.ts` style.
- Global `ValidationPipe` (whitelist + transform) forces class-validator DTOs on all bodies; validation errors will fail requests if a DTO lacks validation decorators.
- CORS is intentionally commented out in `src/main.ts` (line 14); do not silently re-enable without checking the frontend setup.
- `src/main.ts` writes `openapi.json` to the repo root on every boot (server side effect, file is committed). Don't be surprised by this change after running the server. Swagger UI: `/docs`.

## Conventions

- Specs live alongside source (`controller.spec.ts` / `service.spec.ts`) and use `@nestjs/testing` mocks — but see the Known gotchas: most existing specs are broken stubs.
- Auth flow: OTP email verification on register (users can't log in until `emailVerified`), JWT bearer access token (30 min) + httpOnly `refresh_token` cookie (7 days). Registering with an email that belongs to a Google-only account throws `ConflictException` (no silent password link — passwords are added only via the authenticated `setPassword` flow).
- Import Prisma enums/types from `@prisma/client`, not `prisma/`.

## Known gotchas

- **`npm run lint` is red pre-existing** (~310 errors). ESLint uses `recommendedTypeChecked`, and the codebase passes `user: any` around everywhere, so `no-unsafe-*` fires on most files; spec files add more. When you run it, only treat NEW findings in the files you touched as actionable (especially `prettier/prettier`).
- **`npm run test` fails pre-existing**: most `*.spec.ts` are minimal stubs that don't provide their service dependencies (e.g. `PrismaService`), so DI resolution fails at compile. Only `app.controller.spec.ts` and `challenge.service.spec.ts` (which mocks `PrismaService`/`StorageService`) pass. For focused verification use `npx jest src/<path>/<file>.spec.ts --silent`, not the whole suite.
- **`@nestjs/schedule` is installed but `ScheduleModule.forRoot()` is never imported** — `otp-cleanup.service.ts`'s `@Cron` never fires and the service isn't registered anywhere. Don't debug it as a runtime bug.
- **Don't `@nestjs/mapped-types`**: response DTOs are hand-wired with `@ApiProperty`; keep new endpoints returning `*-response.dto.ts` style objects.
- **Auth cookies** in `auth.service.ts`: `sameSite: 'none'` + `secure: true` when `NODE_ENV=production` (so a hosted, different-origin frontend can send them), `sameSite: 'lax'` + no `secure` in dev (valid same-site cookie on localhost). Flags come from `baseCookieOptions()` — don't inline differing flags. Do not change to `'strict'` — that breaks cross-domain `/auth/refresh`, Google account linking, and password reset.