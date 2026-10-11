# Homepage visual additions: scroll cue + live telemetry bar

Two additions to the landing page (`src/routes/index.tsx` + `src/styles.css`). No API, routing, auth, or data changes. Both respect `prefers-reduced-motion` and keep the existing palette (green #15803D accents on the light theme).

## 1. Hero scroll cue

The hero fills the whole first viewport, so visitors don't know content exists below.

- Add a centered indicator at the bottom edge of the hero, inside the existing hero section (absolute, `bottom-6`, centered).
- Style: small monospace label `[ SCROLL ]` with a down chevron, low opacity, in muted foreground color.
- Motion: gentle vertical bob (translateY 0 → 4px, ~2s ease-in-out infinite). No bounce exaggeration.
- Behavior: clicking it smooth-scrolls to `#try-a-challenge` (the section directly below the hero).
- Hidden under `prefers-reduced-motion` animation is disabled; the cue itself stays as a static link.

## 2. Live activity telemetry bar

A thin terminal-style strip that reinforces the "live competition platform" feel, placed directly under the hero (between hero and the "Try a challenge" section), full-bleed like the hero.

- Visual: a single-row bar, `bg-card` with `border-y border-border`, monospace text, small height (~40px).
- Content: a horizontally scrolling ticker of short system-style lines, e.g.:
  - `[+] team "nullbytes" captured WEB-102 · +350 pts`
  - `[*] event "Winter CTF" · 14 teams competing`
  - `[>] first blood on CRYPTO-201 · +500 pts`
- Data source: pulled from the existing events API data already fetched elsewhere (event titles, team counts) where available; otherwise a small set of generic status lines (`[*] scoreboard synced`, `[+] flag verified`). No new endpoints, no fake statistics presented as real metrics — lines are clearly activity flavor, not numbers we claim.
- Motion: slow continuous marquee (CSS keyframes, ~30s loop), pauses on hover. Duplicated content for a seamless loop.
- Falls back gracefully: if the events request fails or returns nothing, the bar shows the generic status lines only.

## Technical details

- `src/routes/index.tsx`: add scroll cue markup inside the hero section; add a `TelemetryBar` component rendered between hero and `#try-a-challenge`.
- New small component `src/components/telemetry-bar.tsx` for the ticker (keeps index.tsx readable).
- `src/styles.css`: keyframes `scroll-cue-bob` and `ticker-scroll`, plus `prefers-reduced-motion` rules.
- Reuses existing `eventsApi.browse` query cache (same queryKey) — no extra network request.
- Colors: muted foreground text, primary green only for the `[+]` / `[*]` symbols.
- Responsive: ticker works at all widths; scroll cue hidden on very short viewports (`max-h` guard not needed — absolute positioning only).

## Verification

- Build log check, then Playwright: hero still fills first viewport, cue visible at bottom, ticker animates below hero, no layout shift or overflow on desktop and mobile widths.
