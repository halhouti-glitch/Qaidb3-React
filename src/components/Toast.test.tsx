import { act, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from './Toast';
import { renderWithGame } from '../test/harness';

// Tiny harness — exposes the toast.show callable to tests imperatively.
function Trigger({
  onReady,
}: {
  onReady: (show: ReturnType<typeof useToast>['show']) => void;
}) {
  const { show } = useToast();
  onReady(show);
  return null;
}

function setup() {
  let openToast: ReturnType<typeof useToast>['show'] = () => {};
  const result = renderWithGame(<Trigger onReady={(s) => (openToast = s)} />);
  return {
    ...result,
    show: (...args: Parameters<typeof openToast>) => openToast(...args),
  };
}

describe('Toast — auto-dismiss timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('plain toast hides after 1600ms and unmounts ~240ms later', () => {
    const { show, container } = setup();
    act(() => {
      show('Saved');
    });
    expect(container.querySelector('.toast.show')).not.toBeNull();

    // Just before 1600ms: still visible.
    act(() => {
      vi.advanceTimersByTime(1599);
    });
    expect(container.querySelector('.toast.show')).not.toBeNull();

    // 1600ms: visible class drops.
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(container.querySelector('.toast.show')).toBeNull();
    // Element is still in DOM (sliding out).
    expect(container.querySelector('.toast')).not.toBeNull();

    // After the 240ms unmount delay, gone completely.
    act(() => {
      vi.advanceTimersByTime(240);
    });
    expect(container.querySelector('.toast')).toBeNull();
  });

  it('action toast persists longer (4000ms vs 1600ms)', () => {
    const { show, container } = setup();
    act(() => {
      show('Round saved', { action: { label: 'Undo', onClick: () => {} } });
    });
    expect(container.querySelector('.toast.show')).not.toBeNull();

    // Past the plain-toast threshold — still visible because of the action.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.querySelector('.toast.show')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.querySelector('.toast.show')).toBeNull();
  });

  it('a follow-up show() before the first dismiss replaces the current toast', () => {
    const { show, getByText, queryByText } = setup();
    act(() => {
      show('First');
    });
    expect(getByText('First')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(500);
      show('Second');
    });
    expect(queryByText('First')).toBeNull();
    expect(getByText('Second')).toBeDefined();
  });
});

describe('Toast — action button', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Undo action fires the callback and dismisses the toast', () => {
    const onClick = vi.fn();
    const { show, getByText, container } = setup();
    act(() => {
      show('Round saved', { action: { label: 'Undo', onClick } });
    });
    act(() => {
      fireEvent.click(getByText('Undo'));
    });
    expect(onClick).toHaveBeenCalledOnce();
    // Dismiss starts immediately — visible class drops.
    expect(container.querySelector('.toast.show')).toBeNull();
    // After the 240ms unmount delay, removed entirely.
    act(() => {
      vi.advanceTimersByTime(240);
    });
    expect(container.querySelector('.toast')).toBeNull();
  });

  it('honours a custom durationMs override', () => {
    const { show, container } = setup();
    act(() => {
      show('Quick', { durationMs: 500 });
    });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(container.querySelector('.toast.show')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(container.querySelector('.toast.show')).toBeNull();
  });
});
