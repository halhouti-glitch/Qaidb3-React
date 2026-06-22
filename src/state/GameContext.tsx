import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  DEFAULT_STATE,
  type EntryStyle,
  type GameMode,
  type KoutEntryMode,
  type PersistedState,
  type RecentGame,
  type Screen,
  type SebeetaView,
  type Theme,
  type TrixDeal,
  type TrixMatch,
  type TrixRoundMeta,
  type WinRule,
} from './persistedState';
import type { Lang } from '../i18n/strings';
import { useLang } from '../i18n/LangContext';
import { checkWinner, teamTotalsFromPlayers, totals } from '../engine/scoring';
import { TRIX_KINGDOMS, trixCurrentKingdom, trixKingIdx } from '../engine/trix';
import { upsertProfiles, winnerPlayerIndices } from './profiles';
import { reverseGameLog } from './gameLog';
import { exhaustive } from '../lib/exhaustive';

type TeamSetup = {
  players: string[];
  playerTeam: number[];
  teamNames: [string, string];
  /** Optional override for the win-target. Defaults to 201 (Sebeeta) / 101 (Kout). */
  threshold?: number;
};

export type StartGameInput =
  | ({ mode: 'sebeeta' } & TeamSetup)
  | ({ mode: 'kout' } & TeamSetup)
  | {
      mode: 'custom';
      players: string[];
      threshold: number;
      winRule: WinRule;
      /** Optional: when present and length matches players, Custom is played as teams. */
      playerTeam?: number[];
      teamNames?: [string, string];
    }
  | {
      mode: 'trix';
      players: string[]; // exactly 4
      /** Seat index (0–3) of the 7♥ holder = King of kingdom 0. */
      kingFirst: number;
      /** 2v2 rollup (default in Setup). When true, playerTeam must be set. */
      partnership?: boolean;
      /** 0|1 per seat. Across pairing = [0,1,0,1] (seats 0&2 vs 1&3). */
      playerTeam?: number[];
      teamNames?: [string, string];
    };

export type GameActions = {
  navigate: (screen: Screen) => void;
  pickGame: (mode: GameMode) => void;
  startGame: (input: StartGameInput) => void;
  addRound: (round: number[]) => void;
  editRound: (idx: number, round: number[]) => void;
  deleteRound: (idx: number) => void;
  /** Trix: append a deal (per-player scores + deal meta), kept index-aligned
   * with trixMatch.rounds. Kingdom/King are derived from match progress. */
  addTrixDeal: (scores: number[], deal: TrixDeal) => void;
  /** Trix: replace a recorded deal's scores + payload (kingdom/King preserved). */
  editTrixDeal: (idx: number, scores: number[], deal: TrixDeal) => void;
  /** Trix: remove a recorded deal (scores + meta together). */
  deleteTrixDeal: (idx: number) => void;
  undoRound: () => void;
  resetGame: () => void;
  clearPlayers: () => void;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
  setKoutEntryMode: (mode: KoutEntryMode) => void;
  setEntryStyle: (style: EntryStyle) => void;
  setSebeetaView: (view: SebeetaView) => void;
  removeProfile: (key: string) => void;
  clearAllProfiles: () => void;
  removeRecentGame: (idx: number) => void;
  clearAllRecents: () => void;
  setSound: (sound: boolean) => void;
  /** Replace the entire persisted state (backup import). Always lands on home. */
  replaceState: (next: PersistedState) => void;
  /** Pull a finished game out of recentGames and load it as the active game for editing. */
  reopenRecentGame: (idx: number) => void;
};

type GameContextValue = {
  state: PersistedState;
  actions: GameActions;
};

const GameContext = createContext<GameContextValue | null>(null);

type GameProviderProps = {
  state: PersistedState;
  setState: Dispatch<SetStateAction<PersistedState>>;
  children: ReactNode;
};

export function GameProvider({ state, setState, children }: GameProviderProps) {
  const { t } = useLang();

  // teamName resolution that respects custom team-name overrides — used when
  // logging a finished game so the recent-games list shows the right label.
  const resolveTeamName = useCallback(
    (s: PersistedState, idx: 0 | 1): string => {
      const custom = s.teamNames[idx]?.trim();
      if (custom) return custom;
      return idx === 0 ? t('teamAFull') : t('teamBFull');
    },
    [t],
  );

  // Centralised score-update path. Two phases:
  //   (A) If the previous state had a logged game, reverse it — pop the
  //       orphan recentGames entry, decrement profile counters, clear the
  //       gameLogged flag. This keeps undo/edit/delete on a finished game
  //       symmetric with the forward path (legacy.html:2479 was forward-only).
  //   (B) Run the forward log on the new scores: detect winner, prepend to
  //       recentGames, upsert profiles, mark gameLogged.
  //
  // currentScreen handling:
  //   - Fresh transition (wasn't logged → now won): navigate to 'winner'.
  //   - Re-log (was logged → still won): preserve current screen so an edit
  //     from History doesn't yank the user to the Winner screen.
  //   - Un-win (was logged → no longer won): bounce off the now-stale Winner
  //     screen back to 'play'; otherwise leave screen alone.
  const applyScoresUpdate = useCallback(
    (
      prev: PersistedState,
      nextScores: number[][],
      // Trix only: the trixMatch that corresponds to `nextScores`, kept
      // index-aligned by the caller. Other modes pass nothing.
      nextTrixMatch?: TrixMatch,
    ): PersistedState => {
      const wasLogged = prev.gameLogged;
      const baseline = wasLogged ? reverseGameLog(prev) : prev;

      const trixMatch = nextTrixMatch ?? baseline.trixMatch;
      const probe = {
        ...baseline,
        scores: nextScores,
        ...(trixMatch ? { trixMatch } : {}),
      };
      const totalsArr = totals(probe);
      const winner = checkWinner(probe, totalsArr);
      const gameOver = winner !== null;

      let next: PersistedState = { ...probe, gameOver };

      if (winner !== null && baseline.players.length > 0) {
        const winnerName =
          winner.type === 'player'
            ? baseline.players[winner.idx] ?? ''
            : resolveTeamName(baseline, winner.idx);

        const teamScores: [number, number] | null =
          winner.type === 'team'
            ? baseline.gameMode === 'kout'
              ? [totalsArr[0] ?? 0, totalsArr[1] ?? 0]
              : teamTotalsFromPlayers(totalsArr, baseline.playerTeam)
            : null;
        const score =
          teamScores !== null && winner.type === 'team'
            ? `${teamScores[winner.idx]}–${teamScores[1 - winner.idx]}`
            : winner.type === 'player'
              ? `${totalsArr[winner.idx]}`
              : totalsArr.join(' / ');

        const recent: RecentGame = {
          kind: baseline.gameMode,
          players: baseline.players.slice(),
          teamNames: baseline.teamNames.slice(),
          when: Date.now(),
          roundCount: nextScores.length,
          winner: winnerName,
          score,
          // Round snapshot so the finished game can be reopened/inspected.
          scores: nextScores.map((r) => r.slice()),
          playerTeam: baseline.playerTeam.slice(),
          threshold: baseline.threshold,
          winRule: baseline.winRule,
          koutEntryMode: baseline.koutEntryMode,
          // Trix: snapshot the per-deal metadata so the finished game can be
          // grouped by kingdom in History and reopened for editing.
          ...(baseline.gameMode === 'trix' && trixMatch ? { trixMatch } : {}),
        };

        const winnerIdxSet = winnerPlayerIndices(baseline, winner);
        const playerProfiles = upsertProfiles(baseline, winnerIdxSet);

        next = {
          ...next,
          gameLogged: true,
          recentGames: [recent, ...baseline.recentGames].slice(0, 10),
          playerProfiles,
          currentScreen: wasLogged ? prev.currentScreen : 'winner',
        };
      } else if (wasLogged && prev.currentScreen === 'winner') {
        next = { ...next, currentScreen: 'play' };
      }

      return next;
    },
    [resolveTeamName],
  );

  const navigate = useCallback(
    (screen: Screen) => setState((s) => ({ ...s, currentScreen: screen })),
    [setState],
  );

  const pickGame = useCallback(
    (mode: GameMode) =>
      setState((s) => ({ ...s, gameMode: mode, currentScreen: 'setup' })),
    [setState],
  );

  const startGame = useCallback(
    (input: StartGameInput) => {
      setState((s) => {
        const base: PersistedState = {
          ...s,
          gameMode: input.mode,
          players: input.players.slice(),
          scores: [],
          gameOver: false,
          gameLogged: false,
          currentScreen: 'play',
          // Clear any prior game's Trix metadata; the trix branch re-adds it.
          trixMatch: undefined,
        };
        if (input.mode === 'trix') {
          const teams =
            !!input.partnership &&
            !!input.playerTeam &&
            input.playerTeam.length === input.players.length;
          return {
            ...base,
            // Deals are always entered per-player; teams only roll up the
            // standings/winner. playerTeam drives that rollup.
            playerTeam: teams ? input.playerTeam!.slice() : [],
            teamNames: teams && input.teamNames ? input.teamNames.slice() : [],
            threshold: 0, // unused — kingdoms-complete ends the game
            winRule: 'lowest',
            trixMatch: {
              partnership: teams,
              kingFirst: input.kingFirst,
              rounds: [],
            },
          };
        }
        if (input.mode === 'sebeeta') {
          return {
            ...base,
            playerTeam: input.playerTeam.slice(),
            teamNames: input.teamNames.slice(),
            threshold: input.threshold ?? 201,
            winRule: 'lowest',
          };
        }
        if (input.mode === 'kout') {
          return {
            ...base,
            playerTeam: input.playerTeam.slice(),
            teamNames: input.teamNames.slice(),
            threshold: input.threshold ?? 101,
            winRule: 'highest',
            koutEntryMode: 'contract',
          };
        }
        if (input.mode === 'custom') {
          const hasTeams =
            !!input.playerTeam &&
            input.playerTeam.length === input.players.length &&
            input.players.length > 0;
          return {
            ...base,
            playerTeam: hasTeams ? input.playerTeam!.slice() : [],
            teamNames: hasTeams && input.teamNames ? input.teamNames.slice() : [],
            threshold: input.threshold,
            winRule: input.winRule,
          };
        }
        // Exhaustiveness: every StartGameInput mode is handled above. Adding a
        // mode without a branch fails to compile; at runtime we fall back to
        // the base state rather than crash.
        return exhaustive(input, base);
      });
    },
    [setState],
  );

  const addRound = useCallback(
    (round: number[]) => {
      setState((s) => applyScoresUpdate(s, [...s.scores, round.slice()]));
    },
    [setState, applyScoresUpdate],
  );

  const editRound = useCallback(
    (idx: number, round: number[]) => {
      setState((s) => {
        const next = s.scores.map((r, i) => (i === idx ? round.slice() : r));
        return applyScoresUpdate(s, next);
      });
    },
    [setState, applyScoresUpdate],
  );

  const deleteRound = useCallback(
    (idx: number) => {
      setState((s) => {
        const next = s.scores.filter((_, i) => i !== idx);
        return applyScoresUpdate(s, next);
      });
    },
    [setState, applyScoresUpdate],
  );

  const undoRound = useCallback(() => {
    setState((s) => {
      if (s.scores.length === 0) return s;
      if (s.trixMatch) {
        const rounds = s.trixMatch.rounds.slice(0, -1);
        return applyScoresUpdate(s, s.scores.slice(0, -1), { ...s.trixMatch, rounds });
      }
      return applyScoresUpdate(s, s.scores.slice(0, -1));
    });
  }, [setState, applyScoresUpdate]);

  // --- Trix deal operations (keep scores ⇄ trixMatch.rounds index-aligned) ---
  const addTrixDeal = useCallback(
    (dealScores: number[], deal: TrixDeal) => {
      setState((s) => {
        if (!s.trixMatch) return s;
        const kingdom = trixCurrentKingdom(s.trixMatch.rounds);
        if (kingdom >= TRIX_KINGDOMS) return s; // match already complete
        const kingIdx = trixKingIdx(s.trixMatch.kingFirst, kingdom);
        const round: TrixRoundMeta = { ...deal, kingdom, kingIdx };
        const rounds = [...s.trixMatch.rounds, round];
        return applyScoresUpdate(s, [...s.scores, dealScores.slice()], {
          ...s.trixMatch,
          rounds,
        });
      });
    },
    [setState, applyScoresUpdate],
  );

  const editTrixDeal = useCallback(
    (idx: number, dealScores: number[], deal: TrixDeal) => {
      setState((s) => {
        if (!s.trixMatch) return s;
        const existing = s.trixMatch.rounds[idx];
        if (!existing) return s;
        // Preserve the deal's kingdom/King — only its payload + scores change.
        const round: TrixRoundMeta = {
          ...deal,
          kingdom: existing.kingdom,
          kingIdx: existing.kingIdx,
        };
        const rounds = s.trixMatch.rounds.map((r, i) => (i === idx ? round : r));
        const scores = s.scores.map((r, i) => (i === idx ? dealScores.slice() : r));
        return applyScoresUpdate(s, scores, { ...s.trixMatch, rounds });
      });
    },
    [setState, applyScoresUpdate],
  );

  const deleteTrixDeal = useCallback(
    (idx: number) => {
      setState((s) => {
        if (!s.trixMatch) return s;
        const rounds = s.trixMatch.rounds.filter((_, i) => i !== idx);
        const scores = s.scores.filter((_, i) => i !== idx);
        return applyScoresUpdate(s, scores, { ...s.trixMatch, rounds });
      });
    },
    [setState, applyScoresUpdate],
  );

  const resetGame = useCallback(() => {
    setState((s) => ({
      ...s,
      scores: [],
      gameOver: false,
      gameLogged: false,
      currentScreen: 'play',
      // Trix: replay the same match (same King + format) from kingdom 0.
      ...(s.trixMatch ? { trixMatch: { ...s.trixMatch, rounds: [] } } : {}),
    }));
  }, [setState]);

  const clearPlayers = useCallback(() => {
    setState((s) => ({
      ...DEFAULT_STATE,
      // Preserve user preferences across "new game with new players"
      lang: s.lang,
      theme: s.theme,
      koutEntryMode: s.koutEntryMode,
      entryStyle: s.entryStyle,
      recentGames: s.recentGames,
    }));
  }, [setState]);

  const setTheme = useCallback(
    (theme: Theme) => setState((s) => ({ ...s, theme })),
    [setState],
  );
  const setLang = useCallback(
    (lang: Lang) => setState((s) => ({ ...s, lang })),
    [setState],
  );
  const setKoutEntryMode = useCallback(
    (mode: KoutEntryMode) => setState((s) => ({ ...s, koutEntryMode: mode })),
    [setState],
  );
  const setEntryStyle = useCallback(
    (style: EntryStyle) => setState((s) => ({ ...s, entryStyle: style })),
    [setState],
  );
  const setSebeetaView = useCallback(
    (view: SebeetaView) => setState((s) => ({ ...s, sebeetaView: view })),
    [setState],
  );

  const removeProfile = useCallback(
    (key: string) =>
      setState((s) => {
        if (!(key in s.playerProfiles)) return s;
        const { [key]: _drop, ...rest } = s.playerProfiles;
        return { ...s, playerProfiles: rest };
      }),
    [setState],
  );

  const clearAllProfiles = useCallback(
    () => setState((s) => ({ ...s, playerProfiles: {} })),
    [setState],
  );

  const removeRecentGame = useCallback(
    (idx: number) =>
      setState((s) => {
        if (idx < 0 || idx >= s.recentGames.length) return s;
        return {
          ...s,
          recentGames: s.recentGames.filter((_, i) => i !== idx),
        };
      }),
    [setState],
  );

  const clearAllRecents = useCallback(
    () => setState((s) => ({ ...s, recentGames: [] })),
    [setState],
  );

  const setSound = useCallback(
    (sound: boolean) => setState((s) => ({ ...s, sound })),
    [setState],
  );

  const replaceState = useCallback(
    (next: PersistedState) =>
      // Land on home so the imported state can't drop the user into a stale
      // mid-game/winner screen that doesn't match what they expect.
      setState(() => ({ ...next, currentScreen: 'home' })),
    [setState],
  );

  // Reopen a finished game (from recentGames) as the active game so its rounds
  // can be inspected and corrected on the History screen. Reconstructs the
  // active-game fields from the stored snapshot, removes the entry from
  // recentGames (re-logged on the next score change via applyScoresUpdate),
  // and clears gameOver/gameLogged so editing re-evaluates from scratch.
  // No-op when the entry predates round-snapshot storage (no `scores`).
  const reopenRecentGame = useCallback(
    (idx: number) => {
      setState((s) => {
        const g = s.recentGames[idx];
        if (!g || !g.scores) return s;
        const hasTeams =
          !!g.playerTeam && g.playerTeam.length === g.players.length;
        return {
          ...s,
          gameMode: g.kind,
          players: g.players.slice(),
          teamNames: g.teamNames.slice(),
          playerTeam: hasTeams ? g.playerTeam!.slice() : [],
          scores: g.scores.map((r) => r.slice()),
          threshold: g.threshold ?? s.threshold,
          winRule:
            g.winRule ??
            (g.kind === 'sebeeta' ? 'lowest' : g.kind === 'kout' ? 'highest' : s.winRule),
          koutEntryMode: g.koutEntryMode ?? s.koutEntryMode,
          gameOver: false,
          gameLogged: false,
          recentGames: s.recentGames.filter((_, i) => i !== idx),
          currentScreen: 'history',
          // Trix: restore the per-deal metadata so History can group by kingdom.
          ...(g.kind === 'trix' && g.trixMatch ? { trixMatch: g.trixMatch } : { trixMatch: undefined }),
        };
      });
    },
    [setState],
  );

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      actions: {
        navigate,
        pickGame,
        startGame,
        addRound,
        editRound,
        deleteRound,
        addTrixDeal,
        editTrixDeal,
        deleteTrixDeal,
        undoRound,
        resetGame,
        clearPlayers,
        setTheme,
        setLang,
        setKoutEntryMode,
        setEntryStyle,
        setSebeetaView,
        removeProfile,
        clearAllProfiles,
        removeRecentGame,
        clearAllRecents,
        setSound,
        replaceState,
        reopenRecentGame,
      },
    }),
    [
      state,
      navigate,
      pickGame,
      startGame,
      addRound,
      editRound,
      deleteRound,
      addTrixDeal,
      editTrixDeal,
      deleteTrixDeal,
      undoRound,
      resetGame,
      clearPlayers,
      setTheme,
      setLang,
      setKoutEntryMode,
      setEntryStyle,
      setSebeetaView,
      removeProfile,
      clearAllProfiles,
      removeRecentGame,
      clearAllRecents,
      setSound,
      replaceState,
      reopenRecentGame,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
