# Bring holo-ctf (CTF Nexus) into this project

Pull the full source of `louayrougui1/holo-ctf` (branch `main`) through your linked GitHub connection and recreate it here as the working app, replacing the placeholder page.

## What the repo contains (confirmed)

- **Stack:** React 19 + Vite + TanStack Start (SSR) + TanStack Router/Query + Tailwind v4 + Radix UI (shadcn) + Zustand + Axios — same stack as this project, so it's a direct port, not a rewrite.
- **Pages (routes):** Landing `/`, `login`, `register`, `forgot-password`, `reset-password`, `verify-email`, `google-link` / `google.link-confirmation`, `dashboard`, `events` (list, `new`), `events/$eventId` (index, `challenges`, `leaderboard`, `manage`, `teams` list + `$teamId` detail), `my-events`, `profile`.
- **API layer:** `src/api/` (auth, challenges, events, teams, user, types) over an Axios client (`src/lib/api-client.ts`) — `withCredentials: true`, Bearer token from response body, base URL from `VITE_API_URL`.
- **Components:** app shell, auth layout, challenge card + modal (flag submit, hints, file download), event card/nav/result, join-by-code, join-event button, require-auth guard, UI states, plus a full shadcn `ui/` set.
- **Lib/hooks:** auth store (Zustand), session/theme/event-access hooks, download/error/format utilities.
- **Design:** clean cybersecurity look, green accent `#15803D`, gray/white surfaces, dark mode toggle persisted in localStorage. No neon/matrix/glitch.

## Steps

1. **Link your GitHub connection** to this project (one approval card), then download the repo as an archive through it and extract into the project, overwriting the template.
2. **Drop non-portable files:** `src/routeTree.gen.ts` (regenerated automatically), `.lovable/`, lockfile conflicts, and the `logo.png.asset.json` placeholder (the real PNG isn't in the repo — I'll note that).
3. **Adapt to this project's template where required:**
   - Keep the template's `vite.config.ts`, `src/router.tsx`, `src/start.ts`, `src/server.ts`, and `tsconfig.json` if the repo's versions conflict with the Lovable runtime; merge only app-specific settings.
   - Add a `<Toaster />` (sonner) mount in `__root.tsx` if the repo expects it.
   - Ensure every route has its own `head()` metadata (title/description/og) — add where missing.
4. **Install any missing dependencies** from the repo's `package.json`.
5. **Configure the backend URL:** set `VITE_API_URL` so the app can reach your CTF backend. (Question below — if you don't have it handy, I'll wire the env var and use the value from the repo's `.env.example` as a placeholder so the UI still loads; API calls will just fail until you supply the real URL.)
6. **Verify:** build passes, all routes render (landing, login/register, dashboard redirect when logged out), dark mode toggle persists, and wrong-flag submission shows inline feedback (the API returns 201 `{status:'WRONG'}` — handled as feedback, not an error).

## What you'll need

- Your GitHub approval when the connect card appears.
- The backend base URL for `VITE_API_URL` (can be added later without code changes).

## Technical details

- Files copied: everything under `src/` (api, components, hooks, lib, routes, styles.css), `public/`, `package.json` deps, `components.json`, eslint/prettier configs.
- Not copied: `src/routeTree.gen.ts`, `bun.lock`, `.lovable/`, `.env.example` values (secrets stay out of the repo).
- No Lovable Cloud / Supabase involved — this app talks to your existing external backend.
