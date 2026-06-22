import { useLang } from '../i18n/LangContext';
import { initials } from '../lib/initials';
import { BottomSheet } from './BottomSheet';

// Bottom sheet shown after Trix Setup → Start: pick which player holds the
// 7♥. That player is King of kingdom 0; the crown rotates from there.
type TrixKingPickProps = {
  open: boolean;
  players: string[];
  onPick: (idx: number) => void;
  onClose: () => void;
};

export function TrixKingPick({ open, players, onPick, onClose }: TrixKingPickProps) {
  const { t } = useLang();

  return (
    <BottomSheet open={open} onClose={onClose} label={t('trixPickKingTitle')}>
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
    </BottomSheet>
  );
}
