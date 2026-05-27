# Qaid — Claude Code project memory

Context priming for future sessions on this repo. Reflects state as of tag
**v0.1.0** (`a914bc8`).

## What this is

Bilingual card-game score tracker, originally a 3140-line vanilla `index.html`
(legacy commit `2ba8484`), now a React 18 + Vite + TypeScript PWA. Repo:
`github.com/halhouti-glitch/Qaidb3-React`.

## Tech stack — non-negotiable choices

- React 18, Vite 5, **TypeScript strict** (`tsconfig.app.json` has noUnusedLocals/Parameters)
- Vitest + jsdom (31 cases on the pure engine)
- `vite-plugin-pwa` + Workbox (`registerType: 'autoUpdate'`, devOptions disabled)
- `sharp` for SVG → PNG icon generation
- Plain CSS with custom-property tokens. **No CSS-in-JS, no Tailwind, no Redux, no router lib.**
- Routing = `state.currentScreen` (one of `'home'|'setup'|'play'|'history'|'winner'`)

## State / data contract

**`localStorage["cardScoreTracker_v1"]` is legacy-compatible — do not change keys without a migration.** Full shape in `src/state/persistedState.ts`:

```ts
type PersistedState = {
  gameMode: 'sebeeta' | 'kout' | 'custom';
  players: string[];
  playerTeam: number[];           // 0 | 1, by position
  teamNames: string[];            // [A, B]
  scores: number[][];             // per-round; per-player (custom/sebeeta) or [a,b] (kout)
  threshold: number;
  winRule: 'lowest' | 'highest';
  gameOver: boolean;
  gameLogged: boolean;
  lang: 'en' | 'ar';
  koutEntryMode: 'contract' | 'manual';
  entryStyle: 'pm' | 'numpad';
  currentScreen: Screen;
  recentGames: RecentGame[];      // capped at 10
  theme: 'light' | 'dark';
};
```

## Game rules

- **Sebeeta**: 6 players, 2 teams of 3. First *individual* to hit threshold → **their team loses**. Default 201. Threshold chips: 101 / 151 / 201 / 301. Always shown as individual scoreboard.
- **Kout**: 6 players, 2 teams of 3. Team scores. First team to threshold wins; simultaneous → higher total wins. Default 101. Chips: 51 / 101. **No-minus invariant**: UI never exposes a `−10` button; contract mode only produces non-negative scores by lookup; manual mode clamps at 0. Contract levels (made / failed): `bab 5/10`, `6 6/12`, `7 7/14`, `8 8/16`, `bawan 36/18`, `malzoom 5/5`.
- **Custom**: 2–6 players. User picks threshold + win rule (highest / lowest). Engine treats Custom as per-player. The Setup screen has a "Teams" toggle for Custom but `startGame('custom')` currently ignores team data — see Open follow-ups.

## File layout

```
src/
├── App.tsx                # LangProvider > ToastProvider > GameProvider > AppShell
├── styles/themes.css      # Modern light + dark + all screen rules
├── i18n/                  # strings.ts (~150 keys, en+ar, function templates) + LangContext
├── state/
│   ├── persistedState.ts  # PersistedState type, load/save
│   └── GameContext.tsx    # All actions; single applyScoresUpdate path
├── engine/                # Pure scoring + 31 Vitest cases
├── components/            # Header, Icon (14 SVGs), Toast, RoundSheet
├── screens/               # Home, Setup, Play, History, Winner (+ home/GameArt.tsx)
└── lib/                   # relativeWhen, initials
public/                    # icon.svg, icon-maskable.svg, 4 generated PNGs
scripts/generate-icons.mjs # sharp SVG→PNG, `npm run icons`
.github/workflows/ci.yml   # typecheck + test + build on push/PR (Node 20)
```

## Important architectural choices (so you don't relitigate them)

- **Mode is locked from the home pick.** Setup screen does **not** show a mode-picker. Switching modes means going back to home.
- **Home header is the only place** with the language picker + theme toggle. Other screens have screen-specific toolbars (back / history icons).
- **Home game cards use top-banner art** (full-width × 140px) — the original design folder's 70×90 side-by-side was traded for richer 4-card SVG fans per user request.
- **Single light theme (Modern) + derived dark.** Mushaf/Diwan from the original design/ were dropped. User explicitly chose Modern only.
- **Game art is real SVGs**, not gradients/emoji:
  - Sebeeta: red Joker · black Joker · 10♦ · Q♠
  - Kout: A♣ · A♦ · A♥ · A♠
  - Custom: four red card-backs with gold Q seal
- **Score mutations all go through `GameContext.applyScoresUpdate`** which recomputes winner+gameOver, auto-logs the finished game, and auto-navigates to winner. Don't bypass this.
- **Sebeeta uses the engine's lowest-individual-wins logic** (legacy parity) — the UI shows as individual scoreboard always, even though it's a team game.

## Commands

```bash
npm install
npm run dev          # Vite dev :5173
npm run typecheck    # tsc -b --noEmit
npm test             # vitest run (31 cases)
npm run build        # tsc -b && vite build → dist/
npm run preview      # serve dist/ :4173 (service worker enabled)
npm run icons        # regenerate PNGs from public/icon*.svg
```

## Commit history

```
a914bc8  Add GitHub Actions CI workflow
0bec807  Add README
8b64fc5  Phase 4: PWA — manifest, service worker, icons, iOS chrome
10256f9  Phase 3: Screens, state machine, atoms, game art
fd6aea6  Phase 2: Pure scoring engine + 31 Vitest cases
75dffc3  Phase 1: Vite + React 18 + TS scaffold, Modern theme, i18n, app shell
2ba8484  (legacy single-file build — for historical reference)
```

## Pending parity with vanilla `main`

See [`PORT_FROM_VANILLA.md`](./PORT_FROM_VANILLA.md) — vanilla shipped
several features after this fork was branched (game registry, player
profiles, history-clear UI, top-2 teammates, undo snackbar, share-as-PNG,
haptics, screen transitions). The file is the ordered porting spec with
state-shape changes, action signatures, i18n keys, and absolute paths to
vanilla reference code at `C:\Users\halho\Desktop\Qaid`.

## Open follow-ups (acknowledged but not done)

- **Deploy host** — not picked. `dist/` is static; Cloudflare Pages / Netlify / Vercel all work zero-config with `npm run build` + output `dist`.
- **Custom + Teams** — Setup screen exposes the toggle but `startGame({ mode: 'custom' })` doesn't accept team data; the engine treats Custom as per-player win detection only. Extend `StartGameInput` if needed (`SetupScreen.start()` flags this).
- **GitHub Release card** — tag is pushed but no rendered Release page. Run `gh release create v0.1.0 --notes-from-tag` if wanted.
- **`translations.csv`** at repo root — untracked, unused. Either delete or commit as i18n source-of-truth reference.

## Verification

- `npm run typecheck` clean
- `npm test` → 31/31 passing
- `npm run build` succeeds, emits 17-entry Workbox precache (~262 KB)
- `npm run preview` + manifest fetch: dir=rtl, lang=ar, 3 icons including maskable, SW active, fonts cached

## Recent design folder (now deleted)

The `design/` folder (Babel-in-browser prototype with mushaf/diwan/modern themes) and `legacy.html` (original single-file build) were deleted in Phase 4 cleanup per the user's Phase-1 decision. Both still live in git history if needed — legacy at `2ba8484`.
