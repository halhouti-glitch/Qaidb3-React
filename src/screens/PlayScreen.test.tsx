import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayScreen } from './PlayScreen';
import { renderWithGame } from '../test/harness';

const ROSTER = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
const TEAM = [0, 0, 0, 1, 1, 1];

const sebeetaInit = {
  gameMode: 'sebeeta' as const,
  currentScreen: 'play' as const,
  players: ROSTER,
  playerTeam: TEAM,
  teamNames: ['Alpha', 'Bravo'],
  threshold: 201,
  winRule: 'lowest' as const,
};

describe('PlayScreen', () => {
  it('renders the player roster on the scoreboard', () => {
    const { getByText } = renderWithGame(<PlayScreen />, { initial: sebeetaInit });
    expect(getByText('A1')).toBeDefined();
    expect(getByText('B3')).toBeDefined();
  });

  it('Undo button is disabled with zero rounds, enabled after a round, and removes the last round', () => {
    const { api, getByLabelText } = renderWithGame(<PlayScreen />, {
      initial: sebeetaInit,
    });
    const undoBtn = getByLabelText('Undo Last Round') as HTMLButtonElement;
    expect(undoBtn.disabled).toBe(true);

    act(() => {
      api.actions.addRound([10, 20, 30, 0, 0, 0]);
    });
    expect(undoBtn.disabled).toBe(false);
    expect(api.state.scores).toHaveLength(1);

    act(() => {
      fireEvent.click(undoBtn);
    });
    expect(api.state.scores).toEqual([]);
  });

  it('Reset opens the confirm sheet and clears scores when confirmed', () => {
    const { api, getByText, getAllByText } = renderWithGame(<PlayScreen />, {
      initial: { ...sebeetaInit, scores: [[10, 0, 0, 0, 0, 0]] },
    });
    // Reset bar button at the bottom of the screen.
    act(() => {
      fireEvent.click(getByText('Reset Game'));
    });
    // ConfirmSheet now rendered; the confirm button reuses the same label.
    // Pick the second "Reset Game" — the one inside the sheet.
    const buttons = getAllByText('Reset Game');
    expect(buttons.length).toBeGreaterThan(1);
    act(() => {
      fireEvent.click(buttons[buttons.length - 1]);
    });
    expect(api.state.scores).toEqual([]);
  });

  it('Sebeeta scoreboard toggles between the list and circular table views', () => {
    const { api, getByText, queryByText } = renderWithGame(<PlayScreen />, {
      initial: { ...sebeetaInit, scores: [[10, 5, 8, 40, 2, 1]] },
    });
    // Defaults to the list view: the "Total score" section label is shown and
    // the table-only center subtitle is not.
    expect(getByText('Total score')).toBeDefined();
    expect(queryByText('lowest stays in')).toBeNull();

    act(() => {
      fireEvent.click(getByText('Table'));
    });
    expect(api.state.sebeetaView).toBe('table');
    expect(getByText('lowest stays in')).toBeDefined();
    expect(queryByText('Total score')).toBeNull();

    act(() => {
      fireEvent.click(getByText('List'));
    });
    expect(api.state.sebeetaView).toBe('list');
    expect(getByText('Total score')).toBeDefined();
  });

  it('Reset can be cancelled — scores remain intact', () => {
    const { api, getByText } = renderWithGame(<PlayScreen />, {
      initial: { ...sebeetaInit, scores: [[10, 0, 0, 0, 0, 0]] },
    });
    act(() => {
      fireEvent.click(getByText('Reset Game'));
    });
    act(() => {
      fireEvent.click(getByText('Cancel'));
    });
    expect(api.state.scores).toEqual([[10, 0, 0, 0, 0, 0]]);
  });
});
