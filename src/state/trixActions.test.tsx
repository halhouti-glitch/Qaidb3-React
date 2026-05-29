import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithGame } from '../test/harness';
import type { RecentGame, TrixDeal } from './persistedState';

const PLAYERS = ['A', 'B', 'C', 'D'];

// Add the maximal-merge kingdom (all 4 penalties together + Trix) for one
// kingdom. Penalty deltas + ladder are arbitrary but sum to the canonical
// totals so the checksum would pass.
function playKingdom(
  add: (scores: number[], deal: TrixDeal) => void,
) {
  // All four penalties on player 0 (+500), Trix ladder spread across seats.
  add([500, 0, 0, 0], { kind: 'penalty', contracts: ['kingOfHearts', 'queens', 'diamonds', 'tricks'] });
  add([-200, -150, -100, -50], { kind: 'trix' });
}

describe('startGame — trix', () => {
  it('locks 4 individual players and seeds an empty trixMatch', () => {
    const { api } = renderWithGame(null);
    act(() => api.actions.startGame({ mode: 'trix', players: PLAYERS, kingFirst: 2 }));
    expect(api.state.gameMode).toBe('trix');
    expect(api.state.players).toEqual(PLAYERS);
    expect(api.state.playerTeam).toEqual([]);
    expect(api.state.winRule).toBe('lowest');
    expect(api.state.trixMatch).toEqual({ partnership: false, kingFirst: 2, rounds: [] });
    expect(api.state.currentScreen).toBe('play');
  });

  it('configures a 2v2 partnership (across pairing) when teams are passed', () => {
    const { api } = renderWithGame(null);
    act(() =>
      api.actions.startGame({
        mode: 'trix',
        players: PLAYERS,
        kingFirst: 1,
        partnership: true,
        playerTeam: [0, 1, 0, 1],
        teamNames: ['Reds', 'Blues'],
      }),
    );
    expect(api.state.playerTeam).toEqual([0, 1, 0, 1]);
    expect(api.state.teamNames).toEqual(['Reds', 'Blues']);
    expect(api.state.trixMatch?.partnership).toBe(true);
  });

  it('falls back to individual when partnership is set without a playerTeam', () => {
    const { api } = renderWithGame(null);
    act(() =>
      api.actions.startGame({ mode: 'trix', players: PLAYERS, kingFirst: 0, partnership: true }),
    );
    expect(api.state.trixMatch?.partnership).toBe(false);
    expect(api.state.playerTeam).toEqual([]);
  });

  it('clears a prior game trixMatch when starting a non-trix game', () => {
    const { api } = renderWithGame(null);
    act(() => api.actions.startGame({ mode: 'trix', players: PLAYERS, kingFirst: 0 }));
    act(() =>
      api.actions.startGame({
        mode: 'custom',
        players: ['X', 'Y'],
        threshold: 100,
        winRule: 'highest',
      }),
    );
    expect(api.state.trixMatch).toBeUndefined();
  });
});

describe('addTrixDeal — kingdom/King derivation + index alignment', () => {
  it('derives kingdom 0 + King = kingFirst for the first deal', () => {
    const { api } = renderWithGame(null);
    act(() => api.actions.startGame({ mode: 'trix', players: PLAYERS, kingFirst: 2 }));
    act(() =>
      api.actions.addTrixDeal([75, 0, 0, 0], { kind: 'penalty', contracts: ['kingOfHearts'] }),
    );
    expect(api.state.scores).toEqual([[75, 0, 0, 0]]);
    expect(api.state.trixMatch?.rounds).toEqual([
      { kind: 'penalty', contracts: ['kingOfHearts'], kingdom: 0, kingIdx: 2 },
    ]);
  });

  it('advances to kingdom 1 (King advances by seat) once kingdom 0 completes', () => {
    const { api } = renderWithGame(null);
    act(() => api.actions.startGame({ mode: 'trix', players: PLAYERS, kingFirst: 2 }));
    act(() => playKingdom(api.actions.addTrixDeal));
    // Next deal belongs to kingdom 1, King = (2+1) mod 4 = 3.
    act(() => api.actions.addTrixDeal([75, 0, 0, 0], { kind: 'penalty', contracts: ['kingOfHearts'] }));
    const last = api.state.trixMatch!.rounds.at(-1)!;
    expect(last.kingdom).toBe(1);
    expect(last.kingIdx).toBe(3);
  });
});

describe('trix game completion', () => {
  it('logs a finished game + navigates to winner after all 4 kingdoms', () => {
    const { api } = renderWithGame(null);
    act(() => api.actions.startGame({ mode: 'trix', players: PLAYERS, kingFirst: 0 }));
    // Player 0 eats every penalty (+500 ×4 = +2000), ladder gives others −.
    act(() => {
      for (let k = 0; k < 4; k++) playKingdom(api.actions.addTrixDeal);
    });
    expect(api.state.gameOver).toBe(true);
    expect(api.state.gameLogged).toBe(true);
    expect(api.state.currentScreen).toBe('winner');
    // Lowest total wins. Totals: p0 = 2000-800=1200; p1=-600; p2=-400; p3=-200.
    // Lowest is p1 (got -150 ×4 = -600).
    const head = api.state.recentGames[0];
    expect(head.kind).toBe('trix');
    expect(head.winner).toBe('B');
    expect(head.trixMatch?.rounds).toHaveLength(8);
  });

  it('un-wins and reopens for editing when a deal is deleted', () => {
    const { api } = renderWithGame(null);
    act(() => api.actions.startGame({ mode: 'trix', players: PLAYERS, kingFirst: 0 }));
    act(() => {
      for (let k = 0; k < 4; k++) playKingdom(api.actions.addTrixDeal);
    });
    expect(api.state.gameOver).toBe(true);
    // Delete the last Trix deal — kingdom 3 becomes incomplete → game un-wins.
    act(() => api.actions.deleteTrixDeal(api.state.scores.length - 1));
    expect(api.state.gameOver).toBe(false);
    expect(api.state.scores).toHaveLength(7);
    expect(api.state.trixMatch?.rounds).toHaveLength(7);
    // The orphan recent-games entry was reversed.
    expect(api.state.recentGames).toHaveLength(0);
  });
});

describe('reopenRecentGame — trix', () => {
  it('restores the trixMatch snapshot', () => {
    const finished: RecentGame = {
      kind: 'trix',
      players: PLAYERS,
      teamNames: [],
      when: 1,
      roundCount: 2,
      winner: 'A',
      score: '-300',
      scores: [
        [500, 0, 0, 0],
        [-200, -150, -100, -50],
      ],
      playerTeam: [],
      winRule: 'lowest',
      trixMatch: {
        partnership: false,
        kingFirst: 0,
        rounds: [
          { kind: 'penalty', contracts: ['kingOfHearts', 'queens', 'diamonds', 'tricks'], kingdom: 0, kingIdx: 0 },
          { kind: 'trix', kingdom: 0, kingIdx: 0 },
        ],
      },
    };
    const { api } = renderWithGame(null, { initial: { recentGames: [finished] } });
    act(() => api.actions.reopenRecentGame(0));
    expect(api.state.gameMode).toBe('trix');
    expect(api.state.trixMatch).toEqual(finished.trixMatch);
    expect(api.state.currentScreen).toBe('history');
  });
});
