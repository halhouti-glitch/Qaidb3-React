# Port plan — features missing vs vanilla `main`

This fork was branched from vanilla commit `2ba8484` (before any of Tier A/B/E
work). The vanilla repo has since added several features that haven't landed
here. This file is the porting spec — read it before adding new game modes,
because the registry refactor (item 1) unlocks the rest of the roadmap.

**Vanilla repo path on this machine:** `C:\Users\halho\Desktop\Qaid`
**Vanilla repo on GitHub:** https://github.com/halhouti-glitch/Qaidb3
**This fork on GitHub:** https://github.com/halhouti-glitch/Qaidb3-React

---

## Order of work + estimates

| # | Item | Depends on | Est. |
|---|---|---|---|
| 1 | Game registry | — | 1.5h |
| 2 | Player profiles + ProfileSheet + TopPlayers + typeahead | — | 5h |
| 3 | History clear UI | 2 | 1h |
| 4 | Top-2 teammates display | 2 | 0.5h |
| 5 | Undo toast (snackbar with action) | — | 1.5h |
| 6 | Share-as-PNG | — | 1.5h |
| 7 | Haptics + sounds | — | 1.5h |
| 8 | Screen transitions | — | 1h |

**Total: ~13h to reach feature parity with vanilla `main`.**

Recommended cadence: ship 1, 2, 3, 4 as one batch (it's the biggest user-visible
change and they all interlock around profiles). Then 5–8 individually.

---

## 1. Game registry — structural prerequisite for Baloot/Trix/Hand

**Why:** the React fork currently hardcodes the three games in
`HomeScreen.tsx` (`<SebeetaArt/>`, `<KoutArt/>`, `<CustomArt/>`) and branches
on `isKout/isSebeeta/isCustom` throughout `SetupScreen.tsx`. To add Baloot
without that sprawl, mirror what vanilla just did in `js/games/index.js`.

**Files to create:**

```ts
// src/games/registry.ts
import type { FC } from 'react';
import { SebeetaArt, KoutArt, CustomArt } from '../screens/home/GameArt';
import type { GameMode, WinRule } from '../state/persistedState';

export type Game = {
  key: GameMode;
  i18nKey: string;
  descKey: string;
  metaKey: string;
  hintKey: string | null;
  ArtComponent: FC;
  defaultThreshold: number;
  winRule: WinRule;
  isTeamMode: boolean;
  teamSize: number | null;
  numPlayers: number | null;          // null = user-chosen
  scoreScope: 'player' | 'team';
  configurable: boolean;              // shows threshold + winRule controls
  contractsEnabled: boolean;
};

export const GAMES: Record<GameMode, Game> = {
  sebeeta: {
    key: 'sebeeta', i18nKey: 'gameSebeeta', descKey: 'gameSebeetaDesc',
    metaKey: 'gameSebeetaMeta', hintKey: 'sebeetaHint',
    ArtComponent: SebeetaArt,
    defaultThreshold: 201, winRule: 'lowest',
    isTeamMode: true, teamSize: 3, numPlayers: 6,
    scoreScope: 'player', configurable: false, contractsEnabled: false,
  },
  kout: {
    key: 'kout', i18nKey: 'gameKout', descKey: 'gameKoutDesc',
    metaKey: 'gameKoutMeta', hintKey: 'koutHint',
    ArtComponent: KoutArt,
    defaultThreshold: 101, winRule: 'highest',
    isTeamMode: true, teamSize: 3, numPlayers: 6,
    scoreScope: 'team', configurable: false, contractsEnabled: true,
  },
  custom: {
    key: 'custom', i18nKey: 'gameCustom', descKey: 'gameCustomDesc',
    metaKey: 'gameCustomMeta', hintKey: null,
    ArtComponent: CustomArt,
    defaultThreshold: 100, winRule: 'highest',
    isTeamMode: false, teamSize: null, numPlayers: null,
    scoreScope: 'player', configurable: true, contractsEnabled: false,
  },
};

export const GAME_ORDER: GameMode[] = ['sebeeta', 'kout', 'custom'];

export const getGame = (key: GameMode): Game => GAMES[key];
```

**Files to update:**
- `HomeScreen.tsx` — replace the three hardcoded `<GameCardButton>` blocks with `GAME_ORDER.map(key => { const g = GAMES[key]; return <GameCardButton key={key} mode={key} name={t(g.i18nKey)} desc={t(g.descKey)} meta={t(g.metaKey)} onPick={() => actions.pickGame(key)}><g.ArtComponent /></GameCardButton>; })`
- `SetupScreen.tsx` — use `const game = getGame(state.gameMode);` then drive defaults from `game.defaultThreshold`, `game.numPlayers`, `game.configurable`, `game.isTeamMode`. **Keep the existing custom-teams toggle** — it's a feature vanilla doesn't have. Custom remains the only `configurable: true` mode.
- `engine/scoring.ts` — leave alone. Already switches on `gameMode` string; that contract is fine.

**Vanilla reference:** `C:\Users\halho\Desktop\Qaid\js\games\index.js` (whole file). The vanilla version moves the SVG art into HTML `<template>` blocks; in React, art is just a component reference (`FC`), which is cleaner.

---

## 2. Player profiles + dependents — largest single addition

Lifetime per-player memory: games, wins, who they played with. Drives the
TopPlayers strip on Home, the typeahead on Setup, and the ProfileSheet.

### State additions

```ts
// in src/state/persistedState.ts
export type Profile = {
  name: string;                                    // canonical casing (last seen)
  gamesPlayed: number;
  wins: number;
  lastPlayed: number;                              // epoch ms
  teammates: Record<string, number>;               // partnerKey → games-together count
};

// Add to PersistedState:
playerProfiles: Record<string, Profile>;           // key = name.toLowerCase().trim()

// DEFAULT_STATE:
playerProfiles: {},
```

The localStorage key stays `cardScoreTracker_v1` — older fork installs will
just have `playerProfiles: {}` after the spread merge in `loadState()`.

### Logging — extend the game-end path

The vanilla logic runs at game-end (winner detected, before navigating to the
winner screen). In the React fork that path goes through
`GameContext.applyScoresUpdate` → checks `winner` → calls `logFinishedGame`.
Mirror this:

```ts
// pseudo — inside the same flow that pushes to recentGames
function upsertProfiles(state: PersistedState, winnerIdxSet: Set<number>): Record<string, Profile> {
  const profiles = { ...state.playerProfiles };
  const teamMode = state.playerTeam.length === state.players.length && state.players.length > 0;
  const now = Date.now();

  state.players.forEach((rawName, pIdx) => {
    const name = (rawName || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    const prev = profiles[key] ?? { name, gamesPlayed: 0, wins: 0, lastPlayed: 0, teammates: {} };
    const next: Profile = {
      ...prev,
      name,                                        // refresh canonical casing
      gamesPlayed: prev.gamesPlayed + 1,
      wins: prev.wins + (winnerIdxSet.has(pIdx) ? 1 : 0),
      lastPlayed: now,
      teammates: { ...prev.teammates },
    };
    if (teamMode) {
      const myTeam = state.playerTeam[pIdx];
      state.players.forEach((other, oIdx) => {
        if (oIdx === pIdx) return;
        if (state.playerTeam[oIdx] !== myTeam) return;
        const otherKey = (other || '').trim().toLowerCase();
        if (!otherKey) return;
        next.teammates[otherKey] = (next.teammates[otherKey] ?? 0) + 1;
      });
    }
    profiles[key] = next;
  });
  return profiles;
}
```

**Important:** `winnerIdxSet` for Kout (team scope) means all players on the
winning team are winners. For Sebeeta, the engine returns the *opposing* team
as winner — so look up `state.playerTeam[i] === winner.idx` for each player.
For Custom, the winner is a single player index.

### Helpers

```ts
// src/state/profiles.ts
export function topProfiles(profiles: Record<string, Profile>, n: number): Profile[] {
  return Object.values(profiles)
    .sort((a, b) => {
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      return (b.lastPlayed || 0) - (a.lastPlayed || 0);
    })
    .slice(0, n);
}

// Defaults to 2 — Sebeeta/Kout are 3v3 so each player has two teammates per game.
export function topTeammates(
  profile: Profile,
  profiles: Record<string, Profile>,
  limit = 2,
): Array<{ name: string; count: number }> {
  return Object.entries(profile.teammates ?? {})
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k, count]) => ({ name: profiles[k]?.name ?? k, count }));
}
```

### New components

- **`<TopPlayersStrip>`** on `HomeScreen`: horizontal pill row above Recent
  Games. Each pill = avatar (first letter of name) + name + `${gamesPlayed} · ${wins}W`. Click → open ProfileSheet for that key.
- **`<ProfileSheet>`** — bottom sheet (reuse sheet styles from RoundSheet).
  Stats grid: Games, Wins, Win rate, Last played, Top teammates (stacked, up
  to 2 entries). Remove button at bottom that calls `actions.removeProfile(key)`.
- **`<PlayerNameInput>`** wrapper for the existing name `<input>` on
  SetupScreen — adds `list="playerProfilesList"` attribute and renders a
  shared `<datalist id="playerProfilesList">` with `<option value={p.name}/>`
  for every profile (sorted by gamesPlayed desc).

### New actions on `GameContext`

```ts
removeProfile(key: string): void;       // delete one entry from playerProfiles
clearAllProfiles(): void;               // wipe playerProfiles to {}
```

### i18n keys to add (en + ar)

```ts
topPlayers: 'Top players' / 'أبرز اللاعبين',
profileGamesPlayed: 'Games' / 'الألعاب',
profileWins: 'Wins' / 'الفوز',
profileWinRate: 'Win rate' / 'نسبة الفوز',
profileLastPlayed: 'Last played' / 'آخر لعبة',
profileTopTeammate: 'Top teammates' / 'الشركاء الأكثر',           // plural — see item 4
profileTeammateOf: (n: string, c: number) => `${n} · ${c}×`,      // same in both languages
profileNeverPlayed: 'No games yet' / 'لا توجد ألعاب بعد',
removePlayer: 'Remove player' / 'حذف اللاعب',
```

**Vanilla reference:** `C:\Users\halho\Desktop\Qaid\index.html:2455-2606`
(the entire profile data layer + helpers + sheet renderer).

---

## 3. History clear UI

Depends on item 2 for `clearAllProfiles`.

- Recent Games section header gets a "Clear" link (text button) →
  `actions.clearAllRecents()`.
- Each recent-game row gets an `×` button → `actions.removeRecentGame(idx)`.
  Vanilla closes over the index in the click handler.
- Top Players section header also gets "Clear" → `actions.clearAllProfiles()`.
- ProfileSheet already has a Remove button (item 2).

**New actions:**
```ts
removeRecentGame(idx: number): void;
clearAllRecents(): void;
clearAllProfiles(): void;      // from item 2
```

**New i18n key:** `clearAll: 'Clear' / 'مسح'`

**Vanilla reference:** `C:\Users\halho\Desktop\Qaid\index.html:2275-2299` for
the recent-row markup + `×` wiring.

---

## 4. Top-2 teammates display

Depends on item 2. Once `<ProfileSheet>` exists, this is a one-line change:

```tsx
// inside ProfileSheet
const mates = topTeammates(profile, state.playerProfiles, 2);
const teammatesBlock = mates.length === 0
  ? <div className="value small">—</div>
  : mates.map(m => (
      <div key={m.name} className="value small">
        {t('profileTeammateOf')(m.name, m.count)}
      </div>
    ));
```

The label key is `profileTopTeammate` (plural — vanilla used to be singular
and was changed today; use the plural string from the start).

**Vanilla reference:** `C:\Users\halho\Desktop\Qaid\index.html:2510-2513` and
the helper at `index.html:2597-2606`.

---

## 5. Undo toast — UX rework

Current React fork uses `window.confirm` + a passive toast. Vanilla uses a
non-blocking snackbar that appears after every commit with an "Undo" button.

- Extend the existing `<Toast>` API to accept an optional action:
  ```ts
  show(message: string, options?: { durationMs?: number; action?: { label: string; onClick: () => void } }): void;
  ```
  When `action` is present, render a button inside the toast.
- Fire the undo toast from inside the `submitRound` action (post-commit),
  not from `PlayScreen.onUndo`.
- Drop the `window.confirm` from `PlayScreen.onUndo` — the snackbar IS the
  confirm flow. Long-press / dedicated Undo button can still call
  `actions.undoRound()` directly.
- i18n keys: `undoToastMessage`, `undoBtn`.

---

## 6. Share-as-PNG

Pure canvas logic — port `js/share.js` to `src/share.ts` essentially as-is.
Framework-agnostic. Returns a `Blob` + filename.

**Wiring:**
- `src/share.ts` exports `async function shareGameImage(state: PersistedState): Promise<void>`.
- Internally builds a 1080×1350 canvas with players + scores + winner row.
- Uses `navigator.share({ files: [new File(...)] })` when supported;
  falls back to `canvas.toBlob` → `URL.createObjectURL` → `<a download>`.
- Add a Share icon button to `WinnerScreen` header that calls it.

**Vanilla reference:** `C:\Users\halho\Desktop\Qaid\js\share.js` — copy
verbatim, swap `state.gameMode` switches for the same pattern, convert
function signatures to TS.

---

## 7. Haptics + sounds

**Add `sound: boolean` to `PersistedState`** (currently missing from
`DEFAULT_STATE`). Toggle pill in `Header` similar to the theme toggle.

- `src/lib/haptics.ts`:
  ```ts
  export function vibrate(ms: number | number[], enabled: boolean): void {
    if (!enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    navigator.vibrate(ms);
  }
  ```
- `src/lib/sound.ts`: lazy `AudioContext` (must initialise on first user
  gesture or iOS blocks it). One `blip(freq, ms)` helper. Call on round
  commit + winning game.
- Both helpers read the current `sound` flag — pass via prop or via the
  GameContext (better: a small `useAudio()` hook that wraps both and reads
  state).

**Vanilla reference:** grep `navigator.vibrate` and `AudioContext` in
`C:\Users\halho\Desktop\Qaid\index.html`.

---

## 8. Screen transitions

Directional fade + horizontal slide between Home → Setup → Play → Winner
(and back). CSS-only, must respect `prefers-reduced-motion`.

- Track a `direction: 'forward' | 'back'` derived from the previous and
  current `currentScreen` (small lookup table; e.g. `home → setup` is
  forward, `setup → home` is back).
- Add a class to the screen container; CSS transitions handle the rest.

```css
@media (prefers-reduced-motion: no-preference) {
  .screen.enter-forward { animation: slide-in-end 200ms ease-out; }
  .screen.enter-back    { animation: slide-in-start 200ms ease-out; }
  /* etc */
}
```

---

## Don't accidentally regress

The React fork has **two features vanilla doesn't**:

1. **Custom-mode teams toggle** in `SetupScreen.tsx`. When you do item 1
   (registry), keep this branch intact. Vanilla treats Custom as
   always-individual; this fork lets the user opt into 2-team Custom games.
2. **`.github/workflows/ci.yml`** — typecheck + test + build on every push.
   Don't drop it.

---

## State shape after all 8 items

```ts
type PersistedState = {
  gameMode: GameMode;
  players: string[];
  playerTeam: number[];
  teamNames: string[];
  scores: number[][];
  threshold: number;
  winRule: WinRule;
  gameOver: boolean;
  gameLogged: boolean;
  lang: Lang;
  koutEntryMode: KoutEntryMode;
  entryStyle: EntryStyle;
  currentScreen: Screen;
  recentGames: RecentGame[];
  theme: Theme;
  // NEW:
  sound: boolean;                                  // item 7
  playerProfiles: Record<string, Profile>;         // item 2
};
```

localStorage key stays `cardScoreTracker_v1` — old installs get the new
fields populated via `loadState`'s spread on `DEFAULT_STATE`.

---

## How to find this file from inside a fresh session

If the other Claude session doesn't pick it up automatically:

```
read PORT_FROM_VANILLA.md
```

(It's also referenced from `CLAUDE.md` in this repo, so it should be in
context whenever CLAUDE.md is loaded.)
