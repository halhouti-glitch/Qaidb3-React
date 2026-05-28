import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { STORAGE_KEY, type PersistedState } from './state/persistedState';

// Pre-seed localStorage before App mounts so we control the starting state.
function seedState(over: Partial<PersistedState>) {
  const seed = {
    gameMode: 'sebeeta',
    players: [],
    playerTeam: [],
    teamNames: [],
    scores: [],
    threshold: 201,
    winRule: 'lowest',
    gameOver: false,
    gameLogged: false,
    lang: 'en',
    koutEntryMode: 'contract',
    entryStyle: 'pm',
    currentScreen: 'home',
    recentGames: [],
    theme: 'light',
    playerProfiles: {},
    sound: false,
    ...over,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
}

describe('App — screen-transition direction', () => {
  beforeEach(() => {
    // App reads localStorage at mount; tests below seed it per case.
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('starts with data-direction="forward" on first paint', () => {
    seedState({ currentScreen: 'home' });
    const { container } = render(<App />);
    const root = container.querySelector('.container') as HTMLElement;
    expect(root.getAttribute('data-direction')).toBe('forward');
  });

  it('home → setup is a forward transition (depth 0 → 1)', () => {
    seedState({ currentScreen: 'home' });
    const { container, getByText } = render(<App />);
    // Click the Sebeeta game card.
    act(() => {
      fireEvent.click(getByText('Sebeeta'));
    });
    const root = container.querySelector('.container') as HTMLElement;
    expect(root.getAttribute('data-direction')).toBe('forward');
  });

  it('history → play is a back transition (depth 3 → 2)', () => {
    seedState({
      currentScreen: 'history',
      players: ['A', 'B', 'C', 'D', 'E', 'F'],
      playerTeam: [0, 0, 0, 1, 1, 1],
      teamNames: ['Alpha', 'Bravo'],
      scores: [[10, 0, 0, 0, 0, 0]],
    });
    const { container, getByLabelText } = render(<App />);
    // History header back button uses goBack label.
    act(() => {
      fireEvent.click(getByLabelText('Back'));
    });
    const root = container.querySelector('.container') as HTMLElement;
    expect(root.getAttribute('data-direction')).toBe('back');
  });

  it('renders the seeded screen on first paint', () => {
    seedState({
      currentScreen: 'setup',
      gameMode: 'sebeeta',
    });
    const { getByText } = render(<App />);
    // SetupScreen renders 'Start game' button.
    expect(getByText('Start game')).toBeDefined();
  });
});
