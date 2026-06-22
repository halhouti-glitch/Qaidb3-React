import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import {
  checkWinner,
  dealerIndex,
  teamTotalsFromPlayers,
  totals as computeTotals,
} from '../engine/scoring';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmSheet';
import { RoundSheet } from '../components/RoundSheet';
import { TrixRoundSheet } from '../components/TrixRoundSheet';
import { SebeetaTable } from './play/SebeetaTable';
import {
  TRIX_KINGDOMS,
  trixCurrentKingdom,
  trixKingIdx,
  trixKingdomRemaining,
} from '../engine/trix';
import type { TrixPenalty } from '../state/persistedState';
import { useAudio } from '../lib/audio';

export function PlayScreen() {
  const { t } = useLang();
  const { state, actions } = useGame();
  const toast = useToast();
  const { confirm } = useConfirm();
  const fx = useAudio();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastDelta, setLastDelta] = useState<number[] | null>(null);

  const isKout = state.gameMode === 'kout';
  const isSebeeta = state.gameMode === 'sebeeta';
  const isCustom = state.gameMode === 'custom';
  const isTrix = state.gameMode === 'trix';
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
      : isTrix
        ? 'gameTrix'
        : 'gameCustom';

  const isTrixTeams = isTrix && !!state.trixMatch?.partnership;
  const trixTeamTotals = useMemo<[number, number] | null>(
    () => (isTrixTeams ? teamTotalsFromPlayers(totalsArr, state.playerTeam) : null),
    [isTrixTeams, totalsArr, state.playerTeam],
  );

  // Trix kingdom/contract progress (derived, individual, lowest-wins).
  const trixKingdom = isTrix && state.trixMatch ? trixCurrentKingdom(state.trixMatch.rounds) : 0;
  const trixKing = isTrix && state.trixMatch ? trixKingIdx(state.trixMatch.kingFirst, trixKingdom) : 0;
  const trixRemaining =
    isTrix && state.trixMatch
      ? trixKingdomRemaining(state.trixMatch.rounds, trixKingdom)
      : { penalties: [] as TrixPenalty[], trixAvailable: false };

  const lowestWins = state.winRule === 'lowest';

  const teamLabel = (idx: 0 | 1): string =>
    state.teamNames[idx]?.trim() ||
    (idx === 0 ? t('teamAFull') : t('teamBFull'));

  const onUndo = () => {
    // Dedicated Undo button — no confirm dialog (the snackbar after each
    // round commit IS the primary confirm flow, per PORT_FROM_VANILLA.md
    // item 5). This path stays for users who scroll past the snackbar.
    if (state.scores.length === 0) return;
    fx.undo();
    actions.undoRound();
    toast.show(t('undoRound'));
  };
  const onReset = () => {
    confirm({
      title: t('confirmReset'),
      confirmLabel: t('resetGame'),
      destructive: true,
      onConfirm: () => actions.resetGame(),
    });
  };
  const onNewGame = () => {
    confirm({
      title: t('confirmClearPlayers'),
      confirmLabel: t('clearPlayers'),
      destructive: true,
      onConfirm: () => actions.clearPlayers(),
    });
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
        {isTrix ? (
          <>
            <TrixProgress
              kingdom={trixKingdom}
              kingName={state.players[trixKing] ?? '—'}
              remaining={trixRemaining}
            />
            {isTrixTeams && trixTeamTotals ? (
              <TrixTeamScoreboard
                totals={trixTeamTotals}
                players={state.players}
                playerTeam={state.playerTeam}
                teamLabel={teamLabel}
                winnerIdx={winner?.type === 'team' ? winner.idx : null}
                lastDelta={lastDelta ? teamTotalsFromPlayers(lastDelta, state.playerTeam) : null}
              />
            ) : (
              <TrixScoreboard
                totals={totalsArr}
                players={state.players}
                dealer={dealer}
                winnerIdx={winner?.type === 'player' ? winner.idx : null}
                lastDelta={lastDelta}
              />
            )}
          </>
        ) : (
        <>
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

        {isSebeeta ? (
          <SebeetaTable
            players={state.players}
            totals={totalsArr}
            playerTeam={state.playerTeam}
            threshold={state.threshold}
            dealer={dealer}
            teamLabel={teamLabel}
            lastDelta={lastDelta}
          />
        ) : showAsTeams && teamScoreboardTotals ? (
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
        </>
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

      {isTrix ? (
        <TrixRoundSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      ) : (
        <RoundSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      )}
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

// ── Trix kingdom/contract progress ───────────────────────────────

type TrixProgressProps = {
  kingdom: number;
  kingName: string;
  remaining: { penalties: TrixPenalty[]; trixAvailable: boolean };
};

function TrixProgress({ kingdom, kingName, remaining }: TrixProgressProps) {
  const { t } = useLang();
  const done = kingdom >= TRIX_KINGDOMS;
  const contractName = (c: TrixPenalty): string =>
    c === 'kingOfHearts'
      ? t('trixKingOfHearts')
      : c === 'queens'
        ? t('trixQueens')
        : c === 'diamonds'
          ? t('trixDiamonds')
          : t('trixTricks');
  return (
    <div className="trix-progress">
      <div className="trix-progress-head">
        <span className="trix-kingdom-pill">
          {t('trixKingdomLabel')(Math.min(kingdom + 1, TRIX_KINGDOMS))}
        </span>
        {!done && <span className="trix-king-pill">{t('trixCurrentKing')(kingName)}</span>}
      </div>
      {!done && (
        <div className="trix-remaining-chips">
          <span className="trix-remaining-label">{t('trixRemainingLabel')}:</span>
          {remaining.penalties.map((c) => (
            <span key={c} className="trix-remaining-chip">
              {contractName(c)}
            </span>
          ))}
          {remaining.trixAvailable && (
            <span className="trix-remaining-chip trix-ladder-chip">{t('trixTrix')}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Trix individual scoreboard (lowest wins, negative-friendly) ───

type TrixScoreboardProps = {
  totals: number[];
  players: string[];
  dealer: number;
  winnerIdx: number | null;
  lastDelta: number[] | null;
};

function TrixScoreboard({ totals, players, dealer, winnerIdx, lastDelta }: TrixScoreboardProps) {
  const { t } = useLang();
  // Leader = the lowest current total (penalty tally). Highlight it live.
  const anyScore = totals.some((v) => v !== 0);
  let lowestIdx = -1;
  let lowest = Infinity;
  totals.forEach((v, i) => {
    if (v < lowest) {
      lowest = v;
      lowestIdx = i;
    }
  });
  return (
    <div className="player-grid">
      {players.map((name, i) => {
        const total = totals[i] ?? 0;
        const isWinner = winnerIdx === i;
        const isLeader = winnerIdx != null ? isWinner : anyScore && i === lowestIdx;
        const isDealer = anyScore && i === dealer && !isLeader;
        const delta = lastDelta ? lastDelta[i] : null;
        return (
          <div key={i} className={`player-tile${isLeader ? ' leader' : ''}`}>
            <div className="pt-head">
              <div className="pt-name-wrap">
                <span className="pt-name">{name}</span>
                {isDealer && (
                  <span className="dealer-badge" title="Dealer">
                    {t('dealerBadge')}
                  </span>
                )}
              </div>
              <span className="pt-seat">{i + 1}</span>
            </div>
            {isLeader && (
              <div className="crown">
                <Icon.Crown />
              </div>
            )}
            {delta != null && delta !== 0 && (
              <div className="pt-delta show">
                {delta > 0 ? '+' : ''}
                {delta}
              </div>
            )}
            <div>
              <div className="pt-score">{total}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Trix team scoreboard (2v2, lowest team wins) ─────────────────

type TrixTeamScoreboardProps = {
  totals: [number, number];
  players: string[];
  playerTeam: number[];
  teamLabel: (idx: 0 | 1) => string;
  winnerIdx: 0 | 1 | null;
  lastDelta: [number, number] | null;
};

function TrixTeamScoreboard({
  totals,
  players,
  playerTeam,
  teamLabel,
  winnerIdx,
  lastDelta,
}: TrixTeamScoreboardProps) {
  const anyScore = totals[0] !== 0 || totals[1] !== 0;
  const lowerIdx: 0 | 1 = totals[0] <= totals[1] ? 0 : 1;
  return (
    <div className="team-stack">
      {([0, 1] as const).map((ti) => {
        const total = totals[ti];
        const isWinner = winnerIdx === ti;
        const isLeader = winnerIdx != null ? isWinner : anyScore && ti === lowerIdx;
        const members = players.filter((_, pi) => playerTeam[pi] === ti).join(' & ');
        const delta = lastDelta ? lastDelta[ti] : 0;
        return (
          <div key={ti} className={`team-tile${isLeader ? ' leader' : ''}`}>
            {isLeader && (
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
                {delta !== 0 && (
                  <div className="pt-delta show" style={{ position: 'static' }}>
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="team-score">{total}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
