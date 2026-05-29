import { useEffect, useRef } from 'react';
import { useLang } from '../i18n/LangContext';
import { useFocusTrap } from '../lib/useFocusTrap';
import { initials } from '../lib/initials';

// Bottom sheet shown after Trix Setup → Start: pick which player holds the
// 7♥. That player is King of kingdom 0; the crown rotates counter-clockwise
// from there. Reuses the shared .sheet / .sheet-scrim primitives.
type TrixKingPickProps = {
  open: boolean;
  players: string[];
  onPick: (idx: number) => void;
  onClose: () => void;
};

export function TrixKingPick({ open, players, onPick, onClose }: TrixKingPickProps) {
  const { t } = useLang();
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, open);

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

  return (
    <>
      <div
        className={`sheet-scrim${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('trixPickKingTitle')}
        tabIndex={-1}
      >
        <div className="grabber" />
        <div className="sheet-header">
          <h2>{t('trixPickKingTitle')}</h2>
          <div className="round-meta">{t('trixPickKingHint')}</div>
        </div>
        <div className="sheet-body">
          <div className="trix-king-grid">
            {players.map((name, i) => (
              <button
                key={i}
                type="button"
                className="trix-king-card"
                onClick={() => onPick(i)}
              >
                <span className="trix-king-avatar">{initials(name)}</span>
                <span className="trix-king-name">{name}</span>
                <span className="trix-king-seat">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
