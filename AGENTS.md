# AGENTS.md

Monorepo for a CTF platform: two independent packages, each with its own install and `package.json` (no root tooling). Git remote: `louayrougui1/CTF-Platform`, branch `main`.

## Layout

- `backend/` — NestJS 11 + Prisma 6 + PostgreSQL (Supabase) REST API. Complete and authoritative. **Read `backend/AGENTS.md` before touching any backend code** — it covers commands, DB/migrations, env requirements, and known gotchas.
- `frontend/` — React 19 + **TanStack Start** (SSR, file-based TanStack Router) on Vite 8 + TypeScript, deployed to Vercel. Real stack: Tailwind CSS v4, shadcn/ui (Radix), TanStack Query, Zustand, Axios, react-hook-form + Zod, recharts. **Read `frontend/AGENTS.md` before touching any frontend code.** Redis is **not** used anywhere in this repo (the root README's mention is aspirational).
- `backend/frontendPrompt.md` + `backend/openapi.json` — the contract the frontend is built against (openapi.json is regenerated on every backend boot and committed). Read both before any frontend work so the UI matches the real API.

## Gotchas

- Root `README.md` is **plain UTF-8** (converted from UTF-16) — read/edit it normally. Don't reintroduce a BOM or UTF-16 encoding: git treats those as binary and diffs/PRs become unreviewable.
- No root `.gitignore`; each package gitignores its own `node_modules`/`.env`/build output.
- Backend verification: `npm run build` is the gate; `npm run lint`/`npm run test` are red pre-existing (details in `backend/AGENTS.md`).
- Frontend verification: `npm run build` (`vite build`) and `npm run lint` (`eslint .`). There is **no test runner** and the `build` script does **not** typecheck — run `npx tsc --noEmit` separately (strict flags: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`).
- Package manager is ambiguous in `frontend/`: both `bun.lock`/`bunfig.toml` and `package-lock.json` are committed. Prefer `npm` for a single source of truth unless the user says otherwise.

## Frontend ↔ backend contract (highlights)

- Call the backend at its URL from `VITE_API_URL` (no trailing slash), and send **every request with credentials** (Axios `withCredentials: true` / fetch `credentials: 'include'`).
- The canonical client is `frontend/src/lib/api-client.ts` (axios instance: bearer interceptor + 401 → `POST /auth/refresh` with in-flight de-duplication, redirect to `/login` when refresh fails). Feature calls live in `frontend/src/api/*`; use its `apiErrorMessage`/`apiStatus`/`isInformationalResponse` helpers to surface backend messages verbatim.
- Auth cookies are httpOnly + `SameSite=None` (set by the backend); never read cookies from JS. The access token is persisted by `frontend/src/lib/auth-store.ts` (Zustand → `localStorage`) and sent as `Authorization: Bearer <access_token>` on protected calls. The refresh token is a cookie only — never store it.
- Full auth orchestration (OTP register/verify, refresh, Google OAuth + account linking, password reset) is documented in `backend/frontendPrompt.md` — follow it.
- Backend CORS is **enabled** and driven by the backend's `FRONTEND_URL` env var (credentials allowed). If requests are blocked cross-origin, the fix is the backend env var — not client code.