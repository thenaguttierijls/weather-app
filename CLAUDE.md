# Weather App — Claude instructions

Publicly-facing weather app. React + Vite + TS + Tailwind + Shadcn/UI. Open-Meteo API. Deployed on Netlify. Built as a JLS exercise.

## Stack

- **Runtime:** React 19, Vite, TypeScript 6
- **Styling:** Tailwind CSS + Shadcn/UI (class-strategy dark mode)
- **State:** Zustand (unit preference, theme, recent cities)
- **Charts:** Recharts v3
- **Weather icons:** Meteocons via `@bybas/weather-icons`
- **Toasts:** Sonner (via Shadcn wrapper)
- **Tests:** Vitest (unit + component) + Playwright (E2E)
- **API:** Open-Meteo (free, no key)
- **Deploy:** GitHub → Netlify (auto on push to `main`)

## Folder structure

See `PLAN.md` "Architecture" section for the target layout. Summary:

- `src/api/` — Open-Meteo + geocoding + shared types
- `src/components/hero/` — big-number weather hero
- `src/components/tiles/` — hourly, 5-day, chart, wind, sun, humidity, UV, precip
- `src/components/search/` — search overlay + bar + recents chips
- `src/components/states/` — Loading/Error/Empty
- `src/components/ui/` — Shadcn components (installed via CLI)
- `src/hooks/` — useTimezoneCity, useWeather, useGeolocation, useLocalStorage
- `src/stores/` — Zustand: unit, theme, recent cities
- `src/lib/` — logger, formatters, wmoCodes, validation, utils (`cn`)
- `src/test/` — Vitest setup + fixtures
- `tests/e2e/` — Playwright specs

## Path aliases

`@/*` maps to `src/*` in both TypeScript and Vite. Import from `@/components/...`, `@/lib/...`, `@/hooks/...`, etc.

## Green identity

- Primary color palette: `brand.50` (`#eaf3e6`) through `brand.900` (`#132510`). Defined in `tailwind.config.ts`.
- Hero uses a green gradient that shifts subtly with weather condition (all variants stay in the green family — mint → spruce).
- Shadcn CSS variables tie `--primary` to brand.500 (light) / brand.300 (dark).
- Dark mode uses the "lighter tiles" variant — tiles are lighter than the page background for readability.

## Conventions

- **TypeScript strict mode is on.** `verbatimModuleSyntax` + `erasableSyntaxOnly` are enabled — always use `import type { Foo }` for type-only imports. Shadcn's generated components sometimes need this.
- **No comments explaining "what."** Comments are for non-obvious "why" only.
- **Tests are comprehensive** (per brainstorm decision — every component, every hook, every util has a test).
- **Human voice in copy** — error messages, toast text, empty-state copy: read like a real person, not AI. No "leverage", "delve", "seamless", etc.
- **No secrets in client code.** Open-Meteo needs no key. If a future integration needs one, it goes through a backend proxy or Netlify serverless function.

## Tier 1 checklist status

Track in `PLAN.md` verification checklists. Anything intentionally skipped for v1 goes here:

- (none yet)

## Known non-blockers

- npm audit reports transitive dev-dep vulnerabilities. Static frontend, dev-only, low risk.
- TypeScript 6.x + `verbatimModuleSyntax` may bite anyone writing `import { Foo }` where `Foo` is a type. Use `import type`.

## Do NOT

- Do not add Firebase or a backend for v1. Persistence is `localStorage`.
- Do not add auth or accounts.
- Do not add stretch goals (map layer, email alerts) until core ships and Thena decides.
- Do not touch `PLAN.md`, `PLAN.html`, or `.superpowers/` without explicit ask.
