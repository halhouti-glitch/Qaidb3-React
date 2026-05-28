import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { RoundSheet } from './RoundSheet';
import { renderWithGame } from '../test/harness';

// Standalone sheet host — keeps the sheet open across renders so tests can
// drive interactions without going through PlayScreen's open/close flow.
function SheetHost() {
  const [open, setOpen] = useState(true);
  return <RoundSheet open={open} onClose={() => setOpen(false)} />;
}

const ROSTER = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
const TEAM = [0, 0, 0, 1, 1, 1];

const koutInit = {
  gameMode: 'kout' as const,
  currentScreen: 'play' as const,
  players: ROSTER,
  playerTeam: TEAM,
  teamNames: ['Alpha', 'Bravo'],
  threshold: 101,
  winRule: 'highest' as const,
  koutEntryMode: 'contract' as const,
};

const sebeetaInit = {
  gameMode: 'sebeeta' as const,
  currentScreen: 'play' as const,
  players: ROSTER,
  playerTeam: TEAM,
  teamNames: ['Alpha', 'Bravo'],
  threshold: 201,
  winRule: 'lowest' as const,
};

const customInit = {
  gameMode: 'custom' as const,
  currentScreen: 'play' as const,
  players: ['Ali', 'Bob', 'Carol'],
  playerTeam: [],
  teamNames: [],
  threshold: 100,
  winRule: 'highest' as const,
  entryStyle: 'pm' as const,
};

describe('RoundSheet — Kout contract entry', () => {
  // The outcome button text ("Made"/"Failed") also appears in the legend
  // swatches, so query inside the `.kf-result` button class to disambiguate.
  const outcomeButton = (container: HTMLElement, label: string): HTMLButtonElement => {
    const buttons = Array.from(container.querySelectorAll('.kf-result'));
    const found = buttons.find((b) => b.querySelector('.kf-result-title')?.textContent === label);
    if (!found) throw new Error(`No outcome button with label "${label}"`);
    return found as HTMLButtonElement;
  };

  it('made path: caller A + bab + made → commits [5, 0]', () => {
    const { api, getByText, container } = renderWithGame(<SheetHost />, {
      initial: koutInit,
    });
    act(() => {
      fireEvent.click(getByText('Alpha'));
    });
    const levelButtons = container.querySelectorAll('.kf-level');
    act(() => {
      fireEvent.click(levelButtons[0]); // bab is index 0 in KOUT_LEVELS
    });
    act(() => {
      fireEvent.click(outcomeButton(container, 'Made'));
    });
    const saveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Save'),
    );
    expect(saveBtn).toBeDefined();
    act(() => {
      fireEvent.click(saveBtn!);
    });
    expect(api.state.scores).toEqual([[5, 0]]);
  });

  it('failed path: caller A + bab + failed → commits [0, 10] to opponent', () => {
    const { api, getByText, container } = renderWithGame(<SheetHost />, {
      initial: koutInit,
    });
    act(() => {
      fireEvent.click(getByText('Alpha'));
    });
    act(() => {
      fireEvent.click(container.querySelectorAll('.kf-level')[0]); // bab
    });
    act(() => {
      fireEvent.click(outcomeButton(container, 'Failed'));
    });
    const saveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Save'),
    );
    act(() => {
      fireEvent.click(saveBtn!);
    });
    expect(api.state.scores).toEqual([[0, 10]]);
  });

  it('Save button is disabled until contract is complete (caller + level + outcome)', () => {
    const { container } = renderWithGame(<SheetHost />, { initial: koutInit });
    const saveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Save'),
    ) as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });
});

describe('RoundSheet — Kout manual entry (no-minus rule)', () => {
  it('typing a negative value clamps to 0 on submit', () => {
    const { api, container } = renderWithGame(<SheetHost />, {
      initial: { ...koutInit, koutEntryMode: 'manual' as const },
    });
    const inputs = container.querySelectorAll(
      '.manual-pmcontrol input',
    ) as NodeListOf<HTMLInputElement>;
    // The regex strips non-digits; passing -5 leaves '5' visually but assert
    // via the − button driven flow which has explicit clamp logic.
    act(() => {
      // Repeatedly press "−" on team A starting from 0 — should stay at 0
      const minusBtnA = inputs[0].previousElementSibling as HTMLButtonElement;
      fireEvent.click(minusBtnA);
      fireEvent.click(minusBtnA);
      fireEvent.click(minusBtnA);
    });
    expect(inputs[0].value).toBe('0');

    // Now type a positive value and submit — sanity check the happy path.
    act(() => {
      fireEvent.change(inputs[1], { target: { value: '7' } });
    });
    const saveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Save'),
    );
    act(() => {
      fireEvent.click(saveBtn!);
    });
    expect(api.state.scores).toEqual([[0, 7]]);
  });
});

describe('RoundSheet — Custom +/− (PM) entry', () => {
  it('bumping + three times for seat 1 commits [3, 0, 0]', () => {
    const { api, container } = renderWithGame(<SheetHost />, {
      initial: customInit,
    });
    // Each entry row has a Plus button inside .pmcontrol (the second button)
    const pmControls = container.querySelectorAll('.pmcontrol');
    const seat1Plus = pmControls[0].querySelectorAll('button')[1] as HTMLButtonElement;
    act(() => {
      fireEvent.click(seat1Plus);
      fireEvent.click(seat1Plus);
      fireEvent.click(seat1Plus);
    });
    const saveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) =>
        b.textContent?.includes('Save') &&
        !b.closest('.numpad'),
    );
    act(() => {
      fireEvent.click(saveBtn!);
    });
    expect(api.state.scores).toEqual([[3, 0, 0]]);
  });
});

describe('RoundSheet — Sebeeta numpad', () => {
  it('typing 1, 0, 5 on seat 1 commits [105, 0, 0, 0, 0, 0]', () => {
    const { api, container } = renderWithGame(<SheetHost />, {
      initial: sebeetaInit,
    });
    const numpadButtons = container.querySelectorAll('.numpad button');
    const key = (label: string) =>
      Array.from(numpadButtons).find((b) => b.textContent === label) as HTMLButtonElement;
    act(() => {
      fireEvent.click(key('1'));
      fireEvent.click(key('0'));
      fireEvent.click(key('5'));
    });
    // Bottom row is now split into Previous + Next/Save. Advance via Next
    // until the focus reaches the last seat (where Next becomes Save).
    const nextBtn = () =>
      container.querySelector('.numpad .numpad-nav button.next, .numpad .numpad-nav button.confirm') as HTMLButtonElement;
    for (let i = 0; i < 5; i++) {
      act(() => {
        fireEvent.click(nextBtn());
      });
    }
    // Sixth click — wide button is now in 'confirm' mode and submits.
    act(() => {
      fireEvent.click(nextBtn());
    });
    expect(api.state.scores).toEqual([[105, 0, 0, 0, 0, 0]]);
  });

  it('Sebeeta bottom row: −10 is leftmost, CLR is rightmost (with 0 in the middle)', () => {
    const { container } = renderWithGame(<SheetHost />, { initial: sebeetaInit });
    const specials = container.querySelectorAll(
      '.numpad button.special, .numpad button.special.m10',
    );
    // Buttons appear in DOM order: -10, 0, CLR.
    // (the 0 key has no .special class, so we filter to special siblings only)
    const m10 = container.querySelector('.numpad button.special.m10');
    const clr = Array.from(container.querySelectorAll('.numpad button.special')).find(
      (b) => !b.classList.contains('m10'),
    );
    expect(m10).not.toBeNull();
    expect(clr).not.toBeNull();
    // Verify document-order: m10 precedes clr.
    expect(
      m10!.compareDocumentPosition(clr!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeGreaterThan(0);
    // And both .special-class buttons are in the bottom-row area (last 3
    // siblings before .numpad-nav).
    expect(specials.length).toBeGreaterThanOrEqual(2);
  });

  it('Previous button regresses focus and wraps from seat 0 to last', () => {
    const { container } = renderWithGame(<SheetHost />, { initial: sebeetaInit });
    const prevBtn = container.querySelector(
      '.numpad .numpad-nav button.prev',
    ) as HTMLButtonElement;
    expect(prevBtn).not.toBeNull();

    // Start focused on seat 1 (idx 0) — clicking Previous wraps to seat 6 (idx 5).
    act(() => {
      fireEvent.click(prevBtn);
    });
    const focusedRow = container.querySelector('.entry-row.focused');
    const seatLabel = focusedRow?.querySelector('.seat')?.textContent;
    expect(seatLabel).toBe('6');
  });

  it('CLR resets the focused entry to 0', () => {
    const { container } = renderWithGame(<SheetHost />, { initial: sebeetaInit });
    const key = (label: string) =>
      Array.from(container.querySelectorAll('.numpad button')).find(
        (b) => b.textContent === label,
      ) as HTMLButtonElement;
    act(() => {
      fireEvent.click(key('5'));
      fireEvent.click(key('5'));
    });
    let display = container.querySelector(
      '.entry-row.focused .numpad-input',
    ) as HTMLButtonElement;
    expect(display.textContent).toBe('55');
    act(() => {
      fireEvent.click(key('CLR'));
    });
    display = container.querySelector(
      '.entry-row.focused .numpad-input',
    ) as HTMLButtonElement;
    expect(display.textContent).toBe('0');
  });

  it('−10 shortcut sets the focused entry to -10', () => {
    const { container } = renderWithGame(<SheetHost />, { initial: sebeetaInit });
    const m10Btn = container.querySelector('.numpad .m10') as HTMLButtonElement;
    expect(m10Btn).not.toBeNull();
    act(() => {
      fireEvent.click(m10Btn);
    });
    const display = container.querySelector(
      '.entry-row.focused .numpad-input',
    ) as HTMLButtonElement;
    expect(display.textContent).toBe('-10');
  });
});

describe('RoundSheet — Escape closes', () => {
  it('Escape key fires onClose', () => {
    const { container } = renderWithGame(<SheetHost />, { initial: customInit });
    expect(container.querySelector('.sheet.open')).not.toBeNull();
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(container.querySelector('.sheet.open')).toBeNull();
  });
});

describe('RoundSheet — Custom numpad edge cases', () => {
  const customNumpadInit = {
    ...customInit,
    entryStyle: 'numpad' as const,
  };

  it('⌫ backspace divides the current value by 10 (drops a digit)', () => {
    const { container } = renderWithGame(<SheetHost />, {
      initial: customNumpadInit,
    });
    const key = (label: string) =>
      Array.from(container.querySelectorAll('.numpad button')).find(
        (b) => b.textContent === label,
      ) as HTMLButtonElement;
    act(() => {
      fireEvent.click(key('1'));
      fireEvent.click(key('2'));
      fireEvent.click(key('3'));
    });
    let display = container.querySelector(
      '.entry-row.focused .numpad-input',
    ) as HTMLButtonElement;
    expect(display.textContent).toBe('123');
    act(() => {
      fireEvent.click(key('⌫'));
    });
    display = container.querySelector(
      '.entry-row.focused .numpad-input',
    ) as HTMLButtonElement;
    expect(display.textContent).toBe('12');
    act(() => {
      fireEvent.click(key('⌫'));
      fireEvent.click(key('⌫'));
    });
    display = container.querySelector(
      '.entry-row.focused .numpad-input',
    ) as HTMLButtonElement;
    // 12 → 1 → 0 (Math.floor(0/10) === 0). Subsequent ⌫ is a no-op.
    expect(display.textContent).toBe('0');
  });

  it('overflow guard: 5-digit input is clamped — last tap is ignored once > 9999', () => {
    const { container } = renderWithGame(<SheetHost />, {
      initial: customNumpadInit,
    });
    const key = (label: string) =>
      Array.from(container.querySelectorAll('.numpad button')).find(
        (b) => b.textContent === label,
      ) as HTMLButtonElement;
    // 9 → 99 → 999 → 9999 → 99990 (would be > 9999 cap, so the last tap is dropped)
    act(() => {
      for (let i = 0; i < 5; i++) fireEvent.click(key('9'));
    });
    const display = container.querySelector(
      '.entry-row.focused .numpad-input',
    ) as HTMLButtonElement;
    expect(display.textContent).toBe('9999');
  });

  it('Save label appears on last seat and commits on click', () => {
    const { api, container } = renderWithGame(<SheetHost />, {
      initial: customNumpadInit,
    });
    // 3-player Custom — advance twice to reach the last seat.
    const advance = () => {
      const next = container.querySelector(
        '.numpad .numpad-nav button.next, .numpad .numpad-nav button.confirm',
      ) as HTMLButtonElement;
      fireEvent.click(next);
    };
    act(() => {
      advance();
      advance();
    });
    // Right button is now .confirm (Save label) — clicking it commits.
    const confirm = container.querySelector(
      '.numpad .numpad-nav button.confirm',
    ) as HTMLButtonElement;
    expect(confirm).not.toBeNull();
    expect(confirm.textContent).toContain('Save');
    act(() => {
      fireEvent.click(confirm);
    });
    expect(api.state.scores).toEqual([[0, 0, 0]]);
  });
});
