import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import {
  checkWinner,
  dealerIndex,
  teamTotalsFromPlayers,
  topScorerPerTeam,
  totals as computeTotals,
} from '../engine/scoring';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { RoundSheet } from '../components/RoundSheet';

export function PlayScreen() {
  const { t } = useLang();
  const { state, actions } = useGame();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastDelta, setLastDelta] = useState<number[] | null>(null);

  const isKout = state.gameMode === 'kout';
  const isSebeeta = state.gameMode === 'sebeeta';
  const isCustom = state.gameMode === 'custom';
  const isCustomTeams =
    isCustom &&
    state.playerTeam.length === state.players.length &&
    state.players.length > 0;

  // Sebeeta is always shown as individual (engine still computes team winner).
  const showAsTeams = isKout || isCustomTeams;

  const totalsArr = useMemo(() => computeTotals(state), [state]);
  const winner = useMemo(() => checkWinner(state, totalsArr), [state, totalsArr]);
  // For Custom+teams, the engine emits team winners but `totalsArr` is still
  // per-player. Roll up to team totals for the team scoreboard + dealer.
  const teamTotals = useMemo<[number, number] | null>(
    () => (isCustomTeams ? teamTotalsFromPlayers(totalsArr, state.playerTeam) : null),
    [isCustomTeams, totalsArr, state.playerTeam],
  );
  const teamScoreboardTotals: [number, number] | null = isKout
    ? (totalsArr as [number, number])
    : teamTotals;
  const dealer = useMemo(
    () =>
      dealerIndex(
        teamScoreboardTotals ?? totalsArr,
        state.winRule,
      ),
    [teamScoreboardTotals, totalsArr, state.winRule],
  );

  // Show the just-added round's per-player deltas for 2.2s.
  const roundsLen = state.scores.length;
  useEffect(() => {
    if (roundsLen === 0) {
      setLastDelta(null);
      return;
    }
    const round = state.scores[roundsLen - 1];
    if (!round) return;
    setLastDelta(round.slice());
    const tm = setTimeout(() => setLastDelta(null), 2200);
    return () => clearTimeout(tm);
  }, [roundsLen, state.scores]);

  const nextRound = roundsLen + 1;
  const gameNameKey = isKout
    ? 'gameKout'
    : isSebeeta
      ? 'gameSebeeta'
      : 'gameCustom';

  const lowestWins = state.winRule === 'lowest';

  const teamLabel = (idx: 0 | 1): string =>
    state.teamNames[idx]?.trim() ||
    (idx === 0 ? t('teamAFull') : t('teamBFull'));

  const onUndo = () => {
    // Dedicated Undo button — no confirm dialog (the snackbar after each
    // round commit IS the primary confirm flow, per PORT_FROM_VANILLA.md
    // item 5). This path stays for users who scroll past the snackbar.
    if (state.scores.length === 0) return;
    actions.undoRound();
    toast.show(t('undoRound'));
  };
  const onReset = () => {
    if (window.confirm(t('confirmReset'))) actions.resetGame();
  };
  const onNewGame = () => {
    if (window.confirm(t('confirmClearPlayers'))) actions.clearPlayers();
  };

  return (
    <div className="screen">
      <Header
        title={t(gameNameKey)}
        eyebrow={t('playRoundPill')(nextRound)}
        left={
          <button
            type="button"
            className="icon-btn"
            onClick={() => actions.navigate('home')}
            aria-label={t('goHome')}
          >
            <Icon.Back />
          </button>
        }
        right={
          <button
            type="button"
            className="icon-btn"
            onClick={() => actions.navigate('history')}
            aria-label={t('roundHistory')}
          >
            <Icon.History />
          </button>
        }
      />

      <div className="play-body">
        <div className="round-strip">
          <span className="target">
            {lowestWins ? (
              <>
                {t('playFirstToLosesPre')}{' '}
                <span className="num">{state.threshold}</span>{' '}
                {t('playFirstToLosesPost')}
              </>
            ) : (
              <>
                {t('playFirstToPre')}{' '}
                <span className="num">{state.threshold}</span>
              </>
            )}
          </span>
        </div>

        {isSebeeta && (
          <SebeetaTopSummary
            totals={totalsArr}
            players={state.players}
            playerTeam={state.playerTeam}
            teamLabel={teamLabel}
          />
        )}

        {showAsTeams && teamScoreboardTotals ? (
          <TeamsScoreboard
            totals={teamScoreboardTotals}
            threshold={state.threshold}
            dealer={dealer}
            winnerIdx={winner?.type === 'team' ? winner.idx : null}
            players={state.players}
            playerTeam={state.playerTeam}
            teamLabel={teamLabel}
            lastDelta={
              isCustomTeams && lastDelta
                ? teamTotalsFromPlayers(lastDelta, state.playerTeam)
                : lastDelta
            }
          />
        ) : (
          <IndividualScoreboard
            totals={totalsArr}
            threshold={state.threshold}
            dealer={dealer}
            winnerIdx={winner?.type === 'player' ? winner.idx : null}
            players={state.players}
            isSebeeta={isSebeeta}
            lastDelta={lastDelta}
            dealerLabel={t('dealerBadge')}
          />
        )}
      </div>

      <div className="play-actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={state.scores.length === 0}
          onClick={onUndo}
          style={{ flex: '0 0 auto', width: 56, padding: 0 }}
          aria-label={t('undoRound')}
        >
          <Icon.Undo />
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={state.gameOver}
          onClick={() => setSheetOpen(true)}
        >
          <Icon.Plus size={18} /> {t('recordRound')} {nextRound}
        </button>
      </div>

      <div className="game-meta-actions">
        <button type="button" className="reset-btn" onClick={onReset}>
          {t('resetGame')}
        </button>
        <button type="button" className="newgame-btn" onClick={onNewGame}>
          {t('clearPlayers')}
        </button>
      </div>

      <RoundSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

// ── Top-scorer summary (Sebeeta) ─────────────────────────────────

type TopSummaryProps = {
  totals: number[];
  players: string[];
  playerTeam: number[];
  teamLabel: (idx: 0 | 1) => string;
};

function SebeetaTopSummary({
  totals,
  players,
  playerTeam,
  teamLabel,
}: TopSummaryProps) {
  const tops = topScorerPerTeam(totals, playerTeam);
  return (
    <div className="team-summary">
      {([0, 1] as const).map((ti) => {
        const top = tops[ti];
        const topName = top ? players[top.playerIdx] : '—';
        const score = top?.score ?? 0;
        return (
          <div key={ti} className="team-summary-card">
            <div className="label">
              {teamLabel(ti)} · {topName}
            </div>
            <div className="value">{score}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Team scoreboard (Kout) ───────────────────────────────────────

type TeamsScoreboardProps = {
  totals: [number, number];
  threshold: number;
  dealer: number;
  winnerIdx: 0 | 1 | null;
  players: string[];
  playerTeam: number[];
  teamLabel: (idx: 0 | 1) => string;
  lastDelta: number[] | null;
};

function TeamsScoreboard({
  totals,
  threshold,
  dealer,
  winnerIdx,
  players,
  playerTeam,
  teamLabel,
  lastDelta,
}: TeamsScoreboardProps) {
  const anyScore = totals[0] + totals[1] > 0;
  return (
    <div className="team-stack">
      {([0, 1] as const).map((ti) => {
        const total = totals[ti];
        const pct = Math.min(100, (total / threshold) * 100);
        const isWinner = winnerIdx === ti;
        const isDealer = anyScore && ti === dealer && !isWinner;
        const isLeader = isWinner || total > totals[1 - ti];
        const members = players
          .filter((_, pi) => playerTeam[pi] === ti)
          .join(' & ');
        const delta = lastDelta ? lastDelta[ti] ?? 0 : 0;
        return (
          <div
            key={ti}
            className={`team-tile${isLeader && anyScore ? ' leader' : ''}`}
          >
            {isLeader && anyScore && !isDealer && (
              <div className="crown">
                <Icon.Crown size={16} />
              </div>
            )}
            <div>
              <div className="team-row">
                <div>
                  <div className="team-name">{teamLabel(ti)}</div>
                  <div className="members">{members}</div>
                </div>
                {delta > 0 && (
                  <div
                    className="pt-delta show"
                    style={{ position: 'static' }}
                  >
                    +{delta}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="team-score">{total}</div>
              <div className="team-bar">
                <div style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Individual scoreboard (Custom + Sebeeta) ─────────────────────

type IndividualScoreboardProps = {
  totals: number[];
  threshold: number;
  dealer: number;
  winnerIdx: number | null;
  players: string[];
  isSebeeta: boolean;
  lastDelta: number[] | null;
  dealerLabel: string;
};

function IndividualScoreboard({
  totals,
  threshold,
  dealer,
  winnerIdx,
  players,
  isSebeeta,
  lastDelta,
  dealerLabel,
}: IndividualScoreboardProps) {
  const compact = players.length >= 5;
  return (
    <div className={`player-grid${compact ? ' six' : ''}`}>
      {players.map((name, i) => {
        const total = totals[i] ?? 0;
        const isWinner = winnerIdx === i;
        const isDealer = isSebeeta && i === dealer && total > 0;
        const isLeader = isWinner;
        const pct = Math.min(100, (Math.abs(total) / threshold) * 100);
        const delta = lastDelta ? lastDelta[i] : null;
        return (
          <div
            key={i}
            className={`player-tile${isLeader ? ' leader' : ''}${compact ? ' compact' : ''}`}
          >
            <div className="pt-head">
              <div className="pt-name-wrap">
                <span className="pt-name">{name}</span>
                {isDealer && (
                  <span className="dealer-badge" title="Dealer">
                    {dealerLabel}
                  </span>
                )}
              </div>
              <span className="pt-seat">{i + 1}</span>
            </div>
            {isLeader && !isSebeeta && (
              <div className="crown">
                <Icon.Crown />
              </div>
            )}
            {delta != null && (
              <div className="pt-delta show">
                {delta > 0 ? '+' : ''}
                {delta}
              </div>
            )}
            <div>
              <div className="pt-score">{total}</div>
              <div className="pt-bar">
                <div style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
