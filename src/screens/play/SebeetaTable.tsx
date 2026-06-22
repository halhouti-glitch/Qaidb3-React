import { useLang } from '../../i18n/LangContext';
import { initials } from '../../lib/initials';

// Circular Sebeeta scoreboard — six seats around a felt, mirroring the real
// table. Teams alternate around the ring (playerTeam drives the colour, so it
// stays correct even if seating isn't strictly A-B-A-B). The highest scorer is
// the one closest to busting the threshold (Sebeeta: crossing it loses for
// their team), so it gets the danger highlight. An opt-in alternative to the
// list scoreboard — toggled on the Play screen, persisted in state.
type SebeetaTableProps = {
  players: string[];
  totals: number[];
  playerTeam: number[];
  threshold: number;
  /** Index of the player closest to out (highest total). */
  atRisk: number;
  teamTotals: [number, number];
  teamLabel: (idx: 0 | 1) => string;
  lastDelta: number[] | null;
};

export function SebeetaTable({
  players,
  totals,
  playerTeam,
  threshold,
  atRisk,
  teamTotals,
  teamLabel,
  lastDelta,
}: SebeetaTableProps) {
  const { t } = useLang();
  return (
    <div className="sebeeta-table">
      <div className="st-ring">
        <div className="st-center" aria-hidden="true">
          <span className="st-center-pre">{t('playTargetLabel')}</span>
          <span className="st-center-num num">{threshold}</span>
          <span className="st-center-sub">{t('sebeetaLowestStays')}</span>
        </div>

        {players.map((name, i) => {
          const total = totals[i] ?? 0;
          const team = playerTeam[i] === 1 ? 1 : 0;
          const isAtRisk = i === atRisk && total > 0;
          const delta = lastDelta ? lastDelta[i] ?? null : null;
          return (
            <div
              key={i}
              className={`st-seat st-seat-${i} ${team === 0 ? 'team-a' : 'team-b'}${
                isAtRisk ? ' at-risk' : ''
              }`}
            >
              <div className="st-avatar">{initials(name)}</div>
              <div className="st-name">{name}</div>
              <div className="st-score num">{total}</div>
              {isAtRisk ? (
                <div className="st-risk">{t('sebeetaAtRisk')}</div>
              ) : (
                delta != null && (
                  <div className="st-delta num">
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      <div className="sebeeta-legend">
        {([0, 1] as const).map((ti) => (
          <span key={ti} className={`st-leg ${ti === 0 ? 'team-a' : 'team-b'}`}>
            <span className="st-leg-dot" aria-hidden="true" />
            {teamLabel(ti)} · <span className="num">{teamTotals[ti]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
