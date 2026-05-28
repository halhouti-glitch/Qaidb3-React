import { act, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ProfileSheet } from './ProfileSheet';
import { renderWithGame } from '../test/harness';
import type { Profile } from '../state/persistedState';

function profile(p: Partial<Profile> & { name: string }): Profile {
  return {
    gamesPlayed: 0,
    wins: 0,
    lastPlayed: 0,
    teammates: {},
    ...p,
  };
}

// Wrapper that owns the open/closed state — mirrors how HomeScreen +
// TopPlayersStrip drive ProfileSheet at runtime.
function Host({ initialKey }: { initialKey: string | null }) {
  const [key, setKey] = useState<string | null>(initialKey);
  return <ProfileSheet profileKey={key} onClose={() => setKey(null)} />;
}

const initialProfiles = {
  ali: profile({
    name: 'Ali',
    gamesPlayed: 10,
    wins: 7,
    lastPlayed: Date.now() - 60_000,
    teammates: { bob: 4, carol: 6 },
  }),
  bob: profile({ name: 'Bob', gamesPlayed: 5, wins: 2 }),
  carol: profile({ name: 'Carol', gamesPlayed: 8, wins: 5 }),
};

describe('ProfileSheet — render', () => {
  it('does not render header content when profileKey is null', () => {
    const { container } = renderWithGame(<Host initialKey={null} />, {
      initial: { playerProfiles: initialProfiles },
    });
    expect(container.querySelector('.profile-name')).toBeNull();
  });

  it('renders the profile name + initials', () => {
    const { getByText } = renderWithGame(<Host initialKey="ali" />, {
      initial: { playerProfiles: initialProfiles },
    });
    expect(getByText('Ali')).toBeDefined();
  });

  it('shows games + wins + computed win rate', () => {
    const { container } = renderWithGame(<Host initialKey="ali" />, {
      initial: { playerProfiles: initialProfiles },
    });
    const values = Array.from(container.querySelectorAll('.profile-stat .value')).map(
      (v) => v.textContent,
    );
    // 10 games, 7 wins → 70%
    expect(values).toContain('10');
    expect(values).toContain('7');
    expect(values).toContain('70%');
  });

  it('shows 0% win rate for an unplayed profile (gamesPlayed=0)', () => {
    const blank = { x: profile({ name: 'X' }) };
    const { container } = renderWithGame(<Host initialKey="x" />, {
      initial: { playerProfiles: blank },
    });
    const values = Array.from(container.querySelectorAll('.profile-stat .value')).map(
      (v) => v.textContent,
    );
    expect(values).toContain('0');
    expect(values).toContain('0%');
  });

  it('renders top teammates sorted by count', () => {
    const { container } = renderWithGame(<Host initialKey="ali" />, {
      initial: { playerProfiles: initialProfiles },
    });
    // The teammate row uses the formatter `${name} · ${count}×`.
    const teammates = Array.from(
      container.querySelectorAll('.profile-stat-wide .value'),
    ).map((v) => v.textContent);
    // Carol has 6 games together, Bob has 4 — Carol shows first.
    expect(teammates[0]).toContain('Carol');
    expect(teammates[0]).toContain('6');
    expect(teammates[1]).toContain('Bob');
    expect(teammates[1]).toContain('4');
  });

  it('shows the em-dash placeholder when there are no teammates', () => {
    const lonely = {
      solo: profile({ name: 'Solo', gamesPlayed: 3, wins: 1 }),
    };
    const { container } = renderWithGame(<Host initialKey="solo" />, {
      initial: { playerProfiles: lonely },
    });
    const teammatesRow = container.querySelector('.profile-stat-wide');
    expect(teammatesRow?.textContent).toContain('—');
  });
});

describe('ProfileSheet — actions', () => {
  it('clicking Remove drops the profile from state and closes the sheet', () => {
    const { api, getByText, container } = renderWithGame(<Host initialKey="ali" />, {
      initial: { playerProfiles: initialProfiles },
    });
    expect(api.state.playerProfiles.ali).toBeDefined();

    act(() => {
      fireEvent.click(getByText('Remove player'));
    });
    expect(api.state.playerProfiles.ali).toBeUndefined();
    // Sheet closes — the .open class is gone.
    expect(container.querySelector('.profile-sheet.open')).toBeNull();
  });

  it('Escape closes the sheet without mutating state', () => {
    const { api, container } = renderWithGame(<Host initialKey="ali" />, {
      initial: { playerProfiles: initialProfiles },
    });
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    // Sheet closed — profile remains.
    expect(container.querySelector('.profile-sheet.open')).toBeNull();
    expect(api.state.playerProfiles.ali).toBeDefined();
  });

  it('scrim click closes without mutating state', () => {
    const { api, container } = renderWithGame(<Host initialKey="ali" />, {
      initial: { playerProfiles: initialProfiles },
    });
    const scrim = container.querySelector('.sheet-scrim');
    expect(scrim).not.toBeNull();
    act(() => {
      fireEvent.click(scrim!);
    });
    expect(container.querySelector('.profile-sheet.open')).toBeNull();
    expect(api.state.playerProfiles.ali).toBeDefined();
  });
});
