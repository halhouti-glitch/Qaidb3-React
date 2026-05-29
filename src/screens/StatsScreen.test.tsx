import { describe, it, expect } from 'vitest';
import { renderWithGame } from '../test/harness';
import { StatsScreen } from './StatsScreen';
import type { Profile, RecentGame } from '../state/persistedState';

describe('StatsScreen', () => {
  it('shows the empty state with no data', () => {
    const { getByText } = renderWithGame(<StatsScreen />);
    expect(getByText('Play a game to see your stats.')).toBeDefined();
  });

  it('renders the leaderboard and win rate from profiles', () => {
    const profiles: Record<string, Profile> = {
      sam: { name: 'Sam', gamesPlayed: 3, wins: 2, lastPlayed: 0, teammates: {} },
    };
    const recents: RecentGame[] = [
      {
        kind: 'custom',
        players: ['Sam'],
        teamNames: [],
        when: 1,
        roundCount: 1,
        winner: 'Sam',
        score: '10',
      },
    ];
    const { getByText, getAllByText } = renderWithGame(<StatsScreen />, {
      initial: { playerProfiles: profiles, recentGames: recents },
    });
    expect(getByText('Leaderboard')).toBeDefined();
    // "Sam" shows in both the leaderboard and the recent-games list.
    expect(getAllByText('Sam').length).toBeGreaterThan(0);
    expect(getByText('67%')).toBeDefined(); // round(2/3)
  });
});
