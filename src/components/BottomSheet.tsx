import { useEffect, useRef, type ReactNode } from 'react';
import { useFocusTrap } from '../lib/useFocusTrap';

type BottomSheetProps = {
  /**
   * Whether the sheet is shown. The element stays mounted while false so the
   * slide-out transition can play; CSS keys off the `open` class.
   */
  open: boolean;
  onClose: () => void;
  /** aria-label for the dialog. */
  label: string;
  /** Extra modifier class on `.sheet` (e.g. 'share-sheet', 'profile-sheet'). */
  className?: string;
  /** Dialog role — use 'alertdialog' for destructive confirms. */
  role?: 'dialog' | 'alertdialog';
  children: ReactNode;
};

// Shared bottom-sheet shell: scrim + sliding panel + grabber, with focus trap,
// body-scroll lock, and Esc-to-close. Every sheet in the app (round entry,
// share, profile, recent game, confirm, Trix pickers) renders its content
// inside this, so the modal plumbing lives in exactly one place. Styling comes
// from themes.css (`.sheet`, `.sheet-scrim`, `.grabber`).
export function BottomSheet({
  open,
  onClose,
  label,
  className,
  role = 'dialog',
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useFocusTrap(sheetRef, open);

  // Lock body scroll + Esc-to-close while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const openCls = open ? ' open' : '';
  return (
    <>
      <div
        className={`sheet-scrim${openCls}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`sheet${className ? ` ${className}` : ''}${openCls}`}
        role={role}
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        <div className="grabber" />
        {children}
      </div>
    </>
  );
}
