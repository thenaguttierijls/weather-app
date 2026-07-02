# Weather App — Implementation Plan

**Exercise:** Publicly-facing weather web app from Johnny (submitted 01/28/26).
**Author:** Thena
**Plan date:** 2026-07-01

---

## Purpose

Build and ship a public weather web app that meets the exercise requirements (core + polish), applies the JLS default tech stack, and satisfies the JLS Tier 1 mandatory-features checklist. Stretch goals are deferred until core is live.

## Non-Goals

- Stretch goals (map layer, email alerts). Explicitly out of scope for v1 — revisit after core ships.
- Auth, accounts, or per-user server state. App is anonymous.
- Server-side rendering or a backend service. Static frontend + third-party API only.

---

## Locked Decisions (from brainstorm)

| Area | Decision |
|---|---|
| **Frontend** | React + Vite + TypeScript |
| **Styling** | Tailwind CSS + Shadcn/UI |
| **Weather API** | Open-Meteo (free, no key, includes geocoding) |
| **Weather icons** | Meteocons (via `@bybas/weather-icons` or equivalent) |
| **Charts** | Recharts (React-native, Shadcn-friendly) |
| **Version control** | GitHub |
| **Hosting** | Netlify (auto-deploy on push to `main`) |
| **Persistence** | `localStorage` (recent cities, unit preference, theme) |
| **Testing** | Vitest (comprehensive unit + component) + Playwright (E2E happy paths) |
| **Aesthetic** | Apple-Weather-style green identity: hero gradient + tile grid |
| **Dark mode** | "Lighter tiles" variant (highest readability) |
| **Default city** | Timezone-based guess (no geo permission needed) |
| **Search UX** | Dismissable overlay on first load; reopens via search icon |
| **Recent cities** | LRU cache, max 5, `localStorage` |
| **Deploy split** | Claude does everything locally; Thena does the GitHub + Netlify browser clicks with a checklist |

---

## Architecture Overview

```
weather-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                    # React root
│   ├── App.tsx                     # Layout shell + providers
│   ├── index.css                   # Tailwind directives + CSS vars for theme
│   │
│   ├── api/
│   │   ├── openMeteo.ts            # Weather + forecast fetch, error mapping
│   │   ├── geocoding.ts            # City -> lat/lng, timezone lookup
│   │   └── types.ts                # Shared API response types
│   │
│   ├── components/
│   │   ├── ui/                     # Shadcn components (button, input, dialog, etc)
│   │   ├── hero/
│   │   │   ├── Hero.tsx            # Big temp + condition + high/low + gradient
│   │   │   └── gradient.ts         # Condition -> green-family gradient class
│   │   ├── tiles/
│   │   │   ├── HourlyTile.tsx
│   │   │   ├── ForecastTile.tsx    # 5-day rows with icon + range bar
│   │   │   ├── FeelsLikeTile.tsx
│   │   │   ├── TrendChartTile.tsx  # Recharts line chart
│   │   │   ├── WindTile.tsx        # Compass needle
│   │   │   ├── SunTile.tsx         # Sunrise/sunset arc
│   │   │   ├── HumidityTile.tsx
│   │   │   ├── UvTile.tsx
│   │   │   └── PrecipTile.tsx
│   │   ├── search/
│   │   │   ├── SearchOverlay.tsx   # Modal-style, dismissable
│   │   │   ├── SearchBar.tsx       # Debounced autocomplete
│   │   │   └── RecentCities.tsx    # Chip row
│   │   ├── states/
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx      # Reused for network/city-not-found
│   │   │   └── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx       # Tier 1: crash boundary
│   │   ├── Toast.tsx               # Tier 1: toast system (Shadcn Sonner)
│   │   ├── ThemeToggle.tsx
│   │   ├── UnitToggle.tsx          # °C/°F
│   │   └── WeatherIcon.tsx         # Meteocons wrapper by WMO code
│   │
│   ├── hooks/
│   │   ├── useGeolocation.ts       # Browser geo, gracefully returns null
│   │   ├── useTimezoneCity.ts      # Timezone -> default city fallback
│   │   ├── useWeather.ts           # Fetch + cache + refetch on city/units
│   │   └── useLocalStorage.ts      # Typed, SSR-safe wrapper
│   │
│   ├── stores/
│   │   ├── useUnitStore.ts         # Zustand or context — °C/°F global
│   │   ├── useThemeStore.ts        # Light/dark
│   │   └── useRecentCitiesStore.ts # LRU max 5
│   │
│   ├── lib/
│   │   ├── wmoCodes.ts             # Open-Meteo weather codes -> {label, icon}
│   │   ├── formatters.ts           # temp, wind, humidity, date formatters
│   │   ├── logger.ts               # Tier 1: structured logger (dev console, no-op prod)
│   │   └── validation.ts           # Tier 1: input validation for search
│   │
│   └── test/
│       ├── setup.ts                # Vitest + jsdom setup
│       └── fixtures/               # Mock Open-Meteo responses
│
├── tests/e2e/
│   ├── happy-path.spec.ts          # First load -> forecast -> search -> unit toggle
│   ├── error-states.spec.ts        # Network failure, city not found
│   └── a11y.spec.ts                # Keyboard nav sanity
│
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── netlify.toml                    # Build settings + SPA redirects
├── playwright.config.ts
├── vitest.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── package.json
├── README.md
└── CLAUDE.md                       # Project-scoped instructions for future sessions
```

**Data flow:**
1. On load: `useTimezoneCity` returns a default (e.g., `America/Chicago` → Chicago). In parallel, `SearchOverlay` opens, dismissable.
2. `useWeather(city, units)` fetches both current + 7-day forecast from Open-Meteo in one call (the API supports both in one request).
3. Response is cached in a React Query-lite pattern (or plain state + `sessionStorage` — decide during coding based on complexity).
4. Unit toggle re-formats client-side (Open-Meteo returns metric; conversion is trivial). No re-fetch needed.
5. Search hits geocoding endpoint → picks first result → sets city → refetches.

**Why this structure:**
- Each tile is a self-contained component with its own loading/error skeleton. Easy to test.
- Stores are tiny (unit, theme, recents). No global state library required — plain React context or Zustand if it grows.
- API layer is one file (`openMeteo.ts`) that's easy to mock in tests.

---

## Phase 0 — Foundation (Tier 1 mandatory, before any features)

Per JLS Tier 1 checklist, this must exist and be deployed *before* feature code.

### Steps

1. **Scaffold Vite React-TS project**
   `npm create vite@latest weather-app -- --template react-ts`
2. **Install deps:** Tailwind, Shadcn CLI, Recharts, `@bybas/weather-icons` (or Meteocons SVG set), `zustand` (if used), `sonner` (via Shadcn), Vitest, Playwright, ESLint, Prettier.
3. **Configure Tailwind + Shadcn**, initialize with dark-mode class strategy (`darkMode: 'class'`).
4. **Set up base tokens** in `tailwind.config.ts` for the green identity palette (light + dark scales).
5. **Write `.gitignore`** (Node + Vite defaults + `.env` + `.netlify` + IDE files).
6. **Write `.env.example`** — Open-Meteo needs no key, so it's basically empty, but the pattern must exist. If a stretch goal later needs a key, we're ready.
7. **Structured logger** (`src/lib/logger.ts`) — dev logs to console with a prefix + level; prod is a no-op. Small, ~30 lines.
8. **Toast system** — install Shadcn `sonner`, mount `<Toaster />` in App shell, wrap in a simple `useToast()` hook.
9. **Error boundary** — class component around the app root; renders friendly fallback + reload button. Logs to `logger.error`.
10. **Reusable state components** — `LoadingState`, `ErrorState`, `EmptyState` in `src/components/states/`. Each has variant props (small/full-page).
11. **Favicon** — a simple SVG green weather glyph in `public/favicon.svg`. Wired in `index.html`.
12. **`README.md`** — how to run, how to test, how to deploy. Keep it short and useful.
13. **`CLAUDE.md`** — project-scoped rules for future sessions (stack, key patterns, gotchas).
14. **Testing infrastructure**
    - Vitest config + jsdom environment.
    - Playwright config with one passing smoke test.
    - Add scripts: `test`, `test:watch`, `test:e2e`.
15. **Hello-world page** rendering something like "Weather app — under construction" with theme toggle already working.
16. **Netlify config** (`netlify.toml`): build command `npm run build`, publish dir `dist/`, SPA redirect for `/*` to `/index.html`.
17. **Local git init + first commit** — everything so far, on `main`.
18. **Hand off to Thena:** GitHub repo creation + Netlify connection.
19. **Verify hello-world is live** at the Netlify URL before writing any feature code.

### Verification (Phase 0)
- [ ] `npm run dev` opens hello-world in the browser.
- [ ] `npm run build` produces a working `dist/`.
- [ ] `npm run test` passes (at least the placeholder test).
- [ ] `npm run test:e2e` passes (at least the Playwright smoke).
- [ ] Dark mode toggle flips theme.
- [ ] Netlify auto-deploy fires on `git push`.
- [ ] Public URL loads the hello-world.

**Only after every box is checked do we move to Phase 1.**

---

## Phase 1 — Data + Default City

The point of this phase: get real weather data on screen for a real default city, with proper loading and error states. No polish, no tiles beyond the hero.

### Steps

1. **`api/openMeteo.ts`** — one function `getForecast({ lat, lng, timezone })` that hits Open-Meteo's `/v1/forecast` endpoint with the right params (current + hourly + daily + wind + UV + precipitation). Returns a typed response.
2. **`api/geocoding.ts`** — `searchCities(query)` and `getCityByName(name)` using Open-Meteo's geocoding API.
3. **`api/types.ts`** — TS types for the raw response and a "normalized" shape used by components.
4. **`lib/wmoCodes.ts`** — map WMO weather codes (0–99) to `{ label, iconKey, isRainy, isSnowy, isSunny, ... }`.
5. **`lib/formatters.ts`** — `formatTemp(n, unit)`, `formatWind(n, unit)`, `formatTime(iso, tz)`, etc.
6. **`hooks/useTimezoneCity.ts`** — read `Intl.DateTimeFormat().resolvedOptions().timeZone`, map to a curated `{ zone → { city, lat, lng } }` table (covers the top ~50 timezones; else falls back to Chicago).
7. **`hooks/useWeather.ts`** — takes `{ city, units }`, fetches on mount, exposes `{ data, loading, error, refetch }`.
8. **`components/hero/Hero.tsx`** — big temp, condition label, high/low. Uses `gradient.ts` to pick a green tint based on the current condition.
9. **`components/hero/gradient.ts`** — condition → Tailwind class name for the hero background gradient. All variants stay in the green family (mint→spruce range).
10. **Wire into `App.tsx`**: default city on load → `useWeather` → `<Hero />` renders. `<LoadingState />` while fetching, `<ErrorState />` on failure.
11. **Unit toggle stub** — `useUnitStore` (Zustand or context). Toggle flips value; `Hero` re-renders. Persist to `localStorage`.

### Verification (Phase 1)
- [ ] App loads with a real forecast for the timezone-guessed city.
- [ ] Unit toggle flips °C ↔ °F everywhere on the hero.
- [ ] Preference persists on reload.
- [ ] Killing the network shows the error state, not a crash.
- [ ] Weather-tinted green gradient shifts with condition (visually verified for sunny / rainy / cloudy).

---

## Phase 2 — Tile Grid

Every tile from the mockup. Each tile is small enough that one component + one test file covers it.

### Steps (one commit per tile)

1. **`HourlyTile`** — next 12 hours, horizontal scroll, temp + icon per hour.
2. **`ForecastTile`** — 5 days, icon + label + high/low range bar.
3. **`FeelsLikeTile`** — "feels like" + short explanation ("Wind chill drops it 4°").
4. **`TrendChartTile`** — Recharts line chart, 5-day daily highs + lows. Green line, soft grid.
5. **`WindTile`** — compass with a green needle pointing to wind direction, speed centered.
6. **`SunTile`** — sunrise/sunset arc with a sun dot at current position.
7. **`HumidityTile`** — big number + dew point line.
8. **`UvTile`** — big number + level label (Low/Moderate/High/Extreme).
9. **`PrecipTile`** — rain % today + total mm/in in last 24h.
10. **`components/WeatherIcon.tsx`** — takes a WMO code + variant (day/night) → renders Meteocons SVG.
11. **Layout** — CSS grid, responsive: 2 cols on mobile, 4 on desktop.

### Verification (Phase 2)
- [ ] Every tile renders with real data.
- [ ] Missing/optional fields (e.g., no UV at night) don't crash — tile shows an "—" or hides gracefully.
- [ ] Grid reflows cleanly at 375px, 768px, 1440px.
- [ ] Each tile has ≥1 Vitest test covering its render + a mocked-data variant.

---

## Phase 3 — Search + Recents

### Steps

1. **`SearchOverlay`** — Shadcn `Dialog`-based, dismissable via ESC / backdrop click / X button. Opens on first load (after data has started fetching in background). Reopens via a search icon in the header.
2. **`SearchBar`** — debounced (250ms) `useCombobox` pattern hitting geocoding API. Shows top 5 matches with country label.
3. **`RecentCities`** — chip row below the search bar. Each chip = `{ name, country }`. Click loads that city; small × removes it from the list.
4. **`stores/useRecentCitiesStore.ts`** — LRU, max 5, persisted to `localStorage`. Adding an existing city bumps it to front.
5. **Input validation** (`lib/validation.ts`) — reject empty, trim, cap at 100 chars, block obvious junk. Shows an `<EmptyState>` for "type to search."

### Verification (Phase 3)
- [ ] First-load flow: overlay appears, dismissable, default city loaded in background.
- [ ] Search picks a city → hero + tiles re-render.
- [ ] Recent cities chip appears, click loads it, × removes it.
- [ ] Max 5; the 6th push evicts the oldest.
- [ ] Preferences persist across reload.

---

## Phase 4 — Polish (accessibility, error UX, theme)

### Steps

1. **Dark mode toggle** — `ThemeToggle` component in header. `useThemeStore` writes `class="dark"` on `<html>`. Persist to `localStorage`.
2. **Verify dark palette** — matches the "lighter tiles" variant Thena approved.
3. **Keyboard navigation** — Tab order sane through header → hero → tiles → search. All interactive elements focusable. Visible focus rings using Tailwind `focus-visible:ring-*`.
4. **Aria labels** — icons have `aria-label`, chart has role + summary, toggles announce state.
5. **Error state polish** — city-not-found copy, network-failure copy, offline detection (`navigator.onLine`).
6. **Empty state polish** — search overlay with no query yet, first-time no-recents state.
7. **Loading skeleton** — each tile shows a shimmer instead of a spinner for a nicer perceived-perf feel.
8. **Toast usage** — "Copied city name" (?), "Location denied — using [city]", "Failed to fetch weather — retry?".
9. **Responsive audit** — check 320px, 375px, 768px, 1024px, 1440px in browser devtools.
10. **Meta tags** — `<title>`, `<meta description>`, Open Graph tags for shareable link previews.

### Verification (Phase 4)
- [ ] Fully keyboard-navigable, no mouse required.
- [ ] Screen reader spot-check (VoiceOver or NVDA on the hero + one tile + search).
- [ ] Every error path shows a human-worded message, not a raw error.
- [ ] Dark mode readable across all tiles.
- [ ] All viewport sizes look intentional.

---

## Phase 5 — Testing (comprehensive)

We chose the "bias-toward-more" testing scope, so this phase is real work — not a checkbox.

### Unit tests (Vitest)
- Every component in `components/` has a test file.
- Every hook has a test file with mocked API.
- Formatters have a table-driven test.
- WMO code map has a test asserting every code has a label + icon.
- Recent-cities LRU has tests for add, evict, dedupe-bumps-to-front, remove.
- Input validation has tests for empty, whitespace, length cap, injection-ish input.

### Integration tests (Vitest + jsdom)
- `useWeather` + mocked fetch: happy, network error, empty response, malformed response.
- `SearchOverlay` full interaction: open, type, pick, closes, city updates.

### E2E tests (Playwright)
- **Happy path:** load → hero renders → search "Paris" → forecast updates → toggle °F → dark mode → reload → state persists.
- **Error states:** simulate offline (`route.abort`), assert error copy. Assert city-not-found copy.
- **A11y sanity:** run `@axe-core/playwright` on landing + after-search states.

### Verification (Phase 5)
- [ ] `npm run test` — all pass, no `.skip`, no console errors.
- [ ] `npm run test:e2e` — all pass, deterministic (run 3× locally).
- [ ] Coverage report generated; note gaps in `CLAUDE.md`.

---

## Phase 6 — Ship

### Steps
1. **Merge to `main`** — Netlify auto-deploys.
2. **Smoke test the deployed URL** — happy path, dark mode, unit toggle, search, reload.
3. **Update README** with the live URL + a screenshot.
4. **Submit** — send the Netlify URL via Johnny's Google Form.

### Verification
- [ ] Public URL loads for a fresh incognito visit.
- [ ] Lighthouse scores captured (perf, a11y, best practices, SEO). Fix any red flags.
- [ ] No console errors in production build.

---

## Handoff Checklist for Thena (browser clicks)

I can't do these — they need your login. I'll ping you when Phase 0 is code-complete, and you'll do this once:

1. **GitHub**
   - Create a new public repo, e.g. `weather-app` (or a name you prefer).
   - Empty is fine — no README, no gitignore, no license.
   - Copy the SSH or HTTPS URL.
2. **Local git**
   - I'll walk you through: `git remote add origin <url>` and `git push -u origin main`.
3. **Netlify**
   - Log in, "Add new site" → "Import an existing project" → GitHub → pick the repo.
   - Build settings should auto-detect from `netlify.toml`. Confirm.
   - Deploy. Netlify assigns a `<something>.netlify.app` URL.
4. **Send me the URL** — I'll put it in the README and verify the hello-world is live.

Everything after that (feature commits, redeploys) happens automatically on `git push`.

---

## Risks & Assumptions

- **Open-Meteo uptime** — free service with no SLA. Assumed reliable based on public status; if it flakes during Phase 6, we cache last-good in `localStorage` as a graceful fallback.
- **Timezone → city map coverage** — my curated table won't cover every timezone. Fallback: Chicago. Trade-off is acceptable for v1; can add zip code lookup later.
- **Meteocons packaging** — the community bundles vary in quality. If `@bybas/weather-icons` doesn't play nice with Vite, fallback to raw SVGs from the Meteocons GitHub release (a one-time copy into `public/icons/`).
- **Recharts bundle size** — ~60KB gzipped. Fine for one-chart usage; if we grow charts, revisit.
- **Netlify free tier** — 100GB bandwidth/mo, 300 build min/mo. Way more than needed for a personal project.

---

## Open Questions (park until they matter)

- Stretch goals: revisit after core ships. My pre-recommendation: map layer (Leaflet + Open-Meteo tile) is the highest ROI stretch — one day of work, visually impressive, no backend. Email alerts add real infrastructure and I'd skip unless you want to demonstrate Firebase specifically.
- Domain: use the Netlify subdomain, or point a custom domain? Not needed for submission; can add later.

---

## Success Criteria

- [ ] Every core requirement from the exercise met.
- [ ] Every polish requirement from the exercise met.
- [ ] Tier 1 JLS checklist ticked off (or intentional skips documented in `CLAUDE.md`).
- [ ] Comprehensive test coverage (Vitest unit + Playwright E2E).
- [ ] Public Netlify URL loads fast, looks intentional, works on mobile + desktop.
- [ ] Submitted to Johnny via the Google Form.
