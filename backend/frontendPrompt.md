# CTF Platform — Project Context

I am building a modern full-stack **Capture The Flag (CTF) platform**.

The platform allows users to register, participate in CTF events, create/join teams, solve cybersecurity challenges by submitting flags, earn points, and compete on leaderboards.

The project should feel like a **real, professional CTF platform**, not a generic CRUD dashboard.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Zustand
- TanStack Query
- Axios

### Backend

- NestJS
- Prisma
- PostgreSQL
- Supabase
- Passport.js
- JWT
- bcrypt

The frontend communicates **only with the NestJS REST API**.

Do not access Prisma, PostgreSQL, or Supabase directly from the frontend.

The provided `openapi.json` is the **source of truth for the backend API**. Use it to determine available endpoints, request formats, parameters, authentication requirements, and response schemas. **Do not invent endpoints or fields that are not defined there.**

The provided `schema.prisma` describes the application's database structure and relationships and can be used as additional context.

---

## Core Features

Users can:

- Register and log in
- Browse CTF events
- Create and manage events
- Join events
- Create and join teams
- Have team roles such as `CAPTAIN` and `MEMBER`
- Browse challenges
- View challenge details (from the list — single-challenge endpoint is owner/admin-only)
- Download challenge files
- Submit flags
- Solve challenges
- Earn points
- View event leaderboards
- Manage their profile

### Joining Events

Users can join an event through two endpoints:

1. **`POST /event-member/{eventId}/join`** — join by event id only: public events join directly; private events are rejected with `400` ("Cannot join a private event without an invite code"). Returns the membership with the `eventId`.
2. **`POST /event-member/join-by-code`** — join with body `{ "inviteCode": "..." }`. Resolves the event from its unique invite code, handles both public and private events, and returns the membership whose `eventId` can be used to navigate to the event page. `404` if the code is unknown, `409` if already a member, `400` if the event ended.

The invite code is shown on the Event Details / Event Management page with a **Copy** button. Owners can regenerate it via `POST /events/{eventId}/invite-code`.

---

## Roles & Permissions

Two role systems drive what a user can see and do:

- **Event roles**: `OWNER` (the creator), `ADMIN` (promoted by the owner), `MEMBER` (joined).
- **Team roles**: `CAPTAIN` (team creator), `MEMBER`.

### Participant flow

- Browse events (`GET /events`, public events only) → join (`POST /event-member/{eventId}/join`). Private events are joined with an invite code via `POST /event-member/join-by-code` with `{ inviteCode }` — the browse list and the event detail page are not reachable for non-members of private events, so offer a standalone "Join with code" entry point.
- In an event: create a team (`POST /events/{eventId}/teams` with `{ name, teamPassword }`) or join an existing one (`POST /events/{eventId}/teams/{teamId}/join` with `{ password }`), browse challenges (`GET /events/{eventId}/challenges?teamId={yourTeamId}`), open a challenge (render it from the list response — the single-challenge endpoint is owner/admin-only), download its file, and submit flags (`POST /events/{eventId}/challenges/{challengeId}/submit`).

### Owner / Admin flow

`GET /events/owned` returns events the user **owns**; `GET /events/joined` returns every event the user belongs to (any role — owned or joined). For each owned event provide a **Manage** entry that opens a management screen:

- **Event** (owner + admin): edit the event (`PATCH /events/{eventId}` — note: `endDate` must be at least 30 minutes after `startDate`), view members (`GET /event-member/{eventId}/members`). Any event member: view stats (`GET /events/stats/{eventId}` returning `{ memberCount, teamCount, challengeCount, solveCount }`). Owner-only: delete the event (`DELETE /events/{eventId}`), promote/remove admins (`POST /event-member/admins`, `DELETE /event-member/admins`). The event's **invite code** is shown here with a **Copy** button; owners can regenerate it (`POST /events/{eventId}/invite-code`).
- **Challenges** (owner + admin): buttons to **create** (`POST /events/{eventId}/challenges`), **edit** (`PATCH /events/{eventId}/challenges/{challengeId}`), **delete** (`DELETE /events/{eventId}/challenges/{challengeId}`), and view **stats** (`GET /events/{eventId}/challenges/{challengeId}/stats`). These are `multipart/form-data` requests (title, description, flag, category, difficulty, points, and an optional file). Editing must not force a file re-upload.
- **Teams**: join an existing team (`POST /events/{eventId}/teams/{teamId}/join` with `{ password }`), create a team (`POST /events/{eventId}/teams` with `{ name, teamPassword }`). The current user's team for an event can be fetched via `GET /events/{eventId}/teams/me`. Captain: edit the team (`PATCH /events/{eventId}/teams/{teamId}`), delete it (`DELETE /events/{eventId}/teams/{teamId}`), kick members (`DELETE /events/{eventId}/teams/{teamId}/members/{userId}`). Any member can leave (`DELETE /events/{eventId}/teams/{teamId}/leave`).

Owner/admin challenge-list calls omit `teamId`; everyone else must pass their own `teamId`.

---

## Challenge UX

- The **Challenges list page** shows a card/row per challenge with only: `title`, `difficulty`, `points`, `category` (plus the solved state). Do **not** auto-download or render challenge files on this page.
- Clicking a challenge opens a **modal** populated from the already-loaded list response — no extra API call:
  - Full `description`
  - A flag input field + **Submit** button calling `POST /events/{eventId}/challenges/{challengeId}/submit`; show the API result (`status: 'WRONG'` → "Wrong flag", `status: 'CORRECT'` → "Solved!")
  - If `hasFile` is true, show `fileName` as a blue, clickable link — the file downloads from `fileUrl` **only** when the user clicks it.

---

## Supabase

Supabase PostgreSQL stores structured application data through Prisma.

Supabase Storage is used separately for challenge file attachments.

```text
Frontend
   ↓
NestJS API
   ↓
Prisma
   ↓
Supabase PostgreSQL

Challenge files:
NestJS → Supabase Storage
```

Redis is **not currently part of the application** and should not be assumed.

---

# 📄 Main Pages

Keep the page structure focused and practical.

### Public

- Landing / Home
- Login
- Register
- Event Details

### Authenticated

- Dashboard
- Browse Events
- Events
- Event Details
- Teams
- Team Details
- Challenges
- Challenge modal (opened from the list — no separate detail page for participants)
- Leaderboard
- User Profile
- My Events (owned, with a Manage entry per event)
- Event Management
- Challenge Editor (create / edit)

Important UI states should include:

- Loading
- Empty states
- Errors
- Success feedback
- Confirmation dialogs where appropriate

---

# 🎨 Design Direction

Create a **modern, clean cybersecurity / CTF aesthetic**.

You have **creative freedom** over the final design — the guidance below is directional inspiration, not a strict spec. A polished, cohesive result is more important than matching it exactly.

The UI should feel technical and competitive while still being professional and easy to use.

Prefer:

- Clean layouts
- Strong visual hierarchy
- Spacious UI
- Subtle borders
- Modern cards
- Clear typography
- Minimal but meaningful animations
- Green as the main accent
- Gray / white surfaces
- Dark green details where appropriate

Avoid excessive:

- Neon
- Matrix effects
- Glitch effects
- Fake terminal interfaces
- Heavy animations
- Visual clutter

The design should prioritize **readability and usability over visual effects**.

### Optional Color Inspiration

This palette is **only inspiration, not a strict requirement**. Feel free to adjust it if needed to create a better and more cohesive UI.

| Role                 | HEX       |
| -------------------- | --------- |
| Main background      | `#E8ECE9` |
| Secondary background | `#DFE5E1` |
| Card / Surface       | `#F8FAF8` |
| Elevated Surface     | `#D5DDD8` |
| Border               | `#C2CCC5` |
| Primary Green        | `#15803D` |
| Primary Hover        | `#166534` |
| Light Green          | `#D1F2DC` |
| Dark Green           | `#14532D` |
| Main Text            | `#101512` |
| Secondary Text       | `#455049` |
| Muted Text           | `#68736C` |

You may use lighter/darker variations where necessary for accessibility, contrast, hover states, warnings, errors, and other semantic states.

### Dark Mode

Include a **dark mode toggle** (ON/OFF). Persist the preference in `localStorage` (e.g. a `theme` key), apply it before first paint to avoid a flash, and let the user switch at any time. Provide a coherent dark theme (dark surfaces, adjusted text and accent colors) alongside the light palette above.

---

# 🧠 Frontend Architecture

Use:

- **TanStack Query** for API/server state
- **Zustand** for client-side state such as authentication/session state
- **React Router** for navigation
- Reusable components and API services
- Responsive design for desktop, tablet, and mobile

Keep API communication organized rather than placing request logic directly inside UI components.

Build the frontend around the existing backend API defined in `openapi.json`.

## Authentication & Cookies

### How to call the API (hosted)

The backend base URL comes from an env var (e.g. `VITE_API_URL`) — do not hardcode `localhost`. Send **every request to the backend with credentials**: Axios `withCredentials: true` (or `fetch` `credentials: 'include'`). That is the only cookie-related requirement — cookies are httpOnly and are attached/sent by the browser automatically, so never read cookies from JS and never store the refresh token yourself. Keep the `access_token` (returned in response bodies) and send it as `Authorization: Bearer <access_token>` on protected calls. CORS is enabled on the backend for the frontend origin, so no other client-side configuration is needed.

### Auth orchestration

1. `POST /auth/register` (email, username, password) → sends an OTP email.
2. `POST /auth/verify-email` (email, code) → sets the `refresh_token` cookie, returns `{ access_token, user }`.
3. `POST /auth/login` (email, password) → same response shape. (Missed/expired code? `POST /auth/resend-otp`.)
4. On any **401**, call `POST /auth/refresh` (cookie auto-attached) → new `access_token` + rotated cookie; retry the failed request once. If refresh fails, redirect to login. Use an Axios interceptor for this.
5. `POST /auth/logout` → clears the `refresh_token` cookie; redirect to login.

### Google OAuth

- `GET /auth/google/login` must be a **full-page navigation** (`window.location.href`), not a fetch/XHR — it redirects to Google. The callback redirects back to the frontend URL configured in `FRONTEND_URL`:
  - Normal login → `/?token=<access_token>`: read `token` from the URL query, store it, and route to the dashboard.
  - Account with that email already exists → `/google/link-confirmation` page (and the backend sets the `google_link_token` cookie): show a confirm prompt, then `POST /auth/google/link` (cookie auto-attached) → returns `{ access_token, user }`.

### Linking Google ↔ password accounts (both directions)

- **Google-only account → add a password** (so it can also log in with email/password): call `POST /auth/set-password` (Bearer token required, body `{ newPassword }`). Only works while the account has no password. After success both login methods work.
- **Password account → add Google sign-in**: navigate to `GET /auth/google/login`; the callback detects the existing email and redirects to the link-confirmation page; confirm with `POST /auth/google/link`. After success both login methods work.
- **Passwords can only be set through these flows** — registering with an email that already belongs to a Google account fails; never build a separate "link with password" path.

### Password reset

`POST /auth/forgot-password` (email) → `POST /auth/verify-reset-otp` (email, code; sets the `reset_token` cookie) → `POST /auth/reset-password` (`newPassword`; reads the `reset_token` cookie). On success redirect to login.

## API Notes

- **Auth orchestration**: register → `verify-email` (OTP) → login (full sequence in "Authentication & Cookies" above). `access_token` arrives in the response body; refresh/auth cookies are attached automatically because every request is sent with credentials.
- **Error handling**: wrap API calls in `try/catch`. The backend always responds with a status code and an error `message` — display that backend message to the user directly instead of inventing your own error text.
- **Response semantics**:
  - Submitting a wrong flag returns `201` with `{ status: 'WRONG' }` — that is a success response, not an error.
  - `GET /events` (browse) returns public events only; private events are joined by invite code via `POST /event-member/join-by-code`.
  - `GET /events/owned` returns events the user _owns_, not every event they joined.
  - `GET /events/joined` returns every event the user belongs to (owned or joined, any role).
  - `GET /events/{eventId}/challenges` requires `?teamId=` for non-admin users (each challenge includes `solved: true/false`); event owners/admins may omit it.
  - `GET /events/{eventId}/challenges/{challengeId}` is owner/admin-only — participants should render challenge details from the list response.
  - `GET /user/profile` returns `{ id, email, username, googleId, hasPassword }`. `PATCH /user/profile` returns `{ id, email, username, googleId, updatedAt }` (no `hasPassword`).
  - Only 200/201 success schemas are documented in `openapi.json`; error responses are not enumerated there.

## Important

Do not create fake backend data or mock API endpoints when a real endpoint exists in the OpenAPI specification.

Use the actual API contracts and database relationships provided in the supplied files.
