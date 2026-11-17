# Safarnama 2026 — redBus year-in-travel wrap

A working prototype: a mock wrap API plus a React app that plays each user's
year as animated story pages. The server decides which pages a user sees; the
app only renders them.

## Run it

```bash
npm install
npm run dev          # API on :8787 and web app on :5173 (Vite proxies /api)
```

Open http://localhost:5173 and pick a demo traveller, or open
http://localhost:5173/?mascots to review every mascot mood.

Other scripts: `npm run test:api` checks the page rules against every seeded
user; `npm start` builds the app and serves app + API from one Node process on
:8787.

## The API contract

One call. The request carries only the user ID:

```http
POST /api/v1/wrap
{"userId": "u_aarav"}
```

| Status | When |
|---|---|
| 200 | The wrap: `user`, ordered `pages[]`, `share` card |
| 400 | Body isn't exactly `{"userId": "<1-64 of A-Z a-z 0-9 _ ->"}` |
| 404 | Unknown user |
| 422 | User has no trips this year (app shows a "no trips yet" screen) |

Each page is `{ id, type, dwellMs, copy, data }`:

- `type` picks the renderer. Clients skip types they don't know, so new pages
  can ship from the server first.
- `copy` (kicker, headline, body, mascot bubble) is written on the server, so it
  can be localised or A/B tested without an app release.
- `data` holds the numbers that drive the animation.
- `dwellMs` is reading time. The app starts it only after the page reports its
  animation has finished, so auto-advance never cuts an animation off.

Full definitions: `contract/openapi.yaml`, `src/contract.ts` (web) and
`contract/WrapContract.kt` (Android, kotlinx.serialization).

## Which pages a user gets

`server/wrap/buildWrap.mjs` has one rule per page type: when it applies, how
interesting it is for this user (score), and what it shows. INTRO, PERSONA and
SUMMARY are always present; the 12 highest-scoring content pages are kept, in
story order.

| Demo user | Pages | Why |
|---|---|---|
| `u_aarav` | 15 | Night-bus regular: map, top route, night owl, seat, rail, waitlist, Flexi, tracking, festival trips home |
| `u_meera` | 14 | Train lover: early bird, rail, waitlist, planner, explorer, eco |
| `u_zoya` | 15 | Weekend explorer: new cities, squad trips, dream destination, no rail pages |
| `u_kabir` | 6 | Only 2 trips: gets "Trip #1" instead of the odometer and peak-month pages |
| `u_ghost` | — | No trips, so the API returns 422 |

The 23 page types: INTRO, FIRST_STEPS, ODOMETER (India map with bus and train
routes), PEAK_MONTH, TOP_ROUTE, NIGHT_OWL, EARLY_BIRD, SEAT, RAIL, WAITLIST,
LAST_MINUTE, PLANNER, FLEXI, LIVE_TRACKING, HOMEWARD, EXPLORER, SQUAD, SAVINGS,
PRIMO, ECO, DREAM, PERSONA, SUMMARY.

In production the per-user aggregates in `server/data/users.mjs` would come
from the datapilot pipelines instead of seed data.

## Code map

```
contract/            OpenAPI spec and Kotlin data classes
server/              Mock API, page rules, self-test
src/contract.ts      TypeScript contract
src/components/      StoryPlayer, Mascot, IndiaMap, effects, Fit (scales art to any phone)
src/pages/           One component per page type; registry.tsx maps type -> component
src/lib/             Theme (redBus colours), motion presets, settle signal, API client
```

## Moving the animations to Rive

Each page component is a reference for one Rive artboard:

- Numbers in `data` become state-machine inputs (for example ODOMETER's
  `totalKm`, SEAT's `seatLabel`, WAITLIST's `path`).
- Text from `copy` stays native, so it localises without new Rive files.
- When the state machine reaches its end state, fire the same "settled" signal
  the web player uses (`src/lib/settle.ts`); start `dwellMs` after it.
- The mascot (Chhotu, and Rani for rail) needs one artboard with a `mood` input:
  happy, wow, cheeky, love, cool, sleepy, sad; plus a white livery for red pages.

## Notes

- The India outline is a simplified hand-drawn shape. Replace it with redBus's
  approved map asset before anything goes outside the team.
- All numbers are sample data.
