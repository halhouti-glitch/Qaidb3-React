import { useEffect } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { useToast } from './Toast';
import { topTeammates } from '../state/profiles';
import { relativeWhen } from '../lib/relativeWhen';
import { initials } from '../lib/initials';
import { Icon } from './Icon';

type ProfileSheetProps = {
  // The profile key (lowercased name) to view. `null` = sheet closed.
  profileKey: string | null;
  onClose: () => void;
};

// Bottom sheet for lifetime player stats. Reuses the same .sheet/.sheet-scrim
// styling that RoundSheet uses (see themes.css). Pulls the live profile out
// of GameContext so it reflects updates from removeProfile and game-end
// upserts without prop drilling.
export function ProfileSheet({ profileKey, onClose }: ProfileSheetProps) {
  const { t, lang } = useLang();
  const { state, actions } = useGame();
  const toast = useToast();
  const open = profileKey !== null;
  const profile =
    profileKey !== null ? state.playerProfiles[profileKey] : undefined;

  // Body scroll lock + Esc-to-close, mirrors RoundSheet.
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

  const remove = () => {
    if (profileKey === null) return;
    actions.removeProfile(profileKey);
    toast.show(t('removePlayer'));
    onClose();
  };

  const winRate =
    profile && profile.gamesPlayed > 0
      ? Math.round((profile.wins / profile.gamesPlayed) * 100)
      : 0;
  const mates = profile
    ? topTeammates(profile, state.playerProfiles, 2)
    : [];

  return (
    <>
      <div
        className={`sheet-scrim${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`sheet profile-sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={profile?.name ?? ''}
      >
        <div className="grabber" />
        {profile && (
          <>
            <div className="profile-header">
              <div className="profile-avatar" aria-hidden="true">
                {initials(profile.name)}
              </div>
              <div className="profile-name">{profile.name}</div>
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <div className="label">{t('profileGamesPlayed')}</div>
                <div className="value num">{profile.gamesPlayed}</div>
              </div>
              <div className="profile-stat">
                <div className="label">{t('profileWins')}</div>
                <div className="value num">{profile.wins}</div>
              </div>
              <div className="profile-stat">
                <div className="label">{t('profileWinRate')}</div>
                <div className="value num">{winRate}%</div>
              </div>
              <div className="profile-stat">
                <div className="label">{t('profileLastPlayed')}</div>
                <div className="value small">
                  {profile.lastPlayed
                    ? relativeWhen(profile.lastPlayed, lang)
                    : '—'}
                </div>
              </div>
              <div className="profile-stat profile-stat-wide">
                <div className="label">{t('profileTopTeammate')}</div>
                {mates.length === 0 ? (
                  <div className="value small">—</div>
                ) : (
                  mates.map((m) => (
                    // dir="auto" so the Latin name + numeric count read
                    // left-to-right inside an Arabic (RTL) page without
                    // the leading × snapping to the visual start.
                    <div key={m.name} className="value small" dir="auto">
                      {t('profileTeammateOf')(m.name, m.count)}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="button"
                className="btn btn-ghost btn-danger"
                onClick={remove}
              >
                <Icon.Trash /> {t('removePlayer')}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
