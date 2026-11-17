# Design: unique card decks per user (post-AI variation layer)

Status: draft for review · Date: 2026-11-18

## 1. Problem

Today `server/wrap/buildWrap.mjs` runs on every API call. One rule per page type
decides **if** the page shows (`when`), **how interesting** it is (`score`) and
**what it says** (`build`). Every rule has exactly one piece of copy. Two
travellers who both clear the NIGHT_OWL threshold see the same headline, the same
layout and the same mascot line, and only the numbers differ. Heavy travellers
with similar habits end up with almost the same wrap.

Goal: keep the same card *types*, but give each user their own deck. That means
different framing, copy, comparisons, layouts, mascot moods, card mix and order,
while staying factually exact, on brand, and reproducible.

Constraint: the variation logic does **not** live in the API. The API only serves
a finished, stored wrap. Variation is decided in a composition layer that runs as
a batch job and wraps the AI copy step.

## 2. Verdict (from the deep research)

Build variation as a **deterministic composition layer that wraps the LLM**:

- **Code decides** which cards a user gets, in what order, and which variant
  (layout × framing × analogy × mood) each card uses.
- **The LLM writes only words** for the variant that was already chosen. It never
  writes numbers; numbers go into placeholder slots afterwards and are validated.
- **Everything is generated in a batch before launch** and stored per user. The
  API reads the stored document.

Why: every well-documented Wrapped-style system works this way.

- **Spotify 2025:** a priority-ordered set of heuristics picked each user's
  highlight days, and the LLM got precomputed stats because "LLMs are bad at math".
  About 1.4B reports were pre-generated over 4 days.
- **Duolingo:** gated on at least 20 lessons and 7 active days, and dropped
  stats that could be inaccurate.
- **Laravel Wrapped:** batch pre-generation, stored in the DB.
- **Canva:** a sampled review after generation, with regeneration of flagged
  output.

Research also shows that LLM text on its own **homogenizes** (Shaib et al.). So
uniqueness across users has to come from the variant library and seeded
assignment, not from the model.

Sources: Spotify engineering blog ("Inside the archive: 2025 Wrapped", 2026;
"Spotify Unwrapped", 2020), Spotify Confidence docs (sticky assignments), Canva
DesignDNA engineering blog, Laravel "How we built Laravel Wrapped", Duolingo 2020
Year in Review blog, Satyrn (EMNLP 2024), Carbonell & Goldstein 1998 (MMR),
Shaib et al. 2024 (text diversity). Full report with votes:
`/private/tmp/claude-503/-Users-shon-alvish-Documents-Repos-wrap-2026/3db3ea35-7e83-44c6-8404-4c0523bbb6d1/tasks/whkmo7oq0.output`
(scratchpad, copy it somewhere durable if you want to keep it).

## 3. Pipeline

```
 pipeline table (68 cols / user)
          │
          ▼
 ┌─────────────────────────── Wrap composer (batch job) ───────────────────────────┐
 │ 1 Normalise   flat row → typed facts; drop unreliable facts                     │
 │ 2 Eligible    per card: when(facts) with thresholds                             │
 │ 3 Score       per card: interestingness 0–100                                   │
 │ 4 Select      greedy MMR: score − redundancy(stat family) → deck of ≤ 12         │
 │ 5 Assign      seeded pick of variant per card (layout, framing, analogy, mood)  │
 │ 6 Order       story arc slots + seeded shuffle within a slot                    │
 │ 7 Copy        copy bank lookup, or LLM (JSON schema, {slot} placeholders)       │
 │ 8 Fill+check  inject numbers, validate numbers/length/banned words → fallback   │
 │ 9 Store       wrap document per user (+ deck fingerprint, variant ids)          │
 └─────────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
 POST /api/v1/wrap  → reads stored document (no rules, no LLM at request time)
```

Steps 2–6 and 8 are pure functions of `(facts, campaign_salt, library_version)`.
Re-running the job gives the same deck. Only step 7 is non-deterministic, and its
output is stored.

### 3.1 Normalise

The new pipeline output is a flat table of 68 named columns (plus one truncated
`DOUBLE` line at the top of the list; confirm its name). The current
`contract/user-aggregates.schema.json` is nested (`timing`, `seat`, `money`,
...). Add one adapter, `facts = normalise(row)`, so rules read a stable shape.

Mark facts that should never be shown as headline numbers, following Duolingo's
practice of dropping unstable stats:

| Fact | Treatment |
|---|---|
| `total_km`, `km_since_2025` when `km_estimated_trips / trips` > 0.3 | Round to the nearest 100 and say "about"; never use as the hero number |
| `trips_change_pct`, `new_cities_vs_2025` when `trips_2025 = 0` | Drop (new user, no baseline) |
| `rb_user_id`, `fav_boarding_point_id`, `fav_dropping_point_id`, `top_route_*_lat/lon` | Helpers only (seed, joins, map). Not card stats |

That leaves about 61 displayable facts.

### 3.2 Eligibility

Keep today's `when` per card type. Thresholds must be strict enough that the card
is worth a page. Example: `streak_weeks >= 4`, `nights_on_bus >= 3`,
`total_saved_inr >= 100`.

Variants can have their own extra requirements. The "earth laps" analogy
requires `earth_laps >= 0.1`. The "percentile brag" framing requires
`trips_percentile >= 80`.

### 3.3 Score

Keep `score` per card, 0–100, but build it from a shared vocabulary so cards are
comparable:

```
score = base(card_type)
      + rarity      // how unusual vs all users: from trips_percentile or a per-fact percentile table
      + magnitude   // how big the number is for this user (capped)
      + novelty     // changed vs 2025 (trips_change_pct, new_cities_vs_2025)
```

The research found **no validated method** for "most interesting stat" (the one
claim that a trained ranker beats simple statistics was refuted 0–3). Start with
hand-tuned weights, and plan an offline check: have 50 users label decks, then
tune.

### 3.4 Select (diversify the deck)

Replace "sort by score, take top 12" with greedy MMR:

```
pick next = argmax  λ·score(c)  −  (1−λ)·max_{d ∈ deck} sim(c, d)      λ ≈ 0.7
```

`sim` is a hand-written stat-family matrix: 1.0 for the same family, 0.3 for
related families, 0 otherwise. Families:

| Family | Facts |
|---|---|
| Distance | `total_km`, `avg_trip_km`, `longest_trip_*`, `shortest_trip_*`, `earth_laps`, `farthest_destination` |
| Time of day | `night_trips_pct`, `nights_on_bus`, `top_departure_hour`, `earliest_departure` |
| Rhythm | `weekly_heatmap`, `fav_travel_day`, `weekend_pct`, `busiest_month`, `longest_gap_days`, `streak_*` |
| Routes | `top_route*`, `top_3_routes`, `signature_trip`, `first_trip_route`, `last_trip_route` |
| Places | `unique_cities`, `new_cities_vs_2025`, `rarest_destination`, `top_destination`, `home_base` |
| Booking | `avg_lead_days`, `closest_booking_minutes`, `usual_booking_hour`, `app_pct`, `cancellations` |
| Comfort | `top_seat`, `sleeper_pct`, `fav_bus_type`, `fav_operator`, `solo_pct` |
| Money | `total_saved_inr`, `best_deal_*`, `cheapest_ticket_inr`, `savings_equivalent_tickets` |
| Planet | `co2_saved_kg`, `tree_equivalent` |
| Growth | `trips_change_pct`, `trips_2025`, `trips_since_2025`, `trips_percentile` |

Pinned cards (HOTEL today) and fixed cards (INTRO, PERSONA, SUMMARY) bypass this
step, as they do now.

### 3.5 Assign variants (the main source of uniqueness)

Each card type gets a small **variant library** with separate axes:

| Axis | What it changes | Example for ODOMETER |
|---|---|---|
| `layout` | Which visual template the client renders (must be one the app ships) | `map_routes`, `big_number`, `odometer_dial`, `progress_to_goal` |
| `framing` | The angle of the story | `achievement` ("you covered…"), `comparison` ("that's Kashmir–Kanyakumari ×1.4"), `identity` ("a true long-hauler"), `nostalgia` (first trip → last trip) |
| `analogy` | Which equivalent is used, gated by magnitude | Kashmir–Kanyakumari, Mumbai–Delhi, earth laps, "the moon is 384,400 km away", Bengaluru–Mysuru |
| `mood` | Mascot mood and palette | happy, wow, cheeky, cool, sleepy |

Pick each axis independently with a stable hash:

```
pick(axis) = weightedChoice(
  eligibleVariants(card, axis, facts),
  hash64(rb_user_id, card_type, axis, campaign_salt) / 2^64
)
```

- No stored state. The same user always gets the same deck while
  `campaign_salt` and `library_version` stay fixed (this is how Spotify
  Confidence assigns experiment variants).
- **Freeze the salt and the library at launch.** Changing either reshuffles
  every user. If the library must change after launch, persist each user's
  composed deck and treat it as the source of truth.
- Hashing each axis separately keeps the axes uncorrelated, so users who share a
  layout still differ in framing.

**Sizing:** with 4 layouts × 4 framings × 3 analogies × 3 moods = 144 combinations
per card, and 10–12 cards per deck, two users sharing the same full deck is
effectively impossible. What matters more is that each *card* looks different
from a friend's. Target: on any shared card type, two random users get a
different `(layout, framing)` pair ≥ 85% of the time. Confirm the target with the
metrics in §6.

### 3.6 Order

Keep a story arc, but don't make it rigid:

```
INTRO → [opening slot: 1 distance/volume card] → [middle: rhythm, routes, places, comfort, booking]
      → [closing slot: money/planet/growth] → PERSONA → SUMMARY
```

Inside the middle slot, shuffle with a seed from `hash(rb_user_id, 'order', salt)`.
Never place two cards from the same family next to each other.

### 3.7 Copy: copy bank first, per-user LLM only where it pays

**Recommendation (a design call, not taken from the sources):** generate most copy
**per variant**, not per user.

- **Copy bank.** For each `(card_type, framing, analogy, magnitude_bucket)`, the
  LLM generates 5–10 options offline. Copywriters review them once, and they are
  stored with `{slot}` placeholders. Example: 24 card types × ~12 framing/analogy
  combos × 3 buckets × 8 options ≈ 7,000 lines. A team can review that in full,
  which is impossible for a million per-user outputs. Each user draws one option
  by seed.
- **Per-user LLM, one card.** The SIGNATURE / bonus-insight card
  (`signature_trip`, `rarest_destination`, `closest_booking_minutes`,
  `longest_gap_days`) is written per user. This follows Laravel's pattern: "pick
  from these prioritised facts, fall back to others if none stand out". This
  card gives the "it knows me" feeling at a fraction of the cost.

Both paths use the same LLM contract.

**Input:**

```json
{
  "card_type": "NIGHT_OWL",
  "variant": { "layout": "moon_window", "framing": "identity", "analogy": null, "mood": "sleepy" },
  "facts": { "nights_on_bus": "{nights_on_bus}", "night_trips_pct": "{night_trips_pct}", "top_route": "Bengaluru → Hyderabad" },
  "tone": "warm, playful, Indian English, no sarcasm about money or cancellations",
  "limits": { "kicker": 24, "headline": 70, "body": 140, "bubble": 32 }
}
```

**Output** (structured output / JSON schema, so nothing else is accepted):

```json
{ "kicker": "...", "headline": "...", "body": "... {nights_on_bus} nights ...", "bubble": "..." }
```

Rules given to the model:

- Use only the slot names provided. Write no digits.
- Use place names only from `facts`.
- Stay within the character limits.

### 3.8 Fill and check

After the copy comes back:

1. Replace `{slot}` with formatted values, using the `n()`, `rupees()` and
   `plural()` helpers that already exist.
2. **Number check:** every digit sequence in the final text must come from a
   slot. Reject the copy otherwise.
3. **Place check:** every city name must exist in the facts or the city list.
4. Check length limits and run the banned-word list.
5. Run a tone classifier (negative or mocking tone is a reject).
6. On any failure: regenerate up to 2 times, then fall back to the
   **deterministic copy** for that variant. Today's hand-written copy in
   `buildWrap.mjs` becomes the fallback, so a wrap never fails to build.
7. Send a sampled human review (for example 0.5% per card type and locale)
   before launch, plus a full review of the copy bank.

### 3.9 Store

One document per user, in the same `WrapResponse` shape as today. Additive
fields are listed in §4. Also store:

- `deckFingerprint` = hash of `[(type, layout, framing, analogy)]`, used for the
  uniqueness metrics.
- `libraryVersion`, `campaignSalt` id, and the copy source per page
  (`bank` / `llm` / `fallback`).

## 4. Contract changes (additive, `schemaVersion` 1.1)

```ts
export interface WrapPage {
  id: string;
  type: PageType;
  dwellMs: number;
  copy: Copy;
  data: PageDataMap[PageType];
  /** New. Optional, so 1.0 clients ignore it and render the default layout. */
  variant?: {
    layout: string;      // client renders this template if it knows it, else the default for `type`
    palette?: string;    // theme key from src/lib/themes.ts
    mascotMood?: 'happy' | 'wow' | 'cheeky' | 'love' | 'cool' | 'sleepy' | 'sad';
  };
}
```

- Clients already skip unknown `type`s. They must also ignore an unknown `layout`
  and fall back. The composer should only assign layouts that the minimum
  supported app version ships (keep a `layout → minAppVersion` table).
- Framing and analogy never reach the client. They only affect copy and `data`.
  For example, `data.equivalent` in ODOMETER is already analogy-driven.
- Update `src/contract.ts`, `contract/openapi.yaml` and
  `contract/WrapContract.kt` together.
- For Rive: `layout` maps to an artboard or state-machine variant, and
  `mascotMood` maps to the existing `mood` input.

## 5. Card types vs the new 68-column list

The new consolidated list changes what can be built:

| Status | Page types / cards |
|---|---|
| **Covered** | INTRO, ODOMETER (`total_km`, `earth_laps`, `unique_cities`), PEAK_MONTH (`busiest_month`, `longest_gap_days`), TOP_ROUTE (`top_route*`, `top_route_rank`), NIGHT_OWL (`night_trips_pct`, `nights_on_bus`), LAST_MINUTE (`closest_booking_minutes`), PLANNER (`avg_lead_days`), EXPLORER (`new_cities_vs_2025`, `rarest_destination`), SAVINGS (`total_saved_inr`, `best_deal_*`), ECO (`co2_saved_kg`, `tree_equivalent`), FIRST_STEPS (`first_trip_*`), PERSONA (`archetype` replaces the `persona()` function), SUMMARY |
| **Partly covered** | EARLY_BIRD (has `earliest_departure`, `top_departure_hour`, but no morning-share %), SEAT (`top_seat`, `sleeper_pct`, but no window %), SQUAD (only the inverse, `solo_pct`) |
| **No fields in the new list** | RAIL, WAITLIST, FLEXI, LIVE_TRACKING, HOMEWARD, HOTEL, PRIMO, DREAM. Decide: drop these, or keep a second input table for them |
| **New cards the list enables** | STREAK (`streak_days/weeks/months`), RHYTHM (`weekly_heatmap`, `fav_travel_day`, `weekend_pct`), OPERATOR (`fav_operator`, `fav_bus_type`), GROWTH (`trips_2025`, `trips_change_pct`, `trips_percentile`), EXTREMES (`longest_*`/`shortest_*` trip), FIRST_AND_LAST (`first_trip_*`, `last_trip_*`), BOOKING_HABIT (`usual_booking_hour`, `app_pct`), SIGNATURE (per-user LLM card) |

## 6. Measuring "unique"

Within-deck variety and cross-user uniqueness are separate goals. A system can
give everyone the same 5 dissimilar cards and score well on the first but badly
on the second. Track both on a 100k-user dry run before launch:

| Metric | Target (initial) |
|---|---|
| Same-family adjacent cards in a deck | 0 |
| Distinct stat families per deck (heavy travellers) | ≥ 6 |
| Pairwise `(layout, framing)` collision on a shared card type | ≤ 15% |
| Most common `deckFingerprint` share | ≤ 0.1% of users |
| Variant usage spread (largest variant's share per axis) | ≤ 2× uniform share |
| Copy diversity: compression ratio and Self-BLEU per card type, numbers and cities masked | Track vs. copy bank baseline |
| Number-check failure rate before fallback | < 2%; fallback rate < 0.5% |

Add a `npm run test:variety` script next to `test:api` that runs the composer
over the seed users plus synthetic users and prints these numbers.

## 7. A/B testing in a one-shot campaign

- Run experiments **on axes, not on users' whole decks**. For example, test 50%
  `framing=comparison` against `framing=identity` on ODOMETER. Use a separate
  experiment salt, so the experiment doesn't reshuffle the variant seed.
- Outcomes: completion rate (reached SUMMARY), share rate, card dwell, skip rate.
- Decide in a **soft-launch cohort** (for example 2% of users, 1 week before full
  launch), then freeze the weights for everyone. Changing assignments mid-campaign
  breaks "my wrap changed" consistency.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Wrong number in copy | LLM never writes digits; slot fill plus number check plus fallback copy |
| Hallucinated city or operator | Place check against facts; operators only from `fav_operator` |
| Off-brand or insensitive tone (cancellations, low savings, gaps) | Tone guide in prompt, banned list, tone classifier, full copy-bank review; no "negative" framings for cancellations |
| User's wrap changes between opens | Pure seeding, frozen salt and library, stored document |
| Upstream data bug produces believable but wrong cards (Spotify's timezone bug made the LLM describe the wrong day) | Per-card-type jobs that can be rerun on their own; sanity checks on facts (for example `longest_trip_km >= avg_trip_km`) |
| App can't render a new layout | `layout → minAppVersion` table; client fallback to default layout |
| LLM cost or latency at millions of users | Copy bank (thousands of calls, not millions) plus one per-user card in batch |

## 9. Changes in this repo

1. `server/wrap/facts.mjs`: `normalise(row)` from the 68-column table.
2. `server/wrap/variants/<card>.mjs`: variant library per card (axes, eligibility,
   weights, fallback copy).
3. `server/wrap/compose.mjs`: steps 2–6 and 8. Replaces the selection part of
   `buildWrap()`.
4. `server/wrap/copy/`: copy-bank loader plus the LLM client (batch, JSON schema).
5. `scripts/compose-batch.mjs`: runs the composer over all users and writes
   stored documents.
6. `server/index.mjs`: serve the stored document. Keep `buildWrap` only for dev
   and demo users.
7. Contract 1.1 (§4); `src/pages/*` read `variant.layout` and keep the current
   look as the default.
8. `server/selftest.mjs`: add determinism (same input gives same deck) and the
   variety metrics (§6).

## 10. Open questions

1. What is the truncated first column in the 68-column list (the one shown only
   as `DOUBLE`)?
2. Drop or re-source the eight page types with no fields in the new list (§5)?
3. How should interestingness be weighted across stat types? Needs labelled decks.
4. How many layouts can design and Rive realistically ship per card type? This
   decides how much of the uniqueness comes from visuals vs copy.
5. Which locales are in scope? Each one multiplies the copy bank and the review
   effort.
