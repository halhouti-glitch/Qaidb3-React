import { useLang } from '../../i18n/LangContext';
import { initials } from '../../lib/initials';
import { topScorerPerTeam } from '../../engine/scoring';

// Circular Sebeeta scoreboard — six seats around a felt, mirroring the real
// table. Teams are coloured by playerTeam. The centre names the dealer (the
// highest scorer — in Sebeeta, closest to busting the threshold and the one
// who deals next). Below the ring, two circles call out each team's highest
// individual (the player each team must watch). The only Sebeeta scoreboard.
type SebeetaTableProps = {
  players: string[];
  totals: number[];
  playerTeam: number[];
  threshold: number;
  /** Index of the dealer = the highest-scoring player. */
  dealer: number;
  teamLabel: (idx: 0 | 1) => string;
  lastDelta: number[] | null;
};

export function SebeetaTable({
  players,
  totals,
  playerTeam,
  threshold,
  dealer,
  teamLabel,
  lastDelta,
}: SebeetaTableProps) {
  const { t } = useLang();
  const hasScores = totals.some((v) => v !== 0);
  const tops = topScorerPerTeam(totals, playerTeam);

  return (
    <div className="sebeeta-table">
      <div className="st-table-header">{t('sebeetaTableHeader')}</div>

      {hasScores && (
        <div className="st-top-section">
          <div className="play-section-label st-top-header">
            {t('sebeetaTargetHeader')}
          </div>
          <div className="st-tops">
            {([0, 1] as const).map((ti) => {
              const top = tops[ti];
              const name = top ? players[top.playerIdx] ?? '—' : '—';
              const score = top?.score ?? 0;
              return (
                <div
                  key={ti}
                  className={`st-top ${ti === 0 ? 'team-a' : 'team-b'}`}
                >
                  <div className="st-top-avatar">{top ? initials(name) : '—'}</div>
                  <div className="st-top-info">
                    <span className="st-top-team">{teamLabel(ti)}</span>
                    <span className="st-top-line">
                      {name} · <span className="num">{score}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="st-ring">
        <div className="st-center">
          {hasScores ? (
            <>
              <span className="st-center-badge">{t('dealerBadge')}</span>
              <span className="st-center-pre">{t('sebeetaDealer')}</span>
              <span className="st-center-name">{players[dealer] ?? '—'}</span>
            </>
          ) : (
            <>
              <span className="st-center-pre">{t('playTargetLabel')}</span>
              <span className="st-center-num num">{threshold}</span>
            </>
          )}
        </div>

        {players.map((name, i) => {
          const total = totals[i] ?? 0;
          const team = playerTeam[i] === 1 ? 1 : 0;
          const isDealer = hasScores && i === dealer;
          const delta = lastDelta ? lastDelta[i] ?? null : null;
          return (
            <div
              key={i}
              className={`st-seat st-seat-${i} ${team === 0 ? 'team-a' : 'team-b'}${
                isDealer ? ' dealer' : ''
              }`}
            >
              <div className="st-avatar">{initials(name)}</div>
              <div className="st-name">{name}</div>
              <div className="st-score num">{total}</div>
              {delta != null && (
                <div className="st-delta num">
                  {delta > 0 ? '+' : ''}
                  {delta}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
