import { useMemo } from 'react';
import { useLang } from '../../i18n/LangContext';
import { useGame } from '../../state/GameContext';
import { topProfiles } from '../../state/profiles';
import { initials } from '../../lib/initials';
import { Icon } from '../../components/Icon';
import type { GameMode } from '../../state/persistedState';

type Props = {
  mode: GameMode;
  count: number;
  showShuffle: boolean;
  onPick: (name: string) => void;
  onApplyTemplate: (names: string[]) => void;
  onShuffle: () => void;
};

// Setup-screen helpers that speed up filling the roster:
//  - Quick add: tap a top player to drop them into the next open seat.
//  - Recent line-ups: re-use the exact roster from a recent game of the
//    same mode + player count.
//  - Shuffle: randomise seat order (i.e. partners) for team formats.
export function QuickFill({
  mode,
  count,
  showShuffle,
  onPick,
  onApplyTemplate,
  onShuffle,
}: Props) {
  const { t } = useLang();
  const { state } = useGame();

  const tops = useMemo(
    () => topProfiles(state.playerProfiles, 8),
    [state.playerProfiles],
  );

  const templates = useMemo(() => {
    const seen = new Set<string>();
    const out: string[][] = [];
    for (const g of state.recentGames) {
      if (g.kind !== mode || g.players.length !== count) continue;
      const key = g.players.join('|').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(g.players.slice());
      if (out.length >= 3) break;
    }
    return out;
  }, [state.recentGames, mode, count]);

  if (tops.length === 0 && templates.length === 0 && !showShuffle) return null;

  return (
    <div className="setup-section quickfill">
      {tops.length > 0 && (
        <>
          <div className="label">{t('setupQuickAdd')}</div>
          <div className="qf-pills">
            {tops.map((p) => (
              <button
                key={p.name}
                type="button"
                className="qf-pill"
                onClick={() => onPick(p.name)}
              >
                <span className="qf-avatar" aria-hidden="true">
                  {initials(p.name)}
                </span>
                <span className="qf-name">{p.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {templates.length > 0 && (
        <>
          <div className="label">{t('setupRecentLineups')}</div>
          <div className="qf-templates">
            {templates.map((names, i) => (
              <button
                key={i}
                type="button"
                className="qf-template"
                onClick={() => onApplyTemplate(names)}
              >
                {names.join(' · ')}
              </button>
            ))}
          </div>
        </>
      )}

      {showShuffle && (
        <div className="qf-shuffle-row">
          <button
            type="button"
            className="btn btn-ghost qf-shuffle"
            onClick={onShuffle}
          >
            <Icon.Shuffle size={16} /> {t('setupShuffleTeams')}
          </button>
        </div>
      )}
    </div>
  );
}
