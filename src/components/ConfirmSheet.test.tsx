import { act, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConfirm } from './ConfirmSheet';
import { renderWithGame } from '../test/harness';

// Small component that exposes the confirm() hook to the test via a
// callable ref, so we can drive the sheet imperatively.
function Trigger({
  onReady,
}: {
  onReady: (confirm: ReturnType<typeof useConfirm>['confirm']) => void;
}) {
  const { confirm } = useConfirm();
  onReady(confirm);
  return null;
}

function setup() {
  let openConfirm: ReturnType<typeof useConfirm>['confirm'] = () => {};
  const result = renderWithGame(<Trigger onReady={(c) => (openConfirm = c)} />);
  return {
    ...result,
    openConfirm: (...args: Parameters<typeof openConfirm>) =>
      openConfirm(...args),
  };
}

describe('ConfirmSheet', () => {
  it('opens when confirm() is called and renders the title', () => {
    const onConfirm = vi.fn();
    const { openConfirm, queryByRole, getByText } = setup();
    expect(queryByRole('alertdialog')).toBeNull();

    act(() => {
      openConfirm({ title: 'Reset the game?', onConfirm });
    });
    expect(queryByRole('alertdialog')).not.toBeNull();
    expect(getByText('Reset the game?')).toBeDefined();
  });

  it('fires onConfirm and closes when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const { openConfirm, queryByRole, getByText } = setup();
    act(() => {
      openConfirm({
        title: 'Reset the game?',
        confirmLabel: 'Reset',
        onConfirm,
      });
    });
    act(() => {
      fireEvent.click(getByText('Reset'));
    });
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(queryByRole('alertdialog')).toBeNull();
  });

  it('does NOT fire onConfirm on Cancel — just closes', () => {
    const onConfirm = vi.fn();
    const { openConfirm, queryByRole, getByText } = setup();
    act(() => {
      openConfirm({ title: 'Reset?', onConfirm });
    });
    act(() => {
      fireEvent.click(getByText('Cancel'));
    });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(queryByRole('alertdialog')).toBeNull();
  });

  it('Escape key closes without firing onConfirm', () => {
    const onConfirm = vi.fn();
    const { openConfirm, queryByRole } = setup();
    act(() => {
      openConfirm({ title: 'Reset?', onConfirm });
    });
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(queryByRole('alertdialog')).toBeNull();
  });

  it('scrim click closes without firing onConfirm', () => {
    const onConfirm = vi.fn();
    const { openConfirm, queryByRole, container } = setup();
    act(() => {
      openConfirm({ title: 'Reset?', onConfirm });
    });
    const scrim = container.querySelector('.sheet-scrim');
    expect(scrim).not.toBeNull();
    act(() => {
      fireEvent.click(scrim!);
    });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(queryByRole('alertdialog')).toBeNull();
  });

  it('applies the destructive class to the confirm button when destructive=true', () => {
    const { openConfirm, getByText } = setup();
    act(() => {
      openConfirm({
        title: 'Reset?',
        confirmLabel: 'Reset',
        destructive: true,
        onConfirm: () => {},
      });
    });
    const btn = getByText('Reset');
    expect(btn.className).toContain('btn-danger');
  });

  it('a second confirm() call replaces the first sheet (no double dialogs)', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { openConfirm, getAllByRole, getByText } = setup();
    act(() => {
      openConfirm({ title: 'First?', onConfirm: first });
    });
    act(() => {
      openConfirm({ title: 'Second?', confirmLabel: 'Yes2', onConfirm: second });
    });
    expect(getAllByRole('alertdialog')).toHaveLength(1);
    expect(getByText('Second?')).toBeDefined();

    act(() => {
      fireEvent.click(getByText('Yes2'));
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });
});
