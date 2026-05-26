# Qaid · قيد بلوك 3

A bilingual card-game score tracker for **Sebeeta**, **Kout**, and any custom
scorepad. Built as a React 18 + TypeScript PWA — installable, offline-capable,
mobile-first, with full Arabic RTL support.

## Features

- **Three game modes** — Sebeeta (6 players, 2 teams of 3, lowest individual
  wins), Kout (6 players, contract-based scoring with 6 levels, first team to
  101), and an open Custom scorepad (2–6 players, configurable target +
  win-condition).
- **Two entry styles for Sebeeta + Custom** — *Bulk* (`±` rows) or *Numpad*
  (3×3 keypad, per-player focus).
- **Kout contract entry** — pick caller / level (Bab, 6, 7, 8, Bawan, Malzoom)
  / outcome (Made or Failed); scores compute via the published table. Manual
  fallback also available.
- **Bilingual** — full English + Arabic translations, with the document `lang`
  / `dir` and font stack flipping live.
- **Modern light + dark themes** — switchable from the home header.
- **Dealer / winner badges, top-scorer summary (Sebeeta), delta animations,
  toast notifications, inline-edit history.**
- **PWA** — service worker via Workbox, offline-installable, manifest with
  maskable icon. Persists state under `localStorage["cardScoreTracker_v1"]`
  (legacy-compatible).

## Tech stack

| Layer        | Choice                                                   |
| ------------ | -------------------------------------------------------- |
| Framework    | React 18                                                 |
| Build        | Vite 5                                                   |
| Language     | TypeScript (strict)                                      |
| Tests        | Vitest (31 cases on the pure scoring engine)             |
| PWA          | `vite-plugin-pwa` + Workbox                              |
| Icon gen     | `sharp` (SVG → PNG via `npm run icons`)                  |
| State        | Single `useState<PersistedState>` + `GameContext` actions |
| Routing      | One field on persisted state (no router lib)             |
| Styling      | Plain CSS with custom-property tokens (no CSS-in-JS)     |

## Local development

```bash
npm install
npm run dev       # Vite dev server on http://localhost:5173
npm run typecheck # tsc --noEmit (strict)
npm test          # Vitest run
npm run build     # tsc -b && vite build → dist/
npm run preview   # serve dist/ on http://localhost:4173 (PWA enabled)
npm run icons     # regenerate PNG icons from public/icon*.svg
```

Node 20+ recommended.

## Project structure

```
src/
├── App.tsx                   # top-level providers + screen router
├── main.tsx                  # React root
├── styles/themes.css         # Modern light + dark tokens + all screen rules
├── i18n/                     # bilingual strings + LangProvider
├── state/
│   ├── persistedState.ts     # PersistedState type, load/save (cardScoreTracker_v1)
│   └── GameContext.tsx       # actions: addRound, editRound, startGame, …
├── engine/
│   ├── types.ts              # KoutLevel, Winner, GameStateSlice
│   ├── scoring.ts            # pure totals, dealerIndex, checkWinner, contract scoring
│   └── scoring.test.ts       # 31 Vitest cases
├── components/
│   ├── Header.tsx            # eyebrow + title + slots
│   ├── Icon.tsx              # 14 SVG icons
│   ├── Toast.tsx             # ToastProvider + useToast
│   └── RoundSheet.tsx        # bottom-sheet with 4 entry modes
├── screens/
│   ├── HomeScreen.tsx
│   ├── SetupScreen.tsx
│   ├── PlayScreen.tsx
│   ├── HistoryScreen.tsx
│   ├── WinnerScreen.tsx
│   └── home/GameArt.tsx      # SVG card-fan illustrations
└── lib/
    ├── relativeWhen.ts       # "Just now / Today / N days ago"
    └── initials.ts
```

## Deployment

The build emits a static `dist/` — host on any static CDN. Cloudflare Pages,
Netlify, or Vercel all work with zero config:

- **Build command:** `npm run build`
- **Output dir:** `dist`

The service worker requires HTTPS (all the above provide it automatically).

## License

Private project. All rights reserved.
