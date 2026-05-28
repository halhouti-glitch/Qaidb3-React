// Integration tests for GameContext — exercises the applyScoresUpdate
// state-machine wiring (reverse log then forward log, plus navigation
// branches) and the side-action behavior (reset / clearPlayers / start).
// Pure-helper coverage lives in profiles.test.ts and gameLog.test.ts.
import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithGame } from '../test/harness';

const SEBEETA_ROSTER = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
const SEBEETA_TEAM = [0, 0, 0, 1, 1, 1];

// Sebeeta: p0 belongs to team 0; if p0's individual total >= 201 the engine
// reports team 1 as the winner. We use chunks of [200, 0, ...] for clarity.
function sebeetaStart(api: ReturnType<typeof renderWithGame>['api']) {
  act(() => {
    api.actions.startGame({
      mode: 'sebeeta',
      players: SEBEETA_ROSTER,
      playerTeam: SEBEETA_TEAM,
      teamNames: ['Alpha', 'Bravo'],
      threshold: 201,
    });
  });
}

describe('GameContext — forward path', () => {
  it('addRound that crosses threshold navigates to winner and logs', () => {
    const { api } = renderWithGame(null);
    sebeetaStart(api);
    act(() => {
      api.actions.addRound([100, 0, 0, 0, 0, 0]);
    });
    expect(api.state.gameOver).toBe(false);
    expect(api.state.currentScreen).toBe('play');

    act(() => {
      api.actions.addRound([105, 0, 0, 0, 0, 0]);
    });
    expect(api.state.gameOver).toBe(true);
    expect(api.state.gameLogged).toBe(true);
    expect(api.state.currentScreen).toBe('winner');
    expect(api.state.recentGames).toHaveLength(1);
    expect(api.state.recentGames[0].winner).toBe('Bravo');
    expect(api.state.playerProfiles.a1.gamesPlayed).toBe(1);
    expect(api.state.playerProfiles.b1.gamesPlayed).toBe(1);
    expect(api.state.playerProfiles.b1.wins).toBe(1);
    expect(api.state.playerProfiles.a1.wins).toBe(0);
  });
});

describe('GameContext — reverse path (the bug fix)', () => {
  it('undoRound on a finished game pops the orphan recent entry and reverts profiles', () => {
    const { api } = renderWithGame(null);
    sebeetaStart(api);
    act(() => {
      api.actions.addRound([100, 0, 0, 0, 0, 0]);
      api.actions.addRound([105, 0, 0, 0, 0, 0]);
    });
    expect(api.state.gameOver).toBe(true);
    expect(api.state.recentGames).toHaveLength(1);

    act(() => {
      api.actions.undoRound();
    });
    expect(api.state.gameOver).toBe(false);
    expect(api.state.gameLogged).toBe(false);
    expect(api.state.recentGames).toEqual([]);
    // All 6 players had gamesPlayed:1 from the log; reverse drops them to 0
    // and the helper deletes zero-counter entries.
    expect(Object.keys(api.state.playerProfiles)).toEqual([]);
  });

  it('undoRound on a finished game bounces from winner screen to play', () => {
    const { api } = renderWithGame(null);
    sebeetaStart(api);
    act(() => {
      api.actions.addRound([100, 0, 0, 0, 0, 0]);
      api.actions.addRound([105, 0, 0, 0, 0, 0]);
    });
    expect(api.state.currentScreen).toBe('winner');
    act(() => {
      api.actions.undoRound();
    });
    expect(api.state.currentScreen).toBe('play');
  });

  it('editRound that keeps the same winner re-logs without yanking from history', () => {
    const { api } = renderWithGame(null);
    sebeetaStart(api);
    act(() => {
      api.actions.addRound([100, 0, 0, 0, 0, 0]);
      api.actions.addRound([105, 0, 0, 0, 0, 0]);
    });
    // Simulate user navigating to history while the game is still won.
    act(() => {
      api.actions.navigate('history');
    });
    expect(api.state.currentScreen).toBe('history');

    act(() => {
      // Bumps round 2 — total still >= 201, winner unchanged
      api.actions.editRound(1, [110, 0, 0, 0, 0, 0]);
    });
    expect(api.state.gameOver).toBe(true);
    expect(api.state.gameLogged).toBe(true);
    expect(api.state.currentScreen).toBe('history'); // no yank
    expect(api.state.recentGames).toHaveLength(1); // re-logged, not duplicated
    // gamesPlayed should not double-count after re-log
    expect(api.state.playerProfiles.a1.gamesPlayed).toBe(1);
    expect(api.state.playerProfiles.b1.wins).toBe(1);
  });

  it('editRound that flips the winner replaces the recent-games entry', () => {
    const { api } = renderWithGame(null);
    sebeetaStart(api);
    act(() => {
      api.actions.addRound([100, 0, 0, 0, 0, 0]);
      api.actions.addRound([105, 0, 0, 0, 0, 0]);
    });
    // First win: team 1 (Bravo) wins (since p0 of team 0 crossed)
    expect(api.state.recentGames[0].winner).toBe('Bravo');
    expect(api.state.playerProfiles.b1.wins).toBe(1);
    expect(api.state.playerProfiles.a1.wins).toBe(0);

    // Edit round 1 so p3 (team 1) crosses instead of p0
    act(() => {
      api.actions.editRound(0, [0, 0, 0, 250, 0, 0]);
    });
    expect(api.state.recentGames).toHaveLength(1);
    expect(api.state.recentGames[0].winner).toBe('Alpha');
    expect(api.state.playerProfiles.a1.wins).toBe(1);
    expect(api.state.playerProfiles.b1.wins).toBe(0);
  });

  it('deleteRound that un-wins clears the log and bounces off the winner screen', () => {
    const { api } = renderWithGame(null);
    sebeetaStart(api);
    act(() => {
      api.actions.addRound([100, 0, 0, 0, 0, 0]);
      api.actions.addRound([105, 0, 0, 0, 0, 0]);
    });
    expect(api.state.currentScreen).toBe('winner');

    // Delete the round that pushed p0 past threshold (round 2, idx 1)
    act(() => {
      api.actions.deleteRound(1);
    });
    expect(api.state.gameOver).toBe(false);
    expect(api.state.gameLogged).toBe(false);
    expect(api.state.recentGames).toEqual([]);
    expect(api.state.currentScreen).toBe('play');
    expect(api.state.scores).toEqual([[100, 0, 0, 0, 0, 0]]);
  });
});

describe('GameContext — actions that should NOT reverse the log', () => {
  it('resetGame preserves the logged finished game (rematch flow)', () => {
    const { api } = renderWithGame(null);
    sebeetaStart(api);
    act(() => {
      api.actions.addRound([100, 0, 0, 0, 0, 0]);
      api.actions.addRound([105, 0, 0, 0, 0, 0]);
    });
    expect(api.state.recentGames).toHaveLength(1);
    const profilesSnapshot = api.state.playerProfiles;

    act(() => {
      api.actions.resetGame();
    });
    expect(api.state.scores).toEqual([]);
    expect(api.state.gameOver).toBe(false);
    expect(api.state.gameLogged).toBe(false);
    expect(api.state.currentScreen).toBe('play');
    expect(api.state.recentGames).toHaveLength(1); // log retained
    expect(api.state.playerProfiles).toEqual(profilesSnapshot); // stats retained
  });

  it('clearPlayers preserves recentGames history', () => {
    const { api } = renderWithGame(null);
    sebeetaStart(api);
    act(() => {
      api.actions.addRound([100, 0, 0, 0, 0, 0]);
      api.actions.addRound([105, 0, 0, 0, 0, 0]);
    });
    expect(api.state.recentGames).toHaveLength(1);

    act(() => {
      api.actions.clearPlayers();
    });
    expect(api.state.players).toEqual([]);
    expect(api.state.recentGames).toHaveLength(1);
    expect(api.state.currentScreen).toBe('home');
  });
});

describe('GameContext — Kout team flow', () => {
  it('logs a team win with correct margin string and credits both team members', () => {
    const { api } = renderWithGame(null);
    act(() => {
      api.actions.startGame({
        mode: 'kout',
        players: SEBEETA_ROSTER,
        playerTeam: SEBEETA_TEAM,
        teamNames: ['Alpha', 'Bravo'],
        threshold: 101,
      });
    });
    act(() => {
      api.actions.addRound([60, 20]);
      api.actions.addRound([60, 20]);
    });
    expect(api.state.gameOver).toBe(true);
    expect(api.state.recentGames[0].kind).toBe('kout');
    expect(api.state.recentGames[0].winner).toBe('Alpha');
    expect(api.state.recentGames[0].score).toBe('120–40');
    // Kout is team mode → every Alpha player gets a win credit
    expect(api.state.playerProfiles.a1.wins).toBe(1);
    expect(api.state.playerProfiles.a2.wins).toBe(1);
    expect(api.state.playerProfiles.a3.wins).toBe(1);
    expect(api.state.playerProfiles.b1.wins).toBe(0);
    // Teammates rolled up — a1's partners are a2 + a3
    expect(api.state.playerProfiles.a1.teammates).toEqual({ a2: 1, a3: 1 });
  });
});
