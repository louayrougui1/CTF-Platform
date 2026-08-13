# Backend Code Review Report

**Scope:** Full review of the NestJS 11 + Prisma 6 + PostgreSQL (Supabase) CTF platform backend.
**Date:** 2026-08-13
**Method:** Manual source review of every `src/` module, `prisma/schema.prisma`, DTOs, strategies/guards, config, and verification of `@nestjs/config` behavior against installed package internals. No code was changed.

---

## Summary

The codebase is well-structured (clean feature folders, consistent DTO response shaping, sensible Prisma relations, anti-enumeration on some endpoints) but carries several **security** and **data-integrity** defects, plus a number of inconsistencies between implementation, DTOs, docs, and AGENTS.md. Most critical issues cluster in **auth** (Google-only account login, env loading) and **challenge file handling** (file wiping/orphaning).

---

## Critical

### C1. Google-only accounts crash the login endpoint with a 500
`src/auth/auth.service.ts:79`
```ts
const isPasswordValid = await bcrypt.compare(password, user.password);
```
For a Google-only account `user.password` is `null`. `bcrypt.compare()` throws `TypeError: data and hash arguments required`, producing an unhandled 500 instead of the intended `401 Invalid credentials`. Any attempt to log in to a Google-only account (or one whose password was never set) crashes the request.
**Fix direction:** guard `if (!user.password) return null;` before comparing.

### C2. Updating a challenge without re-uploading the file wipes `hasFile` and orphans the stored file
`src/challenge/challenge.service.ts:207-215`
```ts
data: { ...dto, hasFile: !!file, fileUrl }
```
Prisma ignores `undefined` fields (so `fileUrl` is left dangling), but `hasFile: !!file` becomes `false`. After any PATCH that doesn't attach a file:
- the challenge reports `hasFile: false` while `fileUrl` still points at a live storage path,
- `getChallenge`/`getChallengesByEvent` skip signing the URL (`hasFile && fileUrl` check) so the file becomes inaccessible,
- the file is never deleted from Supabase (orphan).
Also, when a file *is* replaced, the old file is never removed from storage. `deleteChallenge` (`challenge.service.ts:218-227`) likewise never deletes the stored file.

### C3. Team passwords are stored and compared in plaintext
`prisma/schema.prisma:109` (`teamPassword String`), `src/team/team.service.ts:186` (`team.teamPassword !== password`).
A DB leak exposes every team password; the comparison is also not constant-time. Team passwords should be hashed (like user passwords via bcrypt) before storage and comparison.

### C4. `GET /event-member/:eventId/members` leaks member emails to any authenticated user
`src/event-member/event-member.service.ts:39-57`
The endpoint only verifies the JWT (`@UseGuards(JwtGuard)` on the controller) and that the event exists — there is **no** membership/owner/role check. Any logged-in user can enumerate members (including `email`) of any event. Compare with `getEventTeams`/challenge endpoints which enforce membership.
**Fix direction:** require event membership (or owner/admin) before returning member details.

### C5. Google OAuth access token is placed in the redirect URL query string
`src/auth/auth.controller.ts:108`
```ts
res.redirect(`${frontendUrl}/?token=${result.access_token}`);
```
The bearer token leaks into browser history, proxy/server logs, and any `Referer` header. Prefer a one-time exchange code or a short-lived fragment, or POST to a same-origin bridge.

### C6. `.env` is never loaded by the app
No `ConfigModule.forRoot()` and no `dotenv` import anywhere (verified via grep). `src/auth/auth.module.ts:19` uses `ConfigModule.forFeature(googleOAuthConfig)` alone. `@nestjs/config`'s `forFeature` does resolve the factory from `process.env` (via `ConfigHostModule`), but **only `forRoot()` triggers `loadEnvFile`**. The `.env` file present in the repo is therefore ignored at runtime — the app works only if every variable is exported into the OS environment. `google-oauth.config.ts` uses `requireEnv` which throws at module init on any missing variable, so a fresh `npm run start:dev` can fail to boot.

---

## High

### H1. Refresh token is written to the console
`src/auth/auth.controller.ts:82`
```ts
console.log('Refresh token from cookie:', refreshToken);
```
A 7-day credential is logged on every logout. Combined with the file logger middleware, this can persist in `logs/requests.txt`? — the middleware logs only method/URL, but console output itself is still a leak vector. Remove.

### H2. Leaderboard double-counts points when two team members solve the same challenge
`src/leaderboard/leaderboard.service.ts:71-92`
The query collects each member's correct submissions and sums every submission's points:
```ts
const score = allSubmissions.reduce((sum, s) => sum + s.challenge.points, 0);
```
If two members of one team both solve the same challenge, the points are added twice. A CTF scoreboard should count each challenge once per team. The `earliestCorrect` tiebreaker is computed but then dropped from the final output (dead work).

### H3. `UpdateChallengeDto.points` cannot be set via multipart PATCH
`src/challenge/dto/updateChallenge.dto.ts:42-45`
`createChallenge.dto.ts` has `@Type(() => Number)` on `points`; the update DTO does not. Under `multipart/form-data` everything arrives as a string, so `@IsInt()` rejects `"100"` → 400. Points are effectively un-updatable.

### H4. `getChallengeStats` response does not match its DTO
`src/challenge/challenge.service.ts:151-164` returns only `{ solveCount }`; `src/challenge/dto/challenge-stats-response.dto.ts` declares `submissionCount` **and** `solveCount`. Swagger documents a field the API never returns.

### H5. OTP cleanup cron never runs; service is dead code
`src/auth/otp/otp-cleanup.service.ts` uses `@Cron` from `@nestjs/schedule`, but:
- `ScheduleModule.forRoot()` is never imported (verified by grep), and
- `OtpCleanupService` is registered in no module's providers.
The decorator metadata is inert. Expired/consumed OTP rows accumulate forever (`otp.service` only deletes on successful verify).

### H6. Cross-field date validation is bypassable on PATCH
`src/event/dto/updateEvent.dto.ts:34-39` — the `MinDurationFromStart` validator only checks fields present in the **request body**:
```ts
const { startDate } = args.object as UpdateEventDto;
```
PATCHing only `endDate` (or only `startDate`) skips the rule entirely, so an admin can set `endDate` before the stored `startDate`, or create an impossible range. The validator must merge in the persisted `startDate`.

### H7. Invalid UUID path params cause a 500 (Prisma `P2023`)
No `ParseUUIDPipe` (or any pipe) on `@Param('id'/'eventId'/'teamId'/'challengeId')` anywhere. `GET /events/not-a-uuid` → Prisma "Inconsistent column data" → unhandled 500. Affects event, team, challenge, leaderboard, and event-member routes. Should be `400 Bad Request`.

### H8. `isPublic` is dead configuration
- No create/update DTO exposes `isPublic` (`eventCreate.dto.ts`, `updateEvent.dto.ts`), so every event is created public and it can never be flipped.
- `joinEvent` (`src/event-member/event-member.service.ts:123`) never checks `event.isPublic` — anyone who knows an event ID can join a "private" event. Only `getActiveEvents` filters by `isPublic`.

### H9. Register on a Google-only account forces an OTP verification cycle, then blocks resend
`src/auth/auth.service.ts:108-131` links a password to an existing Google account but still sends an `EMAIL_VERIFICATION` OTP even though the account is already `emailVerified`. If the user loses/expires that OTP, `resendOtp` (`auth.service.ts:413-415`) throws `Email is already verified` — the user is stuck until they just log in, which is confusing. The verification step should be skipped for already-verified accounts.

---

## Medium

### M1. Access-token lifetime is inconsistent (three different values)
- `src/auth/auth.module.ts:17` — module default `signOptions.expiresIn: '300m'` (5h)
- `src/auth/auth.service.ts:39` — `generateAccessToken` overrides to `'60m'` (1h)
- AGENTS.md documents **30 min**
Refresh tokens are consistently 7d, but the access-token story should be one value.

### M2. No rate limiting anywhere
No `@nestjs/throttler`; `login`, `register`, `resend-otp`, `forgot-password`, and `submitFlag` are all unthrottled. OTP verification has a 5-attempt cap (good), but wrong-flag guessing and login brute-force are unlimited. A commit message (`fc0ae19`) explicitly notes "add rate limiting later".

### M3. `resendOtp` uses the enum value as the email subject
`src/auth/auth.service.ts:422-426` passes `OtpPurpose.EMAIL_VERIFICATION` to `sendOtpEmail`, so the subject renders as `EMAIL_VERIFICATION` instead of the human `'Email Verification'` string used elsewhere (`auth.service.ts:141`).

### M4. Refresh tokens are stateless JWTs — logout cannot revoke
`logout` (`auth.service.ts:193-199`) only clears the cookie; the JWT remains valid for 7 days. A stolen refresh token cannot be invalidated. There is also no token rotation/revocation list. (Common trade-off, but worth documenting or addressing with server-side sessions/denylist.)

### M5. Reset-token TTL and cookie lifetime disagree
`src/auth/auth.service.ts:363` — `expiresAt` = 15 min; `:304` — cookie `maxAge` = 5 min. The cookie expires first, truncating the usable window and leaving "valid token, no cookie" states.

### M6. `createEvent` is not transactional
`src/event/event.service.ts:113-138` creates the `Event` then separately the `EventMember(OWNER)` row. If the second write fails (transient error, unique violation), the event exists with no owner membership — the owner then can't view it (`getEvent` requires membership) and no admin can manage it. Wrap in `$transaction`.

### M7. Profile-update cooldown is coupled to `User.updatedAt`
`src/user/user.service.ts:54-64` uses `updatedAt` (auto-bumped on *any* user row change) as the "last profile change" marker. A password reset or any other write to the user resets the cooldown timer. The logic also rejects the update entirely when the username is unchanged, even though the caller may just be retrying.

### M8. Info-disclosure inconsistency in error handling
- Non-membership on challenges → `NotFound` ("Event not found"), `challenge.service.ts:85-95`.
- Non-membership on teams/leaderboard → `Forbidden`, `team.service.ts:46-53`, `leaderboard.service.ts:33-40`.
Two different anti-enumeration policies for the same "you're not allowed" condition. Pick one.

### M9. Debug `console.log`s left in production paths
- `jwt.guard.ts:10` ("JWT guard hit...") — logs on every protected request.
- `google.guard.ts:10`, `google.strategy.ts:28` (full OAuth profile incl. email/Google ID), `auth.controller.ts:102`.
Should be removed or moved behind a logger.

### M10. `.env` contains secrets and is committed-adjacent / unvalidated config
`SupabaseService` (`supabase.service.ts:10-13`) and `PrismaService` read env with `!` non-null assertions — a missing variable surfaces as an obscure runtime error. `google-oauth.config.ts` at least validates. Consider `ConfigModule.forRoot({ isGlobal: true })` + a validation schema.

### M11. `StorageService.upload` generates a signed URL it immediately discards
`src/storage/storage.service.ts:33-34` calls `getSignedUrl` and returns it, but `createChallenge`/`updateChallenge` only store `path` (`challenge.service.ts:178,204`). One wasted Supabase API round-trip per upload.

### M12. No file type validation on challenge uploads
`FileInterceptor` (`challenge.module.ts:11-15`) enforces only a 1 MB size cap. There is no `fileFilter` or MIME allow-list and no friendly handling of the 413 `PayloadTooLargeError`. (For a CTF platform hosting binary challenges this is partially intentional, but should be explicit.)

### M13. `getEventTeams` leaks team list but `getEventMembers` leaks emails (see C4)
Related authorization gap: the members endpoint is the serious one; team listing to members is fine.

---

## Low / Consistency

### L1. JWT strategy duplicated across seven modules
`JwtStrategy` is provided in `UserModule`, `EventModule`, `TeamModule`, `LeaderboardModule`, `EventMemberModule`, `ChallengeModule` (each re-instantiates it and re-queries the user on every request). It could be exported once from `AuthModule` (which currently provides it *not at all*).

### L2. Response/DTO drift for the "event not started" path
`getChallengesByEvent`, `getChallenge`, and `getChallengeStats` return `{ message }` (`challenge.service.ts:113,137,157`) while their Swagger decorators claim `ChallengeResponseDto[]`/`ChallengeResponseDto`/`ChallengeStatsResponseDto`. The not-started response shape is undocumented.

### L3. `TeamMember.eventId` is denormalized from `Team.eventId`
`schema.prisma:142` stores `eventId` on `TeamMember` and `createTeam` redundantly passes it (`team.service.ts:138`). If a team could ever move events, these would drift. The unique `[userId, eventId]` constraint depends on it being correct.

### L4. Dead / commented-out code
- `auth.service.ts:147-156` — commented-out token generation in `register`.
- `team.service.ts:74-88` — commented-out `getEventStats`.
- `leaderboard.service.ts:82-91` — `earliestCorrect` computed, used for sort, then stripped from output (fine) but worth a comment.

### L5. `upload()` extension parsing edge cases
`storage.service.ts:17` — `file.originalname.split('.').pop()` mislabels names like `archive.tar.gz` as `.gz` and handles dotfiles/empty extensions loosely. Cosmetic for storage paths but can misrepresent content types.

### L6. `isPublic`, `twoFactorEnabled`, `LOGIN_2FA` purpose are unused features
Schema supports 2FA flags and a `LOGIN_2FA` OTP purpose, but no code uses them. Not bugs, but dead surface area that implies functionality that doesn't exist.

### L7. `submission.flag` stores the player's submitted string in plaintext
`challenge.service.ts:255` persists both correct and wrong flag attempts. Storing the correct flag a second time in `Submission` duplicates the secret that's already in `Challenge.flag`. Consider storing only a hash or status.

### L8. `getMyEvents` returns only events the user *owns*
`event.service.ts:66-72` filters by `ownerId`. The name suggests "events I belong to" (including as member). Either rename or broaden the query.

### L9. Route naming / path style inconsistency
Team/leaderboard/challenge live under `events/:eventId/...`, but event-member is a flat `event-member` controller with `/eventId/...` sub-paths and admin routes that take IDs in the body. Consistent REST nesting would be nicer, but it works.

### L10. `openapi.json` is regenerated on every boot (side effect)
`main.ts:45` — `writeFileSync('./openapi.json', ...)` depends on `process.cwd()`. AGENTS.md documents this, but running the server from a different working directory writes the file elsewhere.

### L11. `PrismaService` has no `OnModuleDestroy`
`prisma.service.ts` connects in `onModuleInit` but never disconnects on shutdown — the pool can hold sockets during graceful shutdown.

### L12. `JwtGuard`/`LocalGuard`/`GoogleAuthGuard` are thin wrappers adding only logging
The guard classes exist solely for `console.log` side effects (see M9).

### L13. No `ParseUUIDPipe`, `ParseIntPipe`, or global `ValidationPipe` for params
Beyond the 500 issue (H7), there's no consistent param validation strategy across controllers (bodies are well-covered by the global whitelist/transform pipe).

---

## Verification notes

- Findings C6/H5 were confirmed by inspecting the installed `@nestjs/config` (`config.module.js`, `config-host.module.js`, `config.service.js`) and grepping for `ConfigModule.forRoot`, `ScheduleModule.forRoot`, and `dotenv` (none present).
- Console-log locations were enumerated via grep (`console.log` — 5 hits, all in `src/auth/**`).
- No tests/build/lint were run as part of this review; findings are static-analysis based. Running `npm run lint`, `npm run build`, `npm run test` is recommended to catch any type-level fallout.

## Suggested fix priority

1. C1 (login crash), C4 (member/email leak), C5 (token in URL), C2 (file wiping) — security/data-loss, fix first.
2. C3 (plaintext team passwords), C6 (env loading), H2 (leaderboard scoring), H7 (500 on bad UUID).
3. H3/H4/H6/H8/H9 and the Medium bucket — correctness and API surface.
4. Low/Consistency items — hygiene, can be batched.