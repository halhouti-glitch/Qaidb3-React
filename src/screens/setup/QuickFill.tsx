import { useLang } from '../../i18n/LangContext';
import { useGame } from '../../state/GameContext';
import { useConfirm } from '../../components/ConfirmSheet';
import { useToast } from '../../components/Toast';
import { topProfiles, profileKey } from '../../state/profiles';
import { initials } from '../../lib/initials';
import { Icon } from '../../components/Icon';

type Props = {
  onPick: (name: string) => void;
};

// Setup-screen quick-add: tap a saved top player to drop them into the next
// open seat. Each pill carries an × to forget that one player, and the section
// header has a Clear-all link — both delete the underlying profile (same
// semantics as the Home Top Players strip and the Profile sheet).
export function QuickFill({ onPick }: Props) {
  const { t } = useLang();
  const { state, actions } = useGame();
  const { confirm } = useConfirm();
  const toast = useToast();

  const tops = topProfiles(state.playerProfiles, 8);
  if (tops.length === 0) return null;

  const clearAll = () =>
    confirm({
      title: `${t('setupQuickAdd')} — ${t('clearAll')}?`,
      confirmLabel: t('clearAll'),
      destructive: true,
      onConfirm: () => actions.clearAllProfiles(),
    });

  const removeOne = (name: string) => {
    actions.removeProfile(profileKey(name));
    toast.show(t('removePlayer'));
  };

  return (
    <div className="setup-section quickfill">
      <div className="quickfill-head">
        <div className="label">{t('setupQuickAdd')}</div>
        <button type="button" className="clear-link" onClick={clearAll}>
          {t('clearAll')}
        </button>
      </div>
      <div className="qf-pills">
        {tops.map((p) => (
          <div key={p.name} className="qf-pill-wrap">
            <button
              type="button"
              className="qf-pill"
              onClick={() => onPick(p.name)}
            >
              <span className="qf-avatar" aria-hidden="true">
                {initials(p.name)}
              </span>
              <span className="qf-name">{p.name}</span>
            </button>
            <button
              type="button"
              className="qf-remove"
              onClick={() => removeOne(p.name)}
              aria-label={`${t('removePlayer')} — ${p.name}`}
            >
              <Icon.Close size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
