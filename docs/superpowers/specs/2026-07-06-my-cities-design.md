# My Cities — Design Spec

**Feature:** Add a "My Cities" list view — an Apple Weather-style dashboard of saved cities with per-card current temp, condition, and high/low.
**Author:** Thena (design), Claude (spec)
**Date:** 2026-07-06
**Status:** Approved — ready for implementation planning

---

## Purpose

Today the app shows weather for one city at a time. You can search + tap to switch. That's fine for casual use but doesn't support the "check my home + travel destinations at a glance" use case.

My Cities adds a list view that shows every saved city as a card. Tap a card to drill into the full detail view. Add cities via search. Delete with undo. Sort by recency, alphabetical, or temperature.

## Non-Goals (v1)

- Drag-to-reorder cities. (Deferred — value uncertain, cost is a drag library + touch handles + keyboard a11y.)
- URL routing. Two-view SPA is state-driven. Shareable city URLs can be added later as a self-contained upgrade.
- Server sync of saved cities. Everything persists to `localStorage` — anonymous, per-browser.
- Weather alerts on saved cities. Not a v1 feature.
- Max 15 cities. Reasonable ceiling to keep `localStorage` tidy. Apple caps at 24; we don't need that many.

## Locked Design Decisions

| Question | Answer | Why |
|---|---|---|
| Use case | Serious tracker (many cities, sort, delete) | Matches Thena's mental model |
| Add flow | Automatic — search + tap adds | Least surprise vs. current recents behavior |
| Landing view | Detail view (unchanged); "Cities" button in header opens list | Preserves current fast-check flow |
| Card content | Apple Weather full-width row | Best information density without clutter |
| Geo-detected city | Auto-added as first, pinned with location icon, undeletable | Apple pattern; unifies with recents cleanly |
| Sort control | Dropdown at top: Recently added / Alphabetical / Temperature | Real dashboards need sort; sort-by-temp is genuinely useful |
| Delete UX | X on card + 5s undo toast | Simpler than confirm dialog; covers accidents |
| Fetch strategy | Cache-first via Phase 4 `weather-app:last-forecast`; background refresh if >15 min stale | Instant renders, no wasted requests |
| Implementation | Conditional render in `App.tsx` driven by `useViewStore` | Zero new deps; two-view SPA doesn't need routing |

## User-Facing Behavior

### Detail view (unchanged)
Hero + tile grid for the currently-selected city. Header has: title, Cities button (new), Search, Unit toggle, Theme toggle, offline indicator (when offline).

### List view (new)
- Full-width vertical stack of `<CityCard>`s inside the same `<main>` container.
- Sort dropdown at the top of the list.
- Each card is a full-width row:
  - **Left:** City name (bold), local time (small, muted), condition text (small).
  - **Right:** Big temperature, small weather icon, high/low (small).
  - **Small X** in the top-right corner of the card (except for pinned geo city).
  - **Pin icon** replaces the X on the geo card.
- Tapping the card (except on the X) → switches to detail view for that city.
- Tapping X → optimistic remove + Sonner toast `"Removed <city>."` with an **Undo** button (5s auto-dismiss).
- Undo → re-inserts at original position.
- Empty state: only appears if the user deletes the geo card *and* has no other cities (rare — geo is undeletable, so only reachable if geo unavailable AND user deletes all searched cities). Copy: "No cities yet — search to add one."

### Header "Cities" button
- New icon-only button (lucide `LayoutList` or similar), placed left of the search icon.
- Aria-label toggles between "Show cities list" and "Show weather detail" based on current view.
- Click → flips `useViewStore.view`.

### Search overlay behavior update
- Tapping a search result now:
  1. Adds the city to `useCitiesStore` if not already present.
  2. Sets `useSelectedCityStore.setCity(...)`.
  3. Closes the overlay.
  4. Leaves view state alone (if you were on detail, you stay on detail; if you were on cities, you stay on cities but the new city is now in the list).
- Recent cities chip row inside the overlay is removed. The overlay is now a pure search box + results.

## Architecture

Two-view SPA. `useViewStore` decides which subtree `App.tsx` renders. No routing.

```
<App>
  <Header /> (always visible: title + Cities button + Search + Unit + Theme + optional offline indicator)
  {view === 'detail' && <DetailView />}   // Hero + tile grid — unchanged
  {view === 'cities' && <CitiesList />}   // new
  <SearchOverlay />                        // unchanged shell; behavior updated
  <Toaster />
</App>
```

The `StaleBanner` (from Phase 4) continues to render at the top of `<main>` when `useWeather` is serving stale detail data. It does not appear in cities list mode (per-card offline dot handles it there).

## Data Model

### `useCitiesStore` (replaces `useRecentCitiesStore`)

```ts
type SavedCity = {
  id: string             // stable, deterministic — see "id derivation" below
  name: string
  country: string
  lat: number
  lng: number
  timezone: string
  addedAt: string        // ISO — used for "Recently added" sort
  isPinned: boolean      // geo card only
}

interface CitiesState {
  cities: SavedCity[]        // pinned first, then insertion order
  sortMode: 'recent' | 'alpha' | 'temp'
  add(city: Omit<SavedCity, 'id' | 'addedAt' | 'isPinned'>, opts?: { pinned?: boolean }): void
  remove(id: string): SavedCity | null  // returns removed for undo
  restore(city: SavedCity, atIndex: number): void
  setSort(mode: 'recent' | 'alpha' | 'temp'): void
  hasByCoords(lat: number, lng: number): boolean  // for de-dupe on add
}
```

**Persistence:** Zustand `persist` middleware under key `weather-app:cities`.

**Storage shape:** `{ cities: SavedCity[], sortMode: string }`. `sortMode` persists so returning users get their preferred sort.

**id derivation:** `${lat.toFixed(3)}_${lng.toFixed(3)}`. Same rounding as the forecast cache key — natural dedupe. Not a UUID; that would defeat "same city, no dupe."

**Cap:** 15 total (including pinned). If a 16th is added via search, evict the oldest non-pinned entry.

**Pinned entry semantics:** At most one `isPinned: true`. A `useEffect` in `App.tsx` runs on every mount and is guarded by three conditions: (a) `geo.status === 'ready'`, (b) `geo.city != null`, and (c) no `isPinned` entry currently exists in the store. So the geo card gets auto-added the first time geo resolves and never again — idempotent across boots. If the user never grants geo, no pinned entry exists and the list starts empty.

### `useViewStore`

```ts
type View = 'detail' | 'cities'
interface ViewState {
  view: View
  setView(v: View): void
  toggle(): void
}
```

**Persistence:** none. Reload resets to `'detail'` — that's fine; you check the current forecast first, then decide to look at your list.

### `useSelectedCityStore` (unchanged)

Still holds the city the detail view is showing. Populated by search+tap OR card-tap.

### Forecast cache (unchanged)

Phase 4's `weather-app:last-forecast` (LRU-5, keyed by rounded coords). Bump cap to **15** to match cities cap so no card ever fails to cache.

## Data Flow

### Boot
1. `useCitiesStore` rehydrates from `localStorage`.
2. `useGeolocation` runs its usual flow (cached / prompt / etc).
3. When geo resolves AND `useCitiesStore.cities` is empty (or contains no pinned entry), auto-`add(geoCity, { pinned: true })`. This runs once per unique geo result.
4. Detail view renders using existing `useTimezoneCity ?? geo ?? recents[0] ?? selected` precedence — but `recents[0]` is replaced by `useCitiesStore.cities[0]` (the pinned geo entry, in practice).

### User taps "Cities" in header
1. `useViewStore.toggle()` flips `view` to `'cities'`.
2. `App.tsx` re-renders → `<CitiesList>` mounts.
3. `<CitiesList>` reads `cities` + `sortMode` from store, sorts, renders `<CityCard>` per entry.
4. Each `<CityCard>` mounts `useCityWeather(city)`:
   - Reads `weather-app:last-forecast` for this coords key. If present, returns `{ data, isStale, staleSince }` immediately.
   - If `!data` or `staleSince > 15 min ago`, fires a fetch. Sets `refreshing: true` while in flight.
   - On success, updates cache entry, returns fresh data.
   - On failure with cached data, keeps cached data + sets `isStale: true`. No error thrown to the card.
   - On failure with no cached data, returns `{ data: null, error: string }`.

### User taps a card (not the X)
1. `useSelectedCityStore.setCity(card.city)`.
2. `useViewStore.setView('detail')`.
3. Detail view swaps in for that city. Existing `useWeather` picks it up.

### User taps X on a card
1. `useCitiesStore.remove(id)` (returns the removed entry).
2. Sonner toast: `Removed ${city.name}.` with an `Undo` action button. 5s duration.
3. If Undo clicked before dismiss: `useCitiesStore.restore(removed, originalIndex)`.

### User changes sort dropdown
1. `useCitiesStore.setSort(mode)`.
2. `<CitiesList>` re-derives sorted list. Pinned card stays at index 0 regardless of sort mode.
3. Preference persists across reload.

### Sort semantics
- `recent`: sort by `addedAt` desc, pinned first.
- `alpha`: sort by `name` asc, pinned first.
- `temp`: sort by current temp (from `useCityWeather` cache) desc, pinned first. Cards with no data yet sort last within their group; ties broken by name.

## Error Handling

| Failure | Behavior |
|---|---|
| `useCityWeather` fetch fails with cached data | Card renders cached data + subtle stale/offline dot; no error UI |
| `useCityWeather` fetch fails, no cache | Card shows city name + "—" for temp + tiny "Couldn't load" text; other cards unaffected |
| Offline detected | Cards use cached data (already the behavior); optional: small offline indicator per stale card |
| `localStorage` write fails (quota, private mode) | `logger.warn`; cities persist for the session only; app keeps working |
| `localStorage` read returns malformed JSON | `logger.warn`; treat as empty store; re-hydrate from geo if possible |
| User adds a city already in the list | No-op via `hasByCoords`; toast: `${city.name} is already in your list.` |
| User hits the 15 cap | Evict the oldest non-pinned entry; toast: `Reached the 15-city limit — replaced <oldest>.` |
| Geo denied AND cities list empty | Empty state renders. User uses search to add. |

## Edge Cases

- **Same city, two sources (geo + search):** `hasByCoords` uses `toFixed(3)` matching — a search for the geo city coordinates dedupes. If a search resolves to slightly different coords (e.g. `13.361` vs `13.362`), same slot still hits. If they're far enough apart to be different keys, both stick — acceptable.
- **Deleting the pinned geo card:** blocked at the store level. `remove(id)` returns `null` if the target `isPinned`. The X button doesn't render on pinned cards, so the code path shouldn't fire — the store-level guard is defense in depth.
- **Geo changes after boot (user travels):** we don't detect this. The pinned city is set once. If someone wants to update their pinned city, they'd need to delete it (not possible in v1) or clear localStorage. Acceptable for v1.
- **User is on the cities list when a card's fetch fails and their offline status changes:** existing `useOnline` from Phase 4 handles global online/offline; per-card offline dot is a UI hint, not a separate hook.

## Testing Plan

### New tests

**Stores:**
- `useCitiesStore.test.ts` (~12 tests):
  - initial state empty
  - `add` inserts at end (non-pinned)
  - `add` with `pinned: true` inserts at index 0
  - `add` dedupes via `hasByCoords`
  - `add` hitting cap evicts oldest non-pinned
  - `remove` returns removed entry
  - `remove` on pinned returns null
  - `restore` re-inserts at index
  - `setSort` persists
  - persistence roundtrip
  - alpha sort correctness
  - recent sort correctness

- `useViewStore.test.ts` (~3 tests): initial 'detail', setView, toggle.

**Hooks:**
- `useCityWeather.test.tsx` (~7 tests):
  - cache hit → instant data
  - cache miss → loading → data → cache written
  - stale (>15 min) → data instantly + background fetch → refresh
  - fetch fails with cache → data + isStale = true, no error
  - fetch fails no cache → error
  - abort on unmount
  - city change refetches

**Components:**
- `CityCard.test.tsx` (~6 tests):
  - renders city, local time, condition, temp, icon, high/low
  - X renders only when not pinned
  - pin icon renders when pinned
  - click card triggers switch (mock `useSelectedCityStore` + `useViewStore`)
  - click X removes + fires toast
  - offline dot renders when isStale

- `SortDropdown.test.tsx` (~3 tests): options render, change triggers store update, current mode reflected.

- `CitiesList.test.tsx` (~5 tests):
  - renders one card per city
  - pinned card at index 0
  - respects sort mode
  - empty state renders when no cities
  - sort dropdown wired

- `HeaderCitiesButton.test.tsx` (~2 tests): renders, click toggles.

- `SearchOverlay.test.tsx` (updated): tap adds to `useCitiesStore` + closes; recents chip row assertions removed.

### Updated tests

- `App.test.tsx` if it exists (may need creation) — 1 integration test: click Cities → list shows → click a card → detail shows for that city.
- Any tests that reference `useRecentCitiesStore` or `RecentCities` component get updated or removed.

### Deleted tests

- `useRecentCitiesStore.test.ts` — replaced by `useCitiesStore.test.ts`.
- `RecentCities.test.tsx` — component removed.

## File Manifest

**New (14 files):**
- `src/stores/useCitiesStore.ts`
- `src/stores/useCitiesStore.test.ts`
- `src/stores/useViewStore.ts`
- `src/stores/useViewStore.test.ts`
- `src/hooks/useCityWeather.ts`
- `src/hooks/useCityWeather.test.tsx`
- `src/components/cities/CitiesList.tsx`
- `src/components/cities/CitiesList.test.tsx`
- `src/components/cities/CityCard.tsx`
- `src/components/cities/CityCard.test.tsx`
- `src/components/cities/SortDropdown.tsx`
- `src/components/cities/SortDropdown.test.tsx`
- `src/components/HeaderCitiesButton.tsx`
- `src/components/HeaderCitiesButton.test.tsx`

**Modified (~4 files):**
- `src/App.tsx` — conditional render on view; new header button; geo-auto-pin-on-boot effect moved from previous location if applicable
- `src/components/search/SearchOverlay.tsx` — remove recents chips; update tap-result behavior
- `src/components/search/SearchOverlay.test.tsx` — align tests with new behavior
- `src/hooks/useWeather.ts` — bump `writeCacheEntry` LRU cap from 5 to 15

**Removed (4 files):**
- `src/stores/useRecentCitiesStore.ts`
- `src/stores/useRecentCitiesStore.test.ts`
- `src/components/search/RecentCities.tsx`
- `src/components/search/RecentCities.test.tsx`

## Verification (End-to-End)

- Boot → detail view for detected city → Cities button → list shows one pinned card → search → add Tokyo → back to detail (still Chicago) → Cities → both cards visible → sort by Temperature → order changes based on live temps → tap Tokyo card → detail swaps to Tokyo → Cities → tap X on Tokyo → toast with Undo → tap Undo → Tokyo restored.
- Reload → cities list persists → sort mode persists → detail view is default landing.
- Airplane mode → cities list still renders from cache → subtle offline dots per card.

## Success Criteria

- All new + updated tests pass. No `.skip`.
- `npm run lint` clean.
- `npm run build` succeeds.
- Live smoke: end-to-end verification above works on the deployed URL.
- No regression in Phase 4 offline resilience or detail-view functionality.
