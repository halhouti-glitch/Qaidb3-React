import type { ReactNode } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { relativeWhen } from '../lib/relativeWhen';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { CustomArt, KoutArt, SebeetaArt } from './home/GameArt';
import type { GameMode } from '../state/persistedState';
import type { Lang } from '../i18n/strings';

export function HomeScreen() {
  const { t, lang } = useLang();
  const { state, actions } = useGame();

  const hasActive =
    state.players.length > 0 && state.scores.length > 0 && !state.gameOver;
  const recents = state.recentGames.slice(0, 5);

  return (
    <div className="screen">
      <Header
        eyebrow="QAID"
        title={t('title')}
        left={
          <button
            type="button"
            className="icon-btn"
            onClick={() =>
              actions.setTheme(state.theme === 'dark' ? 'light' : 'dark')
            }
            aria-label={t('themeToggle')}
          >
            {state.theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}
          </button>
        }
        right={<LangPicker lang={state.lang} setLang={actions.setLang} label={t('language')} />}
      />
      <div className="home-body">
        <div className="home-hero">
          <div className="eyebrow">{t('homeEyebrow')}</div>
          <div className="heading">
            {t('homeHeadingPre')}
            <em>{t('homeHeadingEm')}</em>
            {t('homeHeadingPost')}
          </div>
          <div className="sub">{t('homeSub')}</div>
        </div>

        <GameCardButton
          mode="sebeeta"
          name={t('gameSebeeta')}
          desc={t('gameSebeetaDesc')}
          meta={t('gameSebeetaMeta')}
          onPick={() => actions.pickGame('sebeeta')}
        >
          <SebeetaArt />
        </GameCardButton>
        <GameCardButton
          mode="kout"
          name={t('gameKout')}
          desc={t('gameKoutDesc')}
          meta={t('gameKoutMeta')}
          onPick={() => actions.pickGame('kout')}
        >
          <KoutArt />
        </GameCardButton>
        <GameCardButton
          mode="custom"
          name={t('gameCustom')}
          desc={t('gameCustomDesc')}
          meta={t('gameCustomMeta')}
          onPick={() => actions.pickGame('custom')}
        >
          <CustomArt />
        </GameCardButton>

        {hasActive && (
          <div className="resume-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => actions.navigate('play')}
            >
              {t('resumeGame')}
            </button>
          </div>
        )}

        {recents.length > 0 && (
          <div className="recent-section">
            <h3>{t('recentGames')}</h3>
            {recents.map((g, i) => (
              <div key={`${g.when}-${i}`} className="recent-row">
                <div className="left">
                  <span className="swatch" data-game={g.kind} aria-hidden="true" />
                  <div className="info">
                    <div className="game-name">
                      {t(
                        g.kind === 'kout'
                          ? 'gameKout'
                          : g.kind === 'sebeeta'
                            ? 'gameSebeeta'
                            : 'gameCustom',
                      )}{' '}
                      · {g.players.join(', ')}
                    </div>
                    <div className="when">
                      {relativeWhen(g.when, lang)} ·{' '}
                      {t('historyCount')(g.roundCount)}
                    </div>
                  </div>
                </div>
                <div className="right">
                  <div className="winner">{g.winner}</div>
                  <div className="score">{g.score}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type GameCardProps = {
  mode: GameMode;
  name: string;
  desc: string;
  meta: string;
  onPick: () => void;
  children: ReactNode;
};

function GameCardButton({ mode, name, desc, meta, onPick, children }: GameCardProps) {
  return (
    <button type="button" className="game-card" onClick={onPick}>
      <div className="gc-art" data-game={mode} aria-hidden="true">
        {children}
      </div>
      <div className="gc-meta">
        <div className="name">{name}</div>
        <div className="desc">{desc}</div>
        <div className="meta-row">
          <span>{meta}</span>
        </div>
      </div>
    </button>
  );
}

type LangPickerProps = {
  lang: Lang;
  setLang: (l: Lang) => void;
  label: string;
};

function LangPicker({ lang, setLang, label }: LangPickerProps) {
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label={label}
      style={{
        background: 'transparent',
        border: 0,
        color: 'inherit',
        font: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        padding: '6px 4px',
      }}
    >
      <option value="ar">ع</option>
      <option value="en">EN</option>
    </select>
  );
}
