import { useEffect, useMemo, useRef } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { useConfirm } from './ConfirmSheet';
import { useToast } from './Toast';
import { relativeWhen } from '../lib/relativeWhen';
import { useFocusTrap } from '../lib/useFocusTrap';
import { Icon } from './Icon';
import type { RecentGame } from '../state/persistedState';

type Props = {
  // Index into state.recentGames. `null` = sheet closed.
  recentIndex: number | null;
  onClose: () => void;
};

type Col = { label: string; idx: number };

// Bottom sheet that shows a finished game's round-by-round breakdown and final
// standings, with an "Edit rounds" action that reopens the game into the active
// slot so the History screen's existing edit/delete machinery can correct it.
// Degrades to a summary-only view for games logged before round snapshots were
// stored (RecentGame.scores absent).
export function RecentGameSheet({ recentIndex, onClose }: Props) {
  const { t, lang } = useLang();
  const { state, actions } = useGame();
  const { confirm } = useConfirm();
  const toast = useToast();
  const sheetRef = useRef<HTMLDivElement>(null);
  const open = recentIndex !== null;
  const game: RecentGame | undefined =
    recentIndex !== null ? state.recentGames[recentIndex] : undefined;

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

  const cols: Col[] = useMemo(() => {
    if (!game) return [];
    if (game.kind === 'kout') {
      const a = game.teamNames[0]?.trim() || t('teamA');
      const b = game.teamNames[1]?.trim() || t('teamB');
      return [
        { label: a, idx: 0 },
        { label: b, idx: 1 },
      ];
    }
    return game.players.map((name, i) => ({ label: name || `P${i + 1}`, idx: i }));
  }, [game, t]);

  const rounds = game?.scores ?? [];
  const totals = useMemo(
    () =>
      cols.map((c) => rounds.reduce((sum, r) => sum + (r[c.idx] ?? 0), 0)),
    [cols, rounds],
  );

  const modeLabel = game
    ? t(
        game.kind === 'kout'
          ? 'gameKout'
          : game.kind === 'sebeeta'
            ? 'gameSebeeta'
            : 'gameCustom',
      )
    : '';

  const reopen = () => {
    if (recentIndex === null) return;
    const apply = () => {
      actions.reopenRecentGame(recentIndex);
      toast.show(t('recentReopened'));
      onClose();
    };
    const activeInProgress = state.scores.length > 0 && !state.gameOver;
    if (activeInProgress) {
      confirm({
        title: t('recentReopenConfirm'),
        confirmLabel: t('recentReopen'),
        destructive: true,
        onConfirm: apply,
      });
    } else {
      apply();
    }
  };

  const gridCols = `minmax(36px, auto) repeat(${cols.length}, minmax(0, 1fr))`;

  return (
    <>
      <div
        className={`sheet-scrim${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`sheet recent-sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={game ? `${modeLabel} · ${game.winner}` : ''}
        tabIndex={-1}
      >
        <div className="grabber" />
        {game && (
          <>
            <div className="recent-sheet-head">
              <div className="rsh-titles">
                <div className="rsh-mode">{modeLabel}</div>
                <div className="rsh-when">
                  {relativeWhen(game.when, lang)} ·{' '}
                  {t('historyCount')(game.roundCount)}
                </div>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={onClose}
                aria-label={t('closeLabel')}
              >
                <Icon.Close size={18} />
              </button>
            </div>

            <div className="recent-sheet-winner">
              <Icon.Crown size={16} />
              <span className="rsw-name">{game.winner}</span>
              {game.score && <span className="rsw-score num">{game.score}</span>}
            </div>

            <div className="recent-sheet-body">
              {rounds.length === 0 ? (
                <div className="recent-sheet-empty">{t('recentNoRounds')}</div>
              ) : (
                <div className="recent-rounds" role="table">
                  <div
                    className="rr-row rr-headrow"
                    role="row"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <span className="rr-cell rr-rownum" role="columnheader" />
                    {cols.map((c, ci) => (
                      <span key={ci} className="rr-cell rr-head" role="columnheader">
                        {c.label}
                      </span>
                    ))}
                  </div>
                  {rounds.map((r, ri) => (
                    <div
                      key={ri}
                      className="rr-row"
                      role="row"
                      style={{ gridTemplateColumns: gridCols }}
                    >
                      <span className="rr-cell rr-rownum num" role="cell">
                        {ri + 1}
                      </span>
                      {cols.map((c, ci) => {
                        const v = r[c.idx] ?? 0;
                        return (
                          <span
                            key={ci}
                            className={`rr-cell num${v < 0 ? ' neg' : ''}`}
                            role="cell"
                          >
                            {v}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                  <div
                    className="rr-row rr-totalrow"
                    role="row"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <span className="rr-cell rr-rownum" role="cell">
                      Σ
                    </span>
                    {totals.map((tot, ci) => (
                      <span key={ci} className="rr-cell rr-total num" role="cell">
                        {tot}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {rounds.length > 0 && (
              <div className="recent-sheet-actions">
                <button type="button" className="btn btn-primary btn-block" onClick={reopen}>
                  <Icon.Edit size={16} /> {t('recentReopen')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
