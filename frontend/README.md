# Cyber Nexus Rebuilt

Rebuild the "CTF Nexus" app from the user's existing GitHub repo (louayrougui1/holo-ctf, branch main — a React + TypeScript + Vite CTF platform originally built with Lovable). Recreate it faithfully with the same stack and features: React 19 + Vite + Tailwind v4 + Radix UI + TanStack Router/Query + Zustand + Axios (all requests with withCredentials: true, Bearer token from response body, base URL from VITE_API_URL env var). Pages: Landing, Login, Register, Dashboard, Browse Events, My Events, Event Details, Event Management, Teams, Team Details, Challenges (with modal for flag submission), Leaderboard, User Profile, Google link confirmation page, Password reset flow. Auth flow: register → OTP email verification → login; 401 interceptor auto-refreshes via POST /auth/refresh (httpOnly cookie). Event join: public events join directly via POST /event-member/{eventId}/join; private events require { inviteCode } in body — show a "Join with Code" input on Event Details for private events. Challenges UI: cards with title/difficulty/points/category/solved; clicking opens a modal (no extra API call — use list data) with description, flag input + submit, and clickable file download link when hasFile is true. Wrong flag returns 201 { status: 'WRONG' } — handle as user feedback, not an error. Design: clean cybersecurity aesthetic, green accent (#15803D), gray/white surfaces, dark mode toggle persisted in localStorage, no neon/matrix/glitch effects, modern cards, spacious layout, clear typography. Structure code as src/api/*, src/components/*, src/pages/* matching a typical TanStack Router layout.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e3c16567-762e-440c-8e07-8283df41a910).

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
