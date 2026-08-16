# Backend Code Review Report

**Scope:** Re-review of the NestJS 11 + Prisma 6 + PostgreSQL (Supabase) CTF platform backend after the DTO/schema fixes (challenge file handling, leaderboard scoring, `isPublic`, category/difficulty DTO sync).
**Date:** 2026-08-16
**Method:** Manual source review of `src/` modules and `prisma/schema.prisma`; state verified via reads. Build passes (`npm run build`); lint has 310 pre-existing errors (spec files, unused imports) unrelated to the fixes.

---

## Summary

The critical data-integrity bugs found in the previous review were fixed: `updateChallenge` no longer wipes `hasFile`, the leaderboard now sums solves via the `Team.submissions` relation (attributed by `teamId`, not current membership), `isPublic` is enforced on `joinEvent`, and the not-started challenge path throws instead of returning an undocumented `{ message }`. Several security items remain open, and the submission schema redesign is **not yet applied to the database**, which is a hard runtime blocker.

---

## Critical

### C1. Database is not migrated to the new Submission schema — runtime breaks
`prisma/schema.prisma` now models `Submission` with a required `teamId`, `@@unique([challengeId, teamId])`, and no `status` column / `SubmissionStatus` enum, but **no migration has been generated or applied** (schema-only changes per instruction). Until it runs:
- `submitFlag` (`challenge.service.ts`) inserts with `teamId` and queries against the new shape → column/relation errors.
- leaderboard/`getChallengeStats`/`getEventStats` queries reference removed/renamed fields.
- The old DB still holds WRONG rows and duplicate per-user solves.

Required migration steps (hand-SQL if not using `prisma migrate`):
1. `DELETE` all WRONG rows (only correct flags are stored now).
2. `ADD COLUMN teamId` (nullable).
3. Backfill from `TeamMember` — join on `Submission.userId = TeamMember.userId` where `TeamMember.eventId = (Challenge.eventId for Submission.challengeId)`.
4. Delete rows with no matching team.
5. Dedupe per `(challengeId, teamId)` keeping the earliest `createdAt`.
6. `SET NOT NULL` on `teamId`.
7. Add unique index on `(challengeId, teamId)`.
8. Drop the `status` column and `SubmissionStatus` enum type.

### C2. `deleteChallenge` never deletes the stored file
`challenge.service.ts` `deleteChallenge` deletes the DB row but not the Supabase object, orphaning every file whose challenge is deleted (this is the remaining half of the old update/delete file-wipe bug — `updateChallenge` was fixed, delete was not). Delete the storage object before/inside the DB delete.

### C3. Team passwords are stored and compared in plaintext
`teamPassword String` in the schema; `team.service.ts` compares `team.teamPassword !== password`. A DB leak exposes every team password and the comparison is not constant-time. Hash with bcrypt like user passwords.

### C4. Google OAuth access token is placed in the redirect URL query string
`auth.controller.ts` Google callback redirects to `${frontendUrl}/?token=${result.access_token}`. The bearer token leaks into browser history, server logs, and `Referer` headers. Use a one-time exchange code or a short-lived fragment.

### C5. `.env` is never loaded by the app
No `ConfigModule.forRoot()` and no `dotenv` import anywhere (`app.module.ts` has neither; `auth.module.ts` uses only `ConfigModule.forFeature(googleOAuthConfig)`). `forFeature` resolves factories from `process.env` but **only `forRoot()` triggers env-file loading**, so a fresh `npm run start:dev` fails to boot unless every variable is exported into the OS environment.

---

## High

### H1. `JwtGuard` logs the full `Authorization` header (Bearer token) on every request
`src/auth/guards/jwt.guard.ts:13-17`:
```ts
console.log('JWT GUARD:', { ... authorization: request.headers.authorization });
```
The live access token is written to the console on every protected request (escalated from the previous generic console-log finding). Remove, or log method/URL only behind a logger.

### H2. `UpdateChallengeDto.points` cannot be set via multipart PATCH
`updateChallenge.dto.ts` lacks `@Type(() => Number)` on `points` (present in `createChallenge.dto.ts`). Under `multipart/form-data` values arrive as strings, so `@IsInt()` rejects `"100"` → 400; points are effectively un-updatable.

### H3. OTP cleanup cron never runs; service is dead code
`otp-cleanup.service.ts` uses `@Cron`, but `ScheduleModule.forRoot()` is never imported and the service is registered in no module. Expired/consumed OTP rows accumulate forever.

### H4. Cross-field date validation is bypassable on PATCH
`updateEvent.dto.ts` `MinDurationFromStart` only inspects fields present in the request body, so PATCHing only `endDate` (or only `startDate`) skips the rule. The validator must merge in the persisted `startDate`.

### H5. Invalid UUID path params cause a 500 (Prisma P2023)
No `ParseUUIDPipe` on any `@Param(...)`. `GET /events/not-a-uuid` → unhandled Prisma error → 500 instead of 400. Affects event, team, challenge, leaderboard, and event-member routes.

### H6. `setPassword` returns `access_token` but never sets the `refresh_token` cookie
Every other access-token-returning endpoint also sets the 7-day httpOnly refresh cookie; `setPassword` (user-fixed to return `access_token` + `user`) skips the cookie, so the session has no refresh path until a later login.

---

## Medium

- **M1. No rate limiting.** `login`, `register`, `resend-otp`, `forgot-password`, `submitFlag` are all unthrottled (login brute-force, wrong-flag guessing, email bombing).
- **M2. Access-token lifetime is inconsistent (three values):** module default `signOptions.expiresIn: '300m'` (`auth.module.ts:17`), `generateAccessToken` override `'60m'` (`auth.service.ts:39`), AGENTS.md documents 30 min.
- **M3. `resendOtp` uses the enum value as the email subject** — renders `EMAIL_VERIFICATION` instead of `'Email Verification'`.
- **M4. Refresh tokens are stateless JWTs — logout cannot revoke.** Logout only clears the cookie; the JWT stays valid 7 days. No rotation/denylist.
- **M5. Reset-token TTL and cookie lifetime disagree:** `expiresAt` = 15 min vs cookie `maxAge` = 5 min (`auth.service.ts`), truncating the usable window.
- **M6. `createEvent` is not transactional:** Event + OWNER `EventMember` written separately; a failure on the second write leaves an ownerless event no one can manage or view.
- **M7. Profile-update cooldown is coupled to `User.updatedAt`:** any user-row write (e.g. password reset) resets the timer; unchanged-username retries are rejected outright.
- **M8. Info-disclosure inconsistency:** non-membership on challenges → `NotFound`, on teams/leaderboard → `Forbidden`. Pick one anti-enumeration policy.
- **M9. Debug `console.log`s in production paths:** `jwt.guard.ts` (also H1), `google.guard.ts:10`, `google.strategy.ts:28` (full OAuth profile). Remove or move behind a logger.
- **M10. Unvalidated env:** `PrismaService`/`SupabaseService` use `!` non-null assertions → obscure runtime errors on missing vars. Use `ConfigModule.forRoot({ isGlobal: true })` + validation schema.
- **M11. `StorageService.upload` generates a signed URL it immediately discards:** one wasted Supabase API round-trip per upload (only `path` is stored).
- **M12. No file-type validation on challenge uploads:** `FileInterceptor` enforces only the 1 MB cap; no MIME allow-list and no friendly handling of `413 PayloadTooLargeError`.

---

## Low / Consistency

- **L1. JWT strategy duplicated across seven modules:** `JwtStrategy` re-instantiated per module; could be exported once from `AuthModule`.
- **L2. `TeamMember.eventId` is denormalized from `Team.eventId`:** unique `[userId, eventId]` depends on it staying in sync.
- **L3. Dead / commented-out code:** `auth.service.ts:147-156` (commented token gen), `team.service.ts:74-88` (commented `getEventStats`).
- **L4. `upload()` extension parsing edge cases:** `originalname.split('.').pop()` mislabels `archive.tar.gz` as `.gz`.
- **L5. Unused 2FA surface:** `twoFactorEnabled` / `LOGIN_2FA` in schema and OTP purpose with no implementation.
- **L6. `submission.flag` stores the player's submitted string in plaintext:** now only correct flags are stored, but the correct secret is duplicated from `Challenge.flag`. Consider a hash.
- **L7. `getMyEvents` returns only events the user *owns*:** name suggests membership; rename or broaden.
- **L8. Route style inconsistency:** `events/:eventId/...` nested vs flat `event-member` with IDs in the body.
- **L9. `openapi.json` regenerated on every boot:** depends on `process.cwd()`, so a different working directory writes it elsewhere.
- **L10. `PrismaService` has no `OnModuleDestroy`:** pool not closed on graceful shutdown.
- **L11. Guards are thin log wrappers** (see H1/M9) — no real logic beyond logging.
- **L12. No param-validation pipes beyond the body `ValidationPipe`** (ties to H5).
- **L13. Submit cosmetics:** a wrong flag returns 201 `Created` with `status: 'WRONG'`, and the miss response uses `id: ''`; the `earliestCorrect` tiebreaker name in the leaderboard is stale (it now applies to all stored submissions, not just "correct" ones).

---

## Suggested fix priority

1. **C1 — migrate/backfill the DB** (hard blocker; nothing else runs correctly until then).
2. **H1 — stop logging the Bearer token**; **C2 — delete files on `deleteChallenge`**.
3. **C3/C4/C5, H2–H6** — auth/security and API-surface fixes.
4. **Medium bucket** — rate limiting, env loading/validation, transaction fixes.
5. **Low items** — hygiene, can be batched.