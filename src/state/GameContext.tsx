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
  type Theme,
  type WinRule,
} from './persistedState';
import type { Lang } from '../i18n/strings';
import { useLang } from '../i18n/LangContext';
import { checkWinner, teamTotalsFromPlayers, totals } from '../engine/scoring';

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
    };

export type GameActions = {
  navigate: (screen: Screen) => void;
  pickGame: (mode: GameMode) => void;
  startGame: (input: StartGameInput) => void;
  addRound: (round: number[]) => void;
  editRound: (idx: number, round: number[]) => void;
  deleteRound: (idx: number) => void;
  undoRound: () => void;
  resetGame: () => void;
  clearPlayers: () => void;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
  setKoutEntryMode: (mode: KoutEntryMode) => void;
  setEntryStyle: (style: EntryStyle) => void;
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

  // Centralised score-update path: after any change to `scores`, recompute
  // winner / gameOver and log the finished game once (legacy.html:2479).
  const applyScoresUpdate = useCallback(
    (prev: PersistedState, nextScores: number[][]): PersistedState => {
      const probe = { ...prev, scores: nextScores };
      const totalsArr = totals(probe);
      const winner = checkWinner(probe, totalsArr);
      const gameOver = winner !== null;

      let next: PersistedState = { ...probe, gameOver };

      if (winner !== null && !prev.gameLogged && prev.players.length > 0) {
        const winnerName =
          winner.type === 'player'
            ? prev.players[winner.idx] ?? ''
            : resolveTeamName(prev, winner.idx);

        const teamScores: [number, number] | null =
          winner.type === 'team'
            ? prev.gameMode === 'kout'
              ? [totalsArr[0] ?? 0, totalsArr[1] ?? 0]
              : teamTotalsFromPlayers(totalsArr, prev.playerTeam)
            : null;
        const score =
          teamScores !== null && winner.type === 'team'
            ? `${teamScores[winner.idx]}–${teamScores[1 - winner.idx]}`
            : winner.type === 'player'
              ? `${totalsArr[winner.idx]}`
              : totalsArr.join(' / ');

        const recent: RecentGame = {
          kind: prev.gameMode,
          players: prev.players.slice(),
          teamNames: prev.teamNames.slice(),
          when: Date.now(),
          roundCount: nextScores.length,
          winner: winnerName,
          score,
        };

        next = {
          ...next,
          gameLogged: true,
          recentGames: [recent, ...prev.recentGames].slice(0, 10),
          currentScreen: 'winner',
        };
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
        };
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
      return applyScoresUpdate(s, s.scores.slice(0, -1));
    });
  }, [setState, applyScoresUpdate]);

  const resetGame = useCallback(() => {
    setState((s) => ({
      ...s,
      scores: [],
      gameOver: false,
      gameLogged: false,
      currentScreen: 'play',
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
        undoRound,
        resetGame,
        clearPlayers,
        setTheme,
        setLang,
        setKoutEntryMode,
        setEntryStyle,
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
      undoRound,
      resetGame,
      clearPlayers,
      setTheme,
      setLang,
      setKoutEntryMode,
      setEntryStyle,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
