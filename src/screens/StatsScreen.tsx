import { useMemo, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { initials } from '../lib/initials';
import { relativeWhen } from '../lib/relativeWhen';
import { RecentGameSheet } from '../components/RecentGameSheet';
import {
  activePlayerCount,
  currentStreaks,
  gamesByMode,
  leaderboard,
} from '../state/stats';
import type { GameMode } from '../state/persistedState';

const MODE_KEY: Record<GameMode, 'gameSebeeta' | 'gameKout' | 'gameCustom'> = {
  sebeeta: 'gameSebeeta',
  kout: 'gameKout',
  custom: 'gameCustom',
};

export function StatsScreen() {
  const { t, lang } = useLang();
  const { state, actions } = useGame();
  const [openRecent, setOpenRecent] = useState<number | null>(null);

  const byMode = useMemo(() => gamesByMode(state.recentGames), [state.recentGames]);
  const board = useMemo(() => leaderboard(state.playerProfiles, 8), [state.playerProfiles]);
  const streaks = useMemo(() => currentStreaks(state.recentGames, 5), [state.recentGames]);
  const players = activePlayerCount(state.playerProfiles);

  const totalGames = state.recentGames.length;
  const hasData = totalGames > 0 || board.length > 0;
  const modeChips = (Object.keys(byMode) as GameMode[]).filter((m) => byMode[m] > 0);

  return (
    <div className="screen">
      <Header
        title={t('statsTitle')}
        left={
          <button
            type="button"
            className="icon-btn"
            onClick={() => actions.navigate('home')}
            aria-label={t('goBack')}
          >
            <Icon.Back />
          </button>
        }
      />

      <div className="stats-body">
        {!hasData ? (
          <div className="stats-empty">{t('statsEmpty')}</div>
        ) : (
          <>
            <div className="stats-summary">
              <div className="stat-pill">
                <div className="sp-value num">{totalGames}</div>
                <div className="sp-label">{t('statsTotalGames')}</div>
              </div>
              <div className="stat-pill">
                <div className="sp-value num">{players}</div>
                <div className="sp-label">{t('topPlayers')}</div>
              </div>
            </div>

            {modeChips.length > 0 && (
              <section className="stats-section">
                <h3>{t('statsByMode')}</h3>
                <div className="stats-modes">
                  {modeChips.map((m) => (
                    <div key={m} className="mode-stat">
                      <span className="ms-swatch" data-game={m} aria-hidden="true" />
                      <span className="ms-name">{t(MODE_KEY[m])}</span>
                      <span className="ms-count num">{byMode[m]}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {board.length > 0 && (
              <section className="stats-section">
                <h3>{t('statsLeaderboard')}</h3>
                <div className="leaderboard">
                  {board.map((row, i) => (
                    <div key={row.key} className="lb-row">
                      <span className="lb-rank num">{i + 1}</span>
                      <span className="lb-avatar" aria-hidden="true">
                        {initials(row.name)}
                      </span>
                      <span className="lb-name">{row.name}</span>
                      <span className="lb-meta">
                        <span className="lb-rate num">{row.winRate}%</span>
                        <span className="lb-played">
                          {t('statsPlayedShort')(row.gamesPlayed)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="stats-section">
              <h3>{t('statsStreaks')}</h3>
              {streaks.length === 0 ? (
                <div className="stats-muted">{t('statsNoStreaks')}</div>
              ) : (
                <div className="streaks">
                  {streaks.map((s) => (
                    <div key={s.name} className="streak-row">
                      <Icon.Flame size={16} />
                      <span className="streak-name">{s.name}</span>
                      <span className="streak-count num">
                        {t('statsStreakOf')(s.streak)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {totalGames > 0 && (
              <section className="stats-section">
                <h3>{t('statsRecent')}</h3>
                <div className="stats-recent">
                  {state.recentGames.map((g, i) => (
                    <button
                      key={`${g.when}-${i}`}
                      type="button"
                      className="stats-recent-row"
                      onClick={() => setOpenRecent(i)}
                      aria-label={t('recentViewLabel')}
                    >
                      <span className="srr-swatch" data-game={g.kind} aria-hidden="true" />
                      <span className="srr-info">
                        <span className="srr-winner">{g.winner}</span>
                        <span className="srr-when">{relativeWhen(g.when, lang)}</span>
                      </span>
                      <span className="srr-score num">{g.score}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <RecentGameSheet
        recentIndex={openRecent}
        onClose={() => setOpenRecent(null)}
      />
    </div>
  );
}
