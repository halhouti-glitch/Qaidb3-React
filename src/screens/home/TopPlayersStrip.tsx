import { useLang } from '../../i18n/LangContext';
import { useGame } from '../../state/GameContext';
import { useConfirm } from '../../components/ConfirmSheet';
import { topProfiles, profileKey } from '../../state/profiles';
import { initials } from '../../lib/initials';

type TopPlayersStripProps = {
  // Caller-controlled — selecting a pill opens that profile's sheet.
  onPick: (profileKey: string) => void;
};

// Horizontal scroll row that sits above the Recent Games list on Home. Pulls
// the top 8 profiles by `gamesPlayed` (lastPlayed as tiebreaker — see
// topProfiles). Empty state renders nothing rather than a placeholder, so
// fresh installs don't show clutter until the user finishes at least one
// game.
export function TopPlayersStrip({ onPick }: TopPlayersStripProps) {
  const { t } = useLang();
  const { state, actions } = useGame();
  const { confirm } = useConfirm();
  const tops = topProfiles(state.playerProfiles, 8);
  if (tops.length === 0) return null;

  const clear = () => {
    confirm({
      title: `${t('topPlayers')} — ${t('clearAll')}?`,
      confirmLabel: t('clearAll'),
      destructive: true,
      onConfirm: () => actions.clearAllProfiles(),
    });
  };

  return (
    <div className="top-players-section">
      <div className="top-players-head">
        <h3>{t('topPlayers')}</h3>
        <button type="button" className="clear-link" onClick={clear}>
          {t('clearAll')}
        </button>
      </div>
      <div className="top-players-strip" role="list">
        {tops.map((p) => (
          <button
            key={profileKey(p.name)}
            type="button"
            className="top-player-pill"
            role="listitem"
            onClick={() => onPick(profileKey(p.name))}
            aria-label={p.name}
          >
            <span className="tp-avatar" aria-hidden="true">
              {initials(p.name)}
            </span>
            <span className="tp-meta">
              <span className="tp-name">{p.name}</span>
              <span className="tp-stats num">
                {p.gamesPlayed} · {p.wins}W
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
