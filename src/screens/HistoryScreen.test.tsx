import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistoryScreen } from './HistoryScreen';
import { renderWithGame } from '../test/harness';
import { upsertProfiles, winnerPlayerIndices } from '../state/profiles';
import { checkWinner, totals } from '../engine/scoring';
import {
  DEFAULT_STATE,
  type PersistedState,
  type RecentGame,
} from '../state/persistedState';

const ROSTER = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
const TEAM = [0, 0, 0, 1, 1, 1];

const sebeetaInProgress = {
  gameMode: 'sebeeta' as const,
  currentScreen: 'history' as const,
  players: ROSTER,
  playerTeam: TEAM,
  teamNames: ['Alpha', 'Bravo'],
  threshold: 201,
  winRule: 'lowest' as const,
  scores: [
    [10, 5, 0, 0, 0, 0],
    [20, 5, 5, 0, 0, 0],
  ],
};

// Build a sebeeta state that simulates the result of applyScoresUpdate's
// forward log: gameOver, gameLogged, head recentGame populated, profiles
// upserted. Used to test the reverse-log path through HistoryScreen's
// delete/edit actions.
function loggedSebeetaState(): Partial<PersistedState> {
  const baseScores: number[][] = [
    [100, 30, 20, 10, 10, 10],
    [105, 30, 20, 10, 10, 10],
  ];
  const base: PersistedState = {
    ...DEFAULT_STATE,
    lang: 'en',
    sound: false,
    gameMode: 'sebeeta',
    currentScreen: 'history',
    players: ROSTER,
    playerTeam: TEAM,
    teamNames: ['Alpha', 'Bravo'],
    threshold: 201,
    winRule: 'lowest',
    scores: baseScores,
    gameOver: true,
    gameLogged: true,
  };
  const winner = checkWinner(base, totals(base))!;
  const playerProfiles = upsertProfiles(base, winnerPlayerIndices(base, winner));
  const head: RecentGame = {
    kind: 'sebeeta',
    players: ROSTER.slice(),
    teamNames: ['Alpha', 'Bravo'],
    when: 1234,
    roundCount: baseScores.length,
    winner: 'Bravo',
    score: '60–60',
  };
  return { ...base, playerProfiles, recentGames: [head] };
}

describe('HistoryScreen — basic rendering and editing', () => {
  it('renders one card per round', () => {
    const { container } = renderWithGame(<HistoryScreen />, {
      initial: sebeetaInProgress,
    });
    const cards = container.querySelectorAll('.history-card');
    expect(cards.length).toBe(2);
  });

  it('editing a round and saving updates state.scores', () => {
    const { api, getAllByLabelText, getByText, getByLabelText } = renderWithGame(
      <HistoryScreen />,
      { initial: sebeetaInProgress },
    );
    // Click the first round's edit pencil.
    act(() => {
      fireEvent.click(getAllByLabelText('Edit')[0]);
    });
    const inputA1 = getByLabelText('A1') as HTMLInputElement;
    act(() => {
      fireEvent.change(inputA1, { target: { value: '42' } });
    });
    act(() => {
      fireEvent.click(getByText('Save'));
    });
    expect(api.state.scores[0][0]).toBe(42);
  });

  it('deleting a round opens the confirm sheet and removes it on confirm', () => {
    const { api, getAllByLabelText, getAllByText } = renderWithGame(<HistoryScreen />, {
      initial: sebeetaInProgress,
    });
    act(() => {
      fireEvent.click(getAllByLabelText('Delete')[1]); // delete second round
    });
    // ConfirmSheet's confirm button reuses the 'Delete' label.
    const deleteButtons = getAllByText('Delete');
    act(() => {
      fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    });
    expect(api.state.scores).toHaveLength(1);
    expect(api.state.scores[0]).toEqual([10, 5, 0, 0, 0, 0]);
  });
});

describe('HistoryScreen — reverse-log integration (the bug fix)', () => {
  it('deleting the round that pushed past threshold un-wins the game and clears the log', () => {
    const { api, getAllByLabelText, getAllByText } = renderWithGame(<HistoryScreen />, {
      initial: loggedSebeetaState(),
    });
    expect(api.state.gameOver).toBe(true);
    expect(api.state.gameLogged).toBe(true);
    expect(api.state.recentGames).toHaveLength(1);

    // Click the trash icon on round 2 (idx 1) — the one that put p0 past 201.
    act(() => {
      fireEvent.click(getAllByLabelText('Delete')[1]);
    });
    // Confirm via the sheet's Delete button.
    const deleteButtons = getAllByText('Delete');
    act(() => {
      fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    });
    expect(api.state.gameOver).toBe(false);
    expect(api.state.gameLogged).toBe(false);
    expect(api.state.recentGames).toEqual([]);
    expect(Object.keys(api.state.playerProfiles)).toEqual([]);
    // currentScreen stays 'history' — user wasn't on the winner screen, no bounce.
    expect(api.state.currentScreen).toBe('history');
  });

  it('editing a still-winning round re-logs without yanking off the History screen', () => {
    const { api, getAllByLabelText, getByText, getByLabelText } = renderWithGame(
      <HistoryScreen />,
      { initial: loggedSebeetaState() },
    );
    expect(api.state.currentScreen).toBe('history');

    act(() => {
      fireEvent.click(getAllByLabelText('Edit')[1]);
    });
    const inputA1 = getByLabelText('A1') as HTMLInputElement;
    act(() => {
      fireEvent.change(inputA1, { target: { value: '120' } }); // still > 201 total
    });
    act(() => {
      fireEvent.click(getByText('Save'));
    });
    expect(api.state.gameOver).toBe(true);
    expect(api.state.gameLogged).toBe(true);
    expect(api.state.currentScreen).toBe('history'); // no yank to winner
    expect(api.state.recentGames).toHaveLength(1); // re-logged, not duplicated
    expect(api.state.playerProfiles.a1.gamesPlayed).toBe(1); // no double-count
  });
});
