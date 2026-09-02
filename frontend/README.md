# CTF Nexus

Build a full CTF (Capture The Flag) platform frontend with React + TypeScript + Vite.

I am attaching 3 files — read them carefully before writing any code:

1. openapi.json — the backend API spec. This is the source of truth for all endpoints, request/response schemas, and auth requirements. Never invent endpoints not defined there.

2. schema.prisma — the database schema for context on data relationships.

3. frontendPrompt.md — the complete project spec covering features, pages, auth flows, roles/permissions, design direction, and architecture rules. Follow it exactly.

Key requirements summary:

Tech stack: React, TypeScript, Vite, React Router, Zustand (auth state), TanStack Query (server state), Axios (all requests with withCredentials: true, Bearer token from response body). Base URL from VITE_API_URL env var.

Pages: Landing, Login, Register, Dashboard, Browse Events, My Events, Event Details, Event Management, Teams, Team Details, Challenges (with modal for flag submission), Leaderboard, User Profile, Google link confirmation page, Password reset flow.

Auth flow: Register → OTP email verify → login. 401 interceptor auto-refreshes via POST /auth/refresh (httpOnly cookie). Google OAuth via full-page redirect (window.location.href), not fetch.

Event join flow: Public events join directly via POST /event-member/{eventId}/join. Private events require { inviteCode } in the body. Show a "Join with Code" input on Event Details for private events.

Challenge UX: List shows cards with title/difficulty/points/category/solved. Clicking opens a modal (no extra API call — use list data). Modal has description, flag input + submit, and clickable file download link if hasFile is true. Wrong flag returns 201 { status: 'WRONG' } — handle it as user feedback, not an error.

Design: Clean cybersecurity aesthetic. Green accent (#15803D), gray/white surfaces. Dark mode toggle persisted in localStorage. Avoid neon/matrix/glitch effects. Modern cards, spacious layout, clear typography.

Important: Do not mock any API. Every endpoint exists in openapi.json. Follow the exact role-based permission rules from frontendPrompt.md.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b842a78b-699f-4f7f-9cea-82ded021e4b7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
