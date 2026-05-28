import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SetupScreen } from './SetupScreen';
import { renderWithGame } from '../test/harness';

describe('SetupScreen', () => {
  it('renders default Sebeeta roster (6 players) and starts a game on submit', () => {
    const { api, getByText, getByDisplayValue } = renderWithGame(<SetupScreen />, {
      initial: { gameMode: 'sebeeta', currentScreen: 'setup' },
    });
    expect(getByDisplayValue('Player 1')).toBeDefined();
    expect(getByDisplayValue('Player 6')).toBeDefined();

    act(() => {
      fireEvent.click(getByText('Start game'));
    });
    expect(api.state.currentScreen).toBe('play');
    expect(api.state.gameMode).toBe('sebeeta');
    expect(api.state.players).toHaveLength(6);
    expect(api.state.players[0]).toBe('Player 1');
    expect(api.state.playerTeam).toEqual([0, 1, 0, 1, 0, 1]);
    expect(api.state.threshold).toBe(201);
    expect(api.state.scores).toEqual([]);
  });

  it('switching player count to 4 shrinks the roster and starts a 4-player game', () => {
    const { api, getByText, queryByDisplayValue } = renderWithGame(<SetupScreen />, {
      initial: { gameMode: 'kout', currentScreen: 'setup' },
    });

    // Player count chip "4" — narrow to <button> to avoid matching seat numbers.
    act(() => {
      fireEvent.click(getByText('4', { selector: 'button' }));
    });
    expect(queryByDisplayValue('Player 5')).toBeNull();
    expect(queryByDisplayValue('Player 4')).not.toBeNull();

    act(() => {
      fireEvent.click(getByText('Start game'));
    });
    expect(api.state.players).toHaveLength(4);
    expect(api.state.gameMode).toBe('kout');
    expect(api.state.threshold).toBe(101);
  });

  it('edits to player names persist into the started game', () => {
    const { api, getByText, getByDisplayValue } = renderWithGame(<SetupScreen />, {
      initial: { gameMode: 'custom', currentScreen: 'setup' },
    });

    const firstInput = getByDisplayValue('Player 1') as HTMLInputElement;
    act(() => {
      fireEvent.change(firstInput, { target: { value: 'Ahmed' } });
    });

    act(() => {
      fireEvent.click(getByText('Start game'));
    });
    expect(api.state.players[0]).toBe('Ahmed');
  });
});
