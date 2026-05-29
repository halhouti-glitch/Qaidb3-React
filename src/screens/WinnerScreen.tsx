import { useMemo, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { ShareSheet } from '../components/ShareSheet';
import { checkWinner, teamTotalsFromPlayers, totals as computeTotals } from '../engine/scoring';

export function WinnerScreen() {
  const { t } = useLang();
  const { state, actions } = useGame();
  const [shareOpen, setShareOpen] = useState(false);

  const totalsArr = useMemo(() => computeTotals(state), [state]);
  const winner = useMemo(() => checkWinner(state, totalsArr), [state, totalsArr]);

  const isKout = state.gameMode === 'kout';
  const isSebeeta = state.gameMode === 'sebeeta';
  const lowestWins = state.winRule === 'lowest';

  const teamLabel = (idx: 0 | 1): string =>
    state.teamNames[idx]?.trim() ||
    (idx === 0 ? t('teamAFull') : t('teamBFull'));

  let winnerName = '—';
  let winnerScore: string | number = '—';
  let rivalScore = 0;
  let winnerSide: '0' | '1' | null = null;
  let won = 0;

  if (winner) {
    if (winner.type === 'player') {
      winnerName = state.players[winner.idx] ?? '—';
      won = totalsArr[winner.idx] ?? 0;
      winnerScore = won;
      const others = totalsArr.filter((_, i) => i !== winner.idx);
      rivalScore = lowestWins
        ? Math.max(...others)
        : Math.min(...others);
    } else {
      winnerName = teamLabel(winner.idx);
      winnerSide = winner.idx === 0 ? '0' : '1';
      if (isKout) {
        won = totalsArr[winner.idx] ?? 0;
        winnerScore = `${totalsArr[winner.idx]}–${totalsArr[1 - winner.idx]}`;
        rivalScore = totalsArr[1 - winner.idx] ?? 0;
      } else {
        // Trix 2v2 (and Custom+teams): totalsArr is per-player, so roll up to
        // team totals before indexing by the winning side.
        const src =
          state.gameMode === 'trix' && state.trixMatch?.partnership
            ? teamTotalsFromPlayers(totalsArr, state.playerTeam)
            : totalsArr;
        won = src[winner.idx] ?? 0;
        winnerScore = src[winner.idx] ?? 0;
        rivalScore = src[1 - winner.idx] ?? 0;
      }
    }
  }

  const eyebrow = isKout
    ? t('winnerWonBy')
    : isSebeeta
      ? t('winnerLowestWins')
      : lowestWins
        ? t('winnerLowestWins')
        : t('winnerFirstToFinish');

  const subtext = isKout
    ? t('winnerSubKout')(typeof winnerScore === 'number' ? winnerScore : won)
    : isSebeeta && winner?.type === 'team'
      ? t('winnerSubSebeetaTeam')(state.threshold)
      : lowestWins
        ? t('winnerSubLowest')(typeof winnerScore === 'number' ? winnerScore : won)
        : t('winnerSubFirst')(state.threshold);

  const teamsMode = winner?.type === 'team';

  return (
    <div className="screen">
      <Header
        eyebrow={t('winnerComplete')}
        title=" "
        left={
          <button
            type="button"
            className="icon-btn"
            onClick={() => actions.navigate('home')}
            aria-label={t('goHome')}
          >
            <Icon.Close size={18} />
          </button>
        }
        right={
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShareOpen(true)}
            aria-label={t('shareBtn')}
          >
            <Icon.Share size={18} />
          </button>
        }
      />
      <div className="winner-screen">
        <div className="winner-eyebrow">{eyebrow}</div>
        <div className="winner-crest">
          {teamsMode ? (
            <span>{winnerSide === '0' ? 'A' : 'B'}</span>
          ) : (
            <Icon.Crown size={42} />
          )}
        </div>
        <div className="winner-name">{winnerName}</div>
        <div className="winner-sub">{subtext}</div>
        <div className="winner-stats">
          <div className="stat">
            <div className="label">{t('winnerRounds')}</div>
            <div className="val">{state.scores.length}</div>
          </div>
          <div className="stat">
            <div className="label">
              {teamsMode ? t('winnerMargin') : t('winnerSpread')}
            </div>
            <div className="val">{Math.abs(won - rivalScore)}</div>
          </div>
          <div className="stat">
            <div className="label">{t('winnerTarget')}</div>
            <div className="val">{state.threshold}</div>
          </div>
        </div>
        <div className="winner-actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => actions.resetGame()}
          >
            {t('winnerRematch')}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => actions.navigate('home')}
          >
            {t('winnerBack')}
          </button>
        </div>
      </div>
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
