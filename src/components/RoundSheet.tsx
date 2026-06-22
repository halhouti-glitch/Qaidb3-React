import { useMemo, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { useAudio } from '../lib/audio';
import { useToast } from './Toast';
import { BottomSheet } from './BottomSheet';
import { SheetFooter } from './SheetFooter';
import { Icon } from './Icon';
import {
  KOUT_CONTRACT_SCORES,
  KOUT_LEVELS,
  computeContractScore,
  isContractComplete,
  totals as computeTotals,
} from '../engine/scoring';
import type {
  KoutCaller,
  KoutLevel,
  KoutOutcome,
} from '../engine/types';

type RoundSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function RoundSheet({ open, onClose }: RoundSheetProps) {
  const { t } = useLang();
  const { state, actions } = useGame();
  const toast = useToast();
  const fx = useAudio();

  const submit = (round: number[]) => {
    // Vanilla flow (PORT_FROM_VANILLA.md item 5): commit, then surface a
    // non-blocking snackbar with an Undo action button. Replaces the old
    // passive "Saved · Round N" toast + the window.confirm on the Undo
    // button — the snackbar IS the confirm.
    actions.addRound(round);
    fx.roundCommit();
    toast.show(t('undoToastMessage'), {
      action: {
        label: t('undoBtn'),
        onClick: () => {
          // Item 7: snackbar Undo path also fires the undo haptic + tone.
          fx.undo();
          actions.undoRound();
        },
      },
    });
    onClose();
  };

  const roundNum = state.scores.length + 1;
  const isKout = state.gameMode === 'kout';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label={`${t('roundLabel')} ${roundNum}`}
    >
      <div className="sheet-header">
        <h2>
          {t('roundLabel')} {roundNum}
        </h2>
        {isKout ? (
          <KoutModeTabs
            mode={state.koutEntryMode}
            setMode={actions.setKoutEntryMode}
            contractLabel={t('koutTabContract')}
            manualLabel={t('koutTabManual')}
          />
        ) : (
          <div className="round-meta">{t('sheetPlayersHint')}</div>
        )}
      </div>
      <div className={`sheet-body${isKout ? ' kout-entry' : ''}`}>
        {open &&
          (isKout ? (
            <KoutEntry onSubmit={submit} onClose={onClose} />
          ) : (
            <PlayerEntry onSubmit={submit} onClose={onClose} />
          ))}
      </div>
    </BottomSheet>
  );
}

type EntryProps = {
  onSubmit: (round: number[]) => void;
  onClose: () => void;
};

// ── Mode tabs (Kout) ─────────────────────────────────────────────

type ModeTabsProps = {
  mode: 'contract' | 'manual';
  setMode: (m: 'contract' | 'manual') => void;
  contractLabel: string;
  manualLabel: string;
};

function KoutModeTabs({ mode, setMode, contractLabel, manualLabel }: ModeTabsProps) {
  return (
    <div className="kout-mode-tabs">
      <button
        type="button"
        className={mode === 'contract' ? 'on' : ''}
        onClick={() => setMode('contract')}
      >
        {contractLabel}
      </button>
      <button
        type="button"
        className={mode === 'manual' ? 'on' : ''}
        onClick={() => setMode('manual')}
      >
        {manualLabel}
      </button>
    </div>
  );
}

// ── Kout entry root ──────────────────────────────────────────────

function KoutEntry({ onSubmit, onClose }: EntryProps) {
  const { state } = useGame();
  return state.koutEntryMode === 'contract' ? (
    <KoutContractEntry onSubmit={onSubmit} onClose={onClose} />
  ) : (
    <KoutManualEntry onSubmit={onSubmit} onClose={onClose} />
  );
}

// ── Kout: contract entry ─────────────────────────────────────────

function KoutContractEntry({ onSubmit, onClose }: EntryProps) {
  const { t } = useLang();
  const { state } = useGame();
  const [caller, setCaller] = useState<KoutCaller | null>(null);
  const [level, setLevel] = useState<KoutLevel | null>(null);
  const [outcome, setOutcome] = useState<KoutOutcome | null>(null);

  const teamTotals = useMemo(() => computeTotals(state), [state]);
  const teamLabel = (idx: 0 | 1): string =>
    state.teamNames[idx]?.trim() ||
    (idx === 0 ? t('teamAFull') : t('teamBFull'));
  const teamShort = (idx: 0 | 1): string => {
    const label = teamLabel(idx);
    const stripped = label.replace(/^team\s+/i, '').trim();
    return stripped.split(/\s+/).pop() ?? (idx === 0 ? 'A' : 'B');
  };
  const members = (idx: 0 | 1): string =>
    state.players
      .filter((_, pi) => state.playerTeam[pi] === idx)
      .join(' & ');

  const complete = isContractComplete({ caller, level, outcome });
  const [a, b] = computeContractScore(caller, level, outcome);

  const koutLevelLabel = (lv: KoutLevel): string => {
    if (lv === 'bab') return t('levelBab');
    if (lv === 'bawan') return t('levelBawan');
    if (lv === 'malzoom') return t('levelMalzoom');
    return lv;
  };

  const submit = () => {
    if (!complete) return;
    onSubmit([a, b]);
  };

  return (
    <div className="kout-entry">
      <div className="kf-block">
        <div className="kf-label">{t('koutWhoCalled')}</div>
        <div className="kf-bidder">
          {([0, 1] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`kf-bidder-card${caller === id ? ' on' : ''}`}
              onClick={() => setCaller(caller === id ? null : id)}
            >
              <div className="kf-letter">{id === 0 ? 'A' : 'B'}</div>
              <div className="kf-name">{teamLabel(id)}</div>
              <div className="kf-sub">{members(id)}</div>
              <div className="kf-running num">{teamTotals[id] ?? 0}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="kf-block">
        <div className="kf-label">{t('koutContractLabel')}</div>
        <div className="kf-levels">
          {KOUT_LEVELS.map((lv) => {
            const cfg = KOUT_CONTRACT_SCORES[lv];
            const special = lv === 'bawan' || lv === 'malzoom';
            return (
              <button
                key={lv}
                type="button"
                className={`kf-level${level === lv ? ' on' : ''}${special ? ' special' : ''}`}
                onClick={() => setLevel(level === lv ? null : lv)}
              >
                <span className="kf-level-label">{koutLevelLabel(lv)}</span>
                <span className="kf-level-points">
                  <span className="win num">+{cfg.made}</span>
                  <span className="slash">/</span>
                  <span className="lose num">+{cfg.failed}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="kf-legend">
          <span>
            <span className="sw win" /> {t('koutLegendWin')}
          </span>
          <span>
            <span className="sw lose" /> {t('koutLegendLose')}
          </span>
        </div>
      </div>

      <div className="kf-block">
        <div className="kf-label">{t('koutResult')}</div>
        <div className="kf-outcome">
          <button
            type="button"
            className={`kf-result${outcome === 'made' ? ' on won' : ''}`}
            onClick={() => setOutcome(outcome === 'made' ? null : 'made')}
            disabled={!level || caller === null}
          >
            <div className="kf-result-title">{t('koutMade')}</div>
            <div className="kf-result-sub">
              {level && caller !== null ? (
                <>
                  {teamShort(caller)}{' '}
                  <span className="num">+{KOUT_CONTRACT_SCORES[level].made}</span>
                </>
              ) : (
                t('koutPickContract')
              )}
            </div>
          </button>
          <button
            type="button"
            className={`kf-result${outcome === 'failed' ? ' on lost' : ''}`}
            onClick={() => setOutcome(outcome === 'failed' ? null : 'failed')}
            disabled={!level || caller === null}
          >
            <div className="kf-result-title">{t('koutFailed')}</div>
            <div className="kf-result-sub">
              {level && caller !== null ? (
                <>
                  {teamShort((1 - caller) as 0 | 1)}{' '}
                  <span className="num">+{KOUT_CONTRACT_SCORES[level].failed}</span>
                </>
              ) : (
                t('koutPickContract')
              )}
            </div>
          </button>
        </div>
      </div>

      {complete && (
        <div className="kf-preview">
          <span>{t('koutThisRound')}</span>
          <div className="kf-preview-scores">
            <span>
              {teamShort(0)} <span className="num">+{a}</span>
            </span>
            <span className="kf-preview-dot" />
            <span>
              {teamShort(1)} <span className="num">+{b}</span>
            </span>
          </div>
        </div>
      )}

      <SheetFooter onSubmit={submit} onClose={onClose} disabled={!complete} />
    </div>
  );
}

// ── Kout: manual entry ───────────────────────────────────────────

function KoutManualEntry({ onSubmit, onClose }: EntryProps) {
  const { t } = useLang();
  const { state } = useGame();
  const [vals, setVals] = useState<[string, string]>(['0', '0']);

  const teamTotals = useMemo(() => computeTotals(state), [state]);
  const teamLabel = (idx: 0 | 1): string =>
    state.teamNames[idx]?.trim() ||
    (idx === 0 ? t('teamAFull') : t('teamBFull'));
  const members = (idx: 0 | 1): string =>
    state.players
      .filter((_, pi) => state.playerTeam[pi] === idx)
      .join(' & ');

  const setAt = (idx: 0 | 1, v: string) =>
    setVals((prev) => (idx === 0 ? [v, prev[1]] : [prev[0], v]));
  const bump = (idx: 0 | 1, d: number) => {
    const cur = parseInt(vals[idx], 10);
    const next = (Number.isNaN(cur) ? 0 : cur) + d;
    // No-minus rule for Kout: clamp at 0
    setAt(idx, String(Math.max(0, next)));
  };

  const a = Math.max(0, parseInt(vals[0], 10) || 0);
  const b = Math.max(0, parseInt(vals[1], 10) || 0);

  const submit = () => onSubmit([a, b]);

  return (
    <div className="kout-entry">
      <div className="kf-block">
        <div className="kf-label">{t('koutManualLabel')}</div>
        <div className="manual-note">{t('koutManualNote')}</div>
        <div className="manual-rows">
          {([0, 1] as const).map((idx) => (
            <div key={idx} className="manual-row">
              <span className="kf-letter">{idx === 0 ? 'A' : 'B'}</span>
              <div className="manual-row-meta">
                <div className="manual-name">{teamLabel(idx)}</div>
                <div className="manual-sub">
                  {members(idx)} · {t('koutRunning')}{' '}
                  <span className="num">{teamTotals[idx] ?? 0}</span>
                </div>
              </div>
              <div className="manual-pmcontrol">
                <button type="button" onClick={() => bump(idx, -1)}>
                  −
                </button>
                <input
                  inputMode="numeric"
                  value={vals[idx]}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) =>
                    setAt(idx, e.target.value.replace(/[^0-9]/g, ''))
                  }
                />
                <button type="button" onClick={() => bump(idx, 1)}>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="kf-preview">
        <span>{t('koutThisRound')}</span>
        <div className="kf-preview-scores">
          <span>
            A <span className="num">+{a}</span>
          </span>
          <span className="kf-preview-dot" />
          <span>
            B <span className="num">+{b}</span>
          </span>
        </div>
      </div>

      <SheetFooter onSubmit={submit} onClose={onClose} disabled={false} />
    </div>
  );
}

// ── Player entry (Sebeeta + Custom) ──────────────────────────────

function PlayerEntry({ onSubmit, onClose }: EntryProps) {
  const { state } = useGame();
  const isSebeeta = state.gameMode === 'sebeeta';
  // Sebeeta always uses numpad. Custom honours user's entryStyle preference.
  const useNumpad = isSebeeta || state.entryStyle === 'numpad';
  return useNumpad ? (
    <NumpadEntry onSubmit={onSubmit} onClose={onClose} />
  ) : (
    <BulkEntry onSubmit={onSubmit} onClose={onClose} />
  );
}

// ── Custom: ±-button "Bulk" entry ─────────────────────────────────

function BulkEntry({ onSubmit, onClose }: EntryProps) {
  const { t } = useLang();
  const { state, actions } = useGame();
  const [vals, setVals] = useState<number[]>(() => state.players.map(() => 0));

  const totalsArr = useMemo(() => computeTotals(state), [state]);
  const bump = (i: number, d: number) =>
    setVals((prev) =>
      prev.map((v, ix) => (ix === i ? Math.max(0, v + d) : v)),
    );

  const submit = () => onSubmit(vals.slice());

  return (
    <>
      <EntryStyleToggle
        style="pm"
        onChange={actions.setEntryStyle}
        bulkLabel={t('entryStylePlusMinus')}
        numpadLabel={t('entryStyleNumpad')}
      />
      <div>
        {state.players.map((name, i) => (
          <div key={i} className="entry-row">
            <div className="seat">{i + 1}</div>
            <div className="entry-row-who">
              <div className="who">{name}</div>
              <div className="running">{t('sheetRunning')(totalsArr[i] ?? 0)}</div>
            </div>
            <div className="pmcontrol">
              <button
                type="button"
                onClick={() => bump(i, -1)}
                disabled={vals[i] === 0}
              >
                <Icon.Minus size={14} />
              </button>
              <span className="val">{vals[i] ?? 0}</span>
              <button type="button" onClick={() => bump(i, 1)}>
                <Icon.Plus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <SheetFooter onSubmit={submit} onClose={onClose} disabled={false} />
    </>
  );
}

// ── Sebeeta + Custom: numpad entry ───────────────────────────────

function NumpadEntry({ onSubmit, onClose }: EntryProps) {
  const { t, lang } = useLang();
  const { state, actions } = useGame();
  const isCustom = state.gameMode === 'custom';
  const isSebeeta = state.gameMode === 'sebeeta';
  const n = state.players.length;
  const compact = n >= 5;

  const [vals, setVals] = useState<number[]>(() => state.players.map(() => 0));
  const [focusIdx, setFocusIdx] = useState(0);

  const totalsArr = useMemo(() => computeTotals(state), [state]);

  const tap = (key: number | 'del' | 'clr' | 'm10') => {
    setVals((arr) =>
      arr.map((v, ix) => {
        if (ix !== focusIdx) return v;
        if (key === 'clr') return 0;
        if (key === 'del') return Math.floor(v / 10);
        // Sebeeta-only shortcut: replaces the focused entry with -10 (the
        // legacy bonus that pushes the player away from the lose-threshold).
        if (key === 'm10') return -10;
        // If the current value is negative (came from m10), the next digit
        // overwrites — typing a fresh number after a shortcut should reset
        // rather than continue building (e.g. -10 → tap 5 should yield 5,
        // not -95).
        const next = v < 0 ? key : v * 10 + key;
        return next > 9999 ? v : next;
      }),
    );
  };

  const advance = () => setFocusIdx((i) => (i + 1) % n);
  const regress = () => setFocusIdx((i) => (i - 1 + n) % n);
  const submit = () => onSubmit(vals.slice());
  const arrowNext = lang === 'ar' ? '←' : '→';
  const arrowPrev = lang === 'ar' ? '→' : '←';

  return (
    <>
      {isCustom && (
        <EntryStyleToggle
          style="numpad"
          onChange={actions.setEntryStyle}
          bulkLabel={t('entryStylePlusMinus')}
          numpadLabel={t('entryStyleNumpad')}
        />
      )}
      <div>
        {state.players.map((name, i) => (
          <div
            key={i}
            className={`entry-row${compact ? ' compact' : ''}${
              focusIdx === i ? ' focused' : ''
            }`}
            onClick={() => setFocusIdx(i)}
            style={{ cursor: 'pointer' }}
          >
            <div className="seat">{i + 1}</div>
            <div className="entry-row-who">
              <div className="who">{name}</div>
              {!compact && (
                <div className="running">
                  {t('sheetRunning')(totalsArr[i] ?? 0)}
                </div>
              )}
            </div>
            {compact && (
              <div className="entry-running num">{totalsArr[i] ?? 0}</div>
            )}
            <button
              type="button"
              className={`numpad-input${focusIdx === i ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setFocusIdx(i);
              }}
            >
              {vals[i] ?? 0}
            </button>
          </div>
        ))}
      </div>
      <div className={`numpad${compact ? ' compact' : ''}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
          <button key={k} type="button" onClick={() => tap(k)}>
            {k}
          </button>
        ))}
        {/* Sebeeta swaps the bottom-row corners so the −10 shortcut lives on
            the left and CLR on the right — keeps CLR thumb-reachable beside
            the larger Next button without burying the −10 special-case. */}
        {isSebeeta ? (
          <button
            type="button"
            className="special m10"
            onClick={() => tap('m10')}
          >
            −10
          </button>
        ) : (
          <button type="button" className="special" onClick={() => tap('clr')}>
            {t('sheetClear')}
          </button>
        )}
        <button type="button" onClick={() => tap(0)}>
          0
        </button>
        {isSebeeta ? (
          <button type="button" className="special" onClick={() => tap('clr')}>
            {t('sheetClear')}
          </button>
        ) : (
          <button type="button" className="special" onClick={() => tap('del')}>
            ⌫
          </button>
        )}
        <div className="numpad-nav">
          <button
            type="button"
            className="prev"
            onClick={regress}
            aria-label={t('prevPlayer')}
          >
            {arrowPrev} {t('prevPlayer')}
          </button>
          <button
            type="button"
            className={focusIdx === n - 1 ? 'confirm' : 'next'}
            onClick={focusIdx === n - 1 ? submit : advance}
          >
            {focusIdx === n - 1 ? (
              <>
                <Icon.Check size={14} /> {t('sheetSave')}
              </>
            ) : (
              <>
                {t('nextPlayer')} {arrowNext}
              </>
            )}
          </button>
        </div>
      </div>
      <SheetFooter onSubmit={submit} onClose={onClose} disabled={false} />
    </>
  );
}

// ── Entry-style toggle (Bulk vs Numpad) ──────────────────────────

type EntryStyleToggleProps = {
  style: 'pm' | 'numpad';
  onChange: (s: 'pm' | 'numpad') => void;
  bulkLabel: string;
  numpadLabel: string;
};

function EntryStyleToggle({ style, onChange, bulkLabel, numpadLabel }: EntryStyleToggleProps) {
  return (
    <div className="kout-mode-tabs" style={{ marginBottom: 12 }}>
      <button
        type="button"
        className={style === 'pm' ? 'on' : ''}
        onClick={() => onChange('pm')}
      >
        {bulkLabel}
      </button>
      <button
        type="button"
        className={style === 'numpad' ? 'on' : ''}
        onClick={() => onChange('numpad')}
      >
        {numpadLabel}
      </button>
    </div>
  );
}
