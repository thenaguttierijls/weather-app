# Weather App

A publicly-facing weather web app. Auto-detects location, shows current conditions, 5-day forecast, temperature trends, and recent-city quick access. Built as an exercise for JLS.

**Live:** https://weatherappsneasons.netlify.app/

## Stack

- React + Vite + TypeScript
- Tailwind CSS + Shadcn/UI
- Recharts for temperature trend
- Meteocons (`@bybas/weather-icons`) for weather icons
- Zustand for client state
- Vitest + Playwright for tests
- Open-Meteo API (no key required)
- Hosted on Netlify (auto-deploy on push to `main`)

## Run locally

```bash
npm install
npm run dev
```

Opens on `http://localhost:5173`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the built site locally |
| `npm run test` | Vitest unit + component tests |
| `npm run test:ui` | Vitest UI |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run lint` | ESLint |

## Deploy

Pushes to `main` auto-deploy via Netlify. Config lives in `netlify.toml`.

## Docs

- `PLAN.md` — implementation plan
- `PLAN.html` — same plan, interactive
- `CLAUDE.md` — AI collaborator instructions
