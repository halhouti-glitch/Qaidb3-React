import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeScreen } from './HomeScreen';
import { renderWithGame } from '../test/harness';
import type { RecentGame } from '../state/persistedState';

const seededRecents: RecentGame[] = [
  {
    kind: 'sebeeta',
    players: ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'],
    teamNames: ['Alpha', 'Bravo'],
    when: Date.now() - 60_000,
    roundCount: 4,
    winner: 'Bravo',
    score: '120–80',
  },
  {
    kind: 'kout',
    players: ['X1', 'X2', 'X3', 'Y1', 'Y2', 'Y3'],
    teamNames: ['Reds', 'Blues'],
    when: Date.now() - 120_000,
    roundCount: 3,
    winner: 'Reds',
    score: '110–40',
  },
];

describe('HomeScreen — game-mode picker', () => {
  it('renders all three game-mode cards', () => {
    const { getByText } = renderWithGame(<HomeScreen />);
    expect(getByText('Sebeeta')).toBeDefined();
    expect(getByText('Kout')).toBeDefined();
    expect(getByText('Custom')).toBeDefined();
  });

  it('clicking the Sebeeta card calls pickGame and routes to setup', () => {
    const { api, getByText } = renderWithGame(<HomeScreen />);
    act(() => {
      fireEvent.click(getByText('Sebeeta'));
    });
    expect(api.state.gameMode).toBe('sebeeta');
    expect(api.state.currentScreen).toBe('setup');
  });

  it('clicking the Kout card sets gameMode=kout', () => {
    const { api, getByText } = renderWithGame(<HomeScreen />);
    act(() => {
      fireEvent.click(getByText('Kout'));
    });
    expect(api.state.gameMode).toBe('kout');
    expect(api.state.currentScreen).toBe('setup');
  });
});

describe('HomeScreen — header toggles', () => {
  it('theme toggle flips light → dark', () => {
    const { api, getByLabelText } = renderWithGame(<HomeScreen />, {
      initial: { theme: 'light' },
    });
    act(() => {
      fireEvent.click(getByLabelText('Theme'));
    });
    expect(api.state.theme).toBe('dark');
  });

  it('sound toggle flips sound off when on', () => {
    const { api, getByLabelText } = renderWithGame(<HomeScreen />, {
      initial: { sound: true },
    });
    act(() => {
      fireEvent.click(getByLabelText('Sound'));
    });
    expect(api.state.sound).toBe(false);
  });

  it('language picker switches lang from en to ar', () => {
    const { api, getByLabelText } = renderWithGame(<HomeScreen />, {
      initial: { lang: 'en' },
    });
    const select = getByLabelText('Language') as HTMLSelectElement;
    act(() => {
      fireEvent.change(select, { target: { value: 'ar' } });
    });
    expect(api.state.lang).toBe('ar');
  });
});

describe('HomeScreen — recent games', () => {
  it('does not render the recents section when empty', () => {
    const { queryByText } = renderWithGame(<HomeScreen />);
    expect(queryByText('Recent games')).toBeNull();
  });

  it('renders one row per recent and shows the winner label', () => {
    const { container, getByText } = renderWithGame(<HomeScreen />, {
      initial: { recentGames: seededRecents },
    });
    const rows = container.querySelectorAll('.recent-row');
    expect(rows.length).toBe(2);
    expect(getByText('Bravo')).toBeDefined();
    expect(getByText('Reds')).toBeDefined();
  });

  it('the × button removes a single recent without confirm', () => {
    const { api, container } = renderWithGame(<HomeScreen />, {
      initial: { recentGames: seededRecents },
    });
    const removeBtns = container.querySelectorAll('.recent-remove');
    act(() => {
      fireEvent.click(removeBtns[0]);
    });
    expect(api.state.recentGames).toHaveLength(1);
    expect(api.state.recentGames[0].winner).toBe('Reds');
  });

  it('Clear all opens the confirm sheet and wipes recents on confirm', () => {
    const { api, getAllByText } = renderWithGame(<HomeScreen />, {
      initial: { recentGames: seededRecents },
    });
    // The header has a "Clear all" link button.
    act(() => {
      fireEvent.click(getAllByText('Clear')[0]);
    });
    // ConfirmSheet's confirm button reuses the same label.
    const confirms = getAllByText('Clear');
    act(() => {
      fireEvent.click(confirms[confirms.length - 1]);
    });
    expect(api.state.recentGames).toEqual([]);
  });
});

describe('HomeScreen — resume CTA', () => {
  it('renders Resume button when an active game is mid-play', () => {
    const { getByText } = renderWithGame(<HomeScreen />, {
      initial: {
        players: ['A1', 'A2'],
        scores: [[10, 5]],
        gameOver: false,
      },
    });
    expect(getByText('Resume current game')).toBeDefined();
  });

  it('hides Resume when scores are empty', () => {
    const { queryByText } = renderWithGame(<HomeScreen />, {
      initial: { players: ['A1'], scores: [] },
    });
    expect(queryByText('Resume current game')).toBeNull();
  });

  it('hides Resume when the game is over', () => {
    const { queryByText } = renderWithGame(<HomeScreen />, {
      initial: {
        players: ['A1', 'A2'],
        scores: [[10, 5]],
        gameOver: true,
      },
    });
    expect(queryByText('Resume current game')).toBeNull();
  });

  it('clicking Resume navigates to play', () => {
    const { api, getByText } = renderWithGame(<HomeScreen />, {
      initial: {
        players: ['A1', 'A2'],
        scores: [[10, 5]],
        gameOver: false,
      },
    });
    act(() => {
      fireEvent.click(getByText('Resume current game'));
    });
    expect(api.state.currentScreen).toBe('play');
  });
});
