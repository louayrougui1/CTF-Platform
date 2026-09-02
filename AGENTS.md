# AGENTS.md

Monorepo for a CTF platform: two independent packages, each with its own install and `package.json` (no root tooling). Git remote: `louayrougui1/CTF-Platform`, branch `main`.

## Layout

- `backend/` — NestJS 11 + Prisma 6 + PostgreSQL (Supabase) REST API. Complete and authoritative. **Read `backend/AGENTS.md` before touching any backend code** — it covers commands, DB/migrations, env requirements, and known gotchas.
- `frontend/` — React 19 + Vite 8 + TypeScript. Currently a **bare Vite template** (`src/` is just `main.tsx`/`App.tsx`; only `react`/`react-dom` are installed). The README's advertised stack (Tailwind, Zustand, TanStack Query, shadcn/ui, Redis) is aspirational — none of it is installed; install explicitly rather than assuming.
- `backend/frontendPrompt.md` + `backend/openapi.json` — the contract a frontend is built against (openapi.json is regenerated on every backend boot and committed). Read both before any frontend work so the UI matches the real API.

## Gotchas

- Root `README.md` is **UTF-16 encoded** — the Read tool reports it as "binary". If you need it, read via PowerShell: `[System.IO.File]::ReadAllText('README.md', [System.Text.Encoding]::Unicode)`.
- No root `.gitignore`; each package gitignores its own `node_modules`/`.env`/build output.
- Backend verification: `npm run build` is the gate; `npm run lint`/`npm run test` are red pre-existing (details in `backend/AGENTS.md`).
- Frontend verification: `npm run build` (`tsc -b && vite build`) and `npm run lint` (`eslint .`).

## Frontend ↔ backend contract (highlights)

- Call the backend at its URL from an env var (e.g. `VITE_API_URL`), and send **every request with credentials** (Axios `withCredentials: true` / fetch `credentials: 'include'`).
- Auth cookies are httpOnly + `SameSite=None` (set by the backend); never read cookies from JS. Send `Authorization: Bearer <access_token>` on protected calls.
- Full auth orchestration (OTP register/verify, refresh, Google OAuth + account linking, password reset) is documented in `backend/frontendPrompt.md` — follow it.