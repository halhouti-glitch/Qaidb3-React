import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { TrixKingPick } from '../components/TrixKingPick';
import { getGame } from '../games/registry';
import { topProfiles } from '../state/profiles';
import { QuickFill } from './setup/QuickFill';
import type { WinRule } from '../state/persistedState';

type IndividualMode = 'individual' | 'teams';

export function SetupScreen() {
  const { t } = useLang();
  const { state, actions } = useGame();
  const game = getGame(state.gameMode);

  // Typeahead suggestions for player-name inputs. Sorted by games-played
  // (then last-played) so the most-active names show up first in the
  // browser's native autocomplete dropdown.
  const profileSuggestions = useMemo(
    () => topProfiles(state.playerProfiles, 50).map((p) => p.name),
    [state.playerProfiles],
  );
  const mode = game.key;
  const isKout = mode === 'kout';
  const isSebeeta = mode === 'sebeeta';
  const isCustom = mode === 'custom';
  const isTrix = mode === 'trix';
  const isTeam = game.isTeamMode;

  // Trix → after Start we pick who holds the 7♥ (King of kingdom 0).
  const [kingPickOpen, setKingPickOpen] = useState(false);

  const initialCount = game.numPlayers ?? 4;
  const [count, setCount] = useState<number>(initialCount);

  // Custom + Trix: individual vs teams format. Trix defaults to teams (2v2).
  const [format, setFormat] = useState<IndividualMode>(
    isTeam || isTrix ? 'teams' : 'individual',
  );

  // Win condition (Custom only — registry's configurable flag)
  const [winRule, setWinRule] = useState<WinRule>(game.winRule);

  // Player names — sized to `count`. Resize-preserving edits.
  const [playerNames, setPlayerNames] = useState<string[]>(() =>
    Array.from(
      { length: initialCount },
      (_, i) => `${t('playerDefault')} ${i + 1}`,
    ),
  );
  useEffect(() => {
    setPlayerNames((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const next = prev.slice();
        for (let i = prev.length; i < count; i++) {
          next.push(`${t('playerDefault')} ${i + 1}`);
        }
        return next;
      }
      return prev.slice(0, count);
    });
  }, [count, t]);

  // If custom + teams selected but count is odd, flip back to individual.
  useEffect(() => {
    if (isCustom && format === 'teams' && count % 2 !== 0) {
      setFormat('individual');
    }
  }, [isCustom, format, count]);

  // Team names
  const [teamA, setTeamA] = useState<string>(t('teamAFull'));
  const [teamB, setTeamB] = useState<string>(t('teamBFull'));

  // Target (Play to) — registry defines per-mode default
  const initialTarget = game.defaultThreshold;
  const [target, setTarget] = useState<number>(initialTarget);
  const [customTargetMode, setCustomTargetMode] = useState<boolean>(
    game.configurable,
  );
  const [customTargetStr, setCustomTargetStr] = useState<string>(
    String(initialTarget),
  );
  const effectiveTarget = customTargetMode
    ? Math.max(1, parseInt(customTargetStr, 10) || 0)
    : target;

  const showsAsTeams =
    isTeam || ((isCustom || isTrix) && format === 'teams');

  const titleText = isKout
    ? t('setupTitleKout')
    : isSebeeta
      ? t('setupTitleSebeeta')
      : isTrix
        ? t('gameTrix')
        : t('setupTitleCustom');

  const standardTargets = isKout
    ? [51, 101]
    : isSebeeta
      ? [101, 151, 201, 301]
      : [50, 100, 150, 200];

  const setName = (i: number, v: string) =>
    setPlayerNames((prev) => prev.map((n, ix) => (ix === i ? v : n)));

  // A seat still holding its placeholder ("Player N") or left blank is
  // considered "open" for quick-add fills.
  const isOpenSeat = (name: string, i: number): boolean => {
    const trimmed = name.trim();
    return trimmed === '' || trimmed === `${t('playerDefault')} ${i + 1}`;
  };

  // Quick-add: drop a tapped top-player name into the first open seat.
  const fillNextSeat = (name: string) =>
    setPlayerNames((prev) => {
      const idx = prev.findIndex((n, i) => isOpenSeat(n, i));
      if (idx === -1) return prev;
      return prev.map((n, i) => (i === idx ? name : n));
    });

  const canStart =
    playerNames.every((n) => n.trim().length > 0) &&
    (isTrix || effectiveTarget > 0) &&
    (isTrix
      ? count === 4
      : isTeam
        ? count === 4 || count === 6
        : count >= 2 && count <= 6) &&
    !(isCustom && format === 'teams' && count % 2 !== 0);

  const resolvedNames = () =>
    playerNames.map((n, i) => n.trim() || `${t('playerDefault')} ${i + 1}`);

  // Trix: Start opens the King-pick sheet; startGame fires once a King is chosen.
  const pickKing = (kingFirst: number) => {
    setKingPickOpen(false);
    const names = resolvedNames();
    if (format === 'teams') {
      // Across pairing: seats 0&2 → team A, 1&3 → team B (i % 2).
      const playerTeam = names.map((_, i) => i % 2);
      actions.startGame({
        mode: 'trix',
        players: names,
        kingFirst,
        partnership: true,
        playerTeam,
        teamNames: [teamA.trim() || t('teamAFull'), teamB.trim() || t('teamBFull')],
      });
      return;
    }
    actions.startGame({ mode: 'trix', players: names, kingFirst });
  };

  const start = () => {
    if (isTrix) {
      setKingPickOpen(true);
      return;
    }
    const resolvedNames = playerNames.map(
      (n, i) => n.trim() || `${t('playerDefault')} ${i + 1}`,
    );

    if (isSebeeta || isKout) {
      const playerTeam = resolvedNames.map((_, i) => i % 2);
      const nameA = teamA.trim() || t('teamAFull');
      const nameB = teamB.trim() || t('teamBFull');
      actions.startGame({
        mode,
        players: resolvedNames,
        playerTeam,
        teamNames: [nameA, nameB],
        threshold: effectiveTarget,
      });
      return;
    }

    if (format === 'teams') {
      const playerTeam = resolvedNames.map((_, i) => i % 2);
      const nameA = teamA.trim() || t('teamAFull');
      const nameB = teamB.trim() || t('teamBFull');
      actions.startGame({
        mode: 'custom',
        players: resolvedNames,
        threshold: effectiveTarget,
        winRule,
        playerTeam,
        teamNames: [nameA, nameB],
      });
      return;
    }
    actions.startGame({
      mode: 'custom',
      players: resolvedNames,
      threshold: effectiveTarget,
      winRule,
    });
  };

  return (
    <div className="screen">
      {/* Shared typeahead source — referenced by every player-name input via
          list="playerProfilesList". Sorted by topProfiles() above. */}
      <datalist id="playerProfilesList">
        {profileSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <Header
        title={titleText}
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

      <div className="setup-body">
        {/* Format toggle: Custom + Trix. Sebeeta + Kout are hard-coded to teams
            in the engine (legacy parity). Trix defaults to teams (2v2). */}
        {(isCustom || isTrix) && (
          <div className="setup-section">
            <div className="label">{t('setupFormat')}</div>
            <div className="segmented">
              <button
                type="button"
                className={format === 'individual' ? 'on' : ''}
                onClick={() => setFormat('individual')}
              >
                {t('setupIndividuals')}
              </button>
              <button
                type="button"
                className={format === 'teams' ? 'on' : ''}
                onClick={() => setFormat('teams')}
                disabled={count % 2 !== 0}
                style={
                  count % 2 !== 0
                    ? { opacity: 0.35, cursor: 'not-allowed' }
                    : undefined
                }
              >
                {t('setupTeamsFormat')}
              </button>
            </div>
            {count % 2 !== 0 && (
              <div className="hint">{t('setupTeamsEvenHint')}</div>
            )}
          </div>
        )}

        {/* Player count chips. Team modes show [4, 6]; Custom shows 2–6.
            Trix is locked to exactly 4, so the chooser is hidden. */}
        {!isTrix && (
        <div className="setup-section">
          <div className="label">{t('setupPlayersLabel')}</div>
          <div className="chip-row">
            {(isTeam ? [4, 6] : [2, 3, 4, 5, 6]).map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${count === n ? 'active' : ''}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Quick-add: tap a saved top player into the next open seat. */}
        <QuickFill onPick={fillNextSeat} />

        {/* Player names — flat list or team blocks. */}
        <div className="setup-section">
          <div className="label">
            {showsAsTeams ? t('setupRosterPartners') : t('playerNames')}
          </div>
          {showsAsTeams ? (
            <TeamRoster
              count={count}
              names={playerNames}
              setName={setName}
              teamA={teamA}
              teamB={teamB}
              setTeamA={setTeamA}
              setTeamB={setTeamB}
              teamNamePlaceholder={t('setupTeamNamePlaceholder')}
              playerPlaceholder={t('setupPlayerPlaceholder')}
            />
          ) : (
            playerNames.map((name, i) => (
              <div key={i} className="player-input">
                <div className="seat">{i + 1}</div>
                <input
                  value={name}
                  onChange={(e) => setName(i, e.target.value)}
                  placeholder={t('setupPlayerPlaceholder')(i + 1)}
                  list="playerProfilesList"
                  autoComplete="off"
                />
              </div>
            ))
          )}
        </div>

        {/* Play to — hidden for Trix (the game ends when all 4 kingdoms
            complete, not at a threshold). */}
        {!isTrix && (
        <div className="setup-section">
          <div className="label">{t('setupPlayToLabel')}</div>
          {isCustom ? (
            <div className="custom-target">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={customTargetStr}
                onChange={(e) =>
                  setCustomTargetStr(e.target.value.replace(/[^0-9]/g, ''))
                }
                placeholder="100"
              />
              <span className="unit">{t('setupPoints')}</span>
            </div>
          ) : (
            <>
              <div className="chip-row">
                {standardTargets.map((tgt) => (
                  <button
                    key={tgt}
                    type="button"
                    className={`chip ${!customTargetMode && target === tgt ? 'active' : ''}`}
                    onClick={() => {
                      setTarget(tgt);
                      setCustomTargetMode(false);
                      setCustomTargetStr(String(tgt));
                    }}
                  >
                    {tgt}
                  </button>
                ))}
                <button
                  type="button"
                  className={`chip ${customTargetMode ? 'active' : ''}`}
                  onClick={() => setCustomTargetMode(true)}
                >
                  {t('setupTargetCustom')}
                </button>
              </div>
              {customTargetMode && (
                <div className="custom-target">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={customTargetStr}
                    onChange={(e) =>
                      setCustomTargetStr(e.target.value.replace(/[^0-9]/g, ''))
                    }
                  />
                  <span className="unit">{t('setupPoints')}</span>
                </div>
              )}
            </>
          )}
        </div>
        )}

        {/* Win condition (Custom only) */}
        {isCustom && (
          <div className="setup-section">
            <div className="label">{t('setupWinConditionLabel')}</div>
            <div className="segmented vstack">
              <button
                type="button"
                className={winRule === 'highest' ? 'on' : ''}
                onClick={() => setWinRule('highest')}
              >
                <div className="seg-title">{t('setupFirstToWins')}</div>
                <div className="seg-sub">{t('setupHighestTakesIt')}</div>
              </button>
              <button
                type="button"
                className={winRule === 'lowest' ? 'on' : ''}
                onClick={() => setWinRule('lowest')}
              >
                <div className="seg-title">{t('setupFirstToLoses')}</div>
                <div className="seg-sub">{t('setupLowestTakesIt')}</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="setup-cta">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!canStart}
          onClick={start}
        >
          <Icon.Check size={16} /> {t('setupStart')}
        </button>
      </div>

      {isTrix && (
        <TrixKingPick
          open={kingPickOpen}
          players={resolvedNames()}
          onPick={pickKing}
          onClose={() => setKingPickOpen(false)}
        />
      )}
    </div>
  );
}

type TeamRosterProps = {
  count: number;
  names: string[];
  setName: (i: number, v: string) => void;
  teamA: string;
  teamB: string;
  setTeamA: (v: string) => void;
  setTeamB: (v: string) => void;
  teamNamePlaceholder: string;
  playerPlaceholder: (n: number) => string;
};

function TeamRoster({
  count,
  names,
  setName,
  teamA,
  teamB,
  setTeamA,
  setTeamB,
  teamNamePlaceholder,
  playerPlaceholder,
}: TeamRosterProps) {
  const aIdx: number[] = [];
  const bIdx: number[] = [];
  for (let i = 0; i < count; i++) (i % 2 === 0 ? aIdx : bIdx).push(i);

  return (
    <>
      <TeamBlock
        letter="A"
        teamName={teamA}
        setTeamName={setTeamA}
        indices={aIdx}
        names={names}
        setName={setName}
        teamNamePlaceholder={teamNamePlaceholder}
        playerPlaceholder={playerPlaceholder}
      />
      <TeamBlock
        letter="B"
        teamName={teamB}
        setTeamName={setTeamB}
        indices={bIdx}
        names={names}
        setName={setName}
        teamNamePlaceholder={teamNamePlaceholder}
        playerPlaceholder={playerPlaceholder}
      />
    </>
  );
}

type TeamBlockProps = {
  letter: string;
  teamName: string;
  setTeamName: (v: string) => void;
  indices: number[];
  names: string[];
  setName: (i: number, v: string) => void;
  teamNamePlaceholder: string;
  playerPlaceholder: (n: number) => string;
};

function TeamBlock({
  letter,
  teamName,
  setTeamName,
  indices,
  names,
  setName,
  teamNamePlaceholder,
  playerPlaceholder,
}: TeamBlockProps) {
  return (
    <div className="team-block">
      <div className="team-block-head">
        <span className="team-letter">{letter}</span>
        <input
          className="team-name-input"
          value={teamName}
          placeholder={teamNamePlaceholder}
          onChange={(e) => setTeamName(e.target.value)}
          maxLength={24}
        />
        <span className="team-block-meta">
          {indices.map((i) => i + 1).join(' · ')}
        </span>
      </div>
      {indices.map((i) => (
        <div key={i} className="player-input">
          <div className={`seat${letter === 'A' ? ' seat-gold' : ''}`}>{i + 1}</div>
          <input
            value={names[i] ?? ''}
            onChange={(e) => setName(i, e.target.value)}
            placeholder={playerPlaceholder(i + 1)}
            list="playerProfilesList"
            autoComplete="off"
          />
        </div>
      ))}
    </div>
  );
}
