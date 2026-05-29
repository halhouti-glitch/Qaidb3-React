import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { useAudio } from '../lib/audio';
import { useToast } from './Toast';
import { useFocusTrap } from '../lib/useFocusTrap';
import { Icon } from './Icon';
import {
  TRIX_LADDER,
  TRIX_NAGHIL,
  trixCurrentKingdom,
  trixExpectedDealTotal,
  trixKingIdx,
  trixKingdomRemaining,
} from '../engine/trix';
import type { TrixDeal, TrixPenalty } from '../state/persistedState';

// Per-penalty entry shape: KoH is a single capturer; the rest are per-player
// counts that must sum to a fixed total.
const PENALTY_TARGET: Record<TrixPenalty, number | null> = {
  kingOfHearts: null, // single capturer (+75)
  queens: 4, // × 25
  diamonds: 13, // × 10
  tricks: 13, // × 15
};
const PENALTY_PER: Record<TrixPenalty, number> = {
  kingOfHearts: 75,
  queens: 25,
  diamonds: 10,
  tricks: 15,
};

type TrixRoundSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function TrixRoundSheet({ open, onClose }: TrixRoundSheetProps) {
  const { t } = useLang();
  const { state, actions } = useGame();
  const toast = useToast();
  const fx = useAudio();
  const sheetRef = useRef<HTMLDivElement>(null);

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

  const trixMatch = state.trixMatch;
  const kingdom = trixMatch ? trixCurrentKingdom(trixMatch.rounds) : 0;
  const kingIdx = trixMatch ? trixKingIdx(trixMatch.kingFirst, kingdom) : 0;

  const submit = (scores: number[], deal: TrixDeal) => {
    actions.addTrixDeal(scores, deal);
    fx.roundCommit();
    toast.show(t('undoToastMessage'), {
      action: {
        label: t('undoBtn'),
        onClick: () => {
          fx.undo();
          actions.undoRound();
        },
      },
    });
    onClose();
  };

  return (
    <>
      <div
        className={`sheet-scrim${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('trixKingdomLabel')(kingdom + 1)}
        tabIndex={-1}
      >
        <div className="grabber" />
        <div className="sheet-header">
          <h2>{t('trixKingdomLabel')(kingdom + 1)}</h2>
          <div className="round-meta">
            {t('trixCurrentKing')(state.players[kingIdx] ?? '—')}
          </div>
        </div>
        <div className="sheet-body">
          {open && trixMatch && (
            <TrixEntry kingdom={kingdom} onSubmit={submit} onClose={onClose} />
          )}
        </div>
      </div>
    </>
  );
}

type TrixEntryProps = {
  kingdom: number;
  onSubmit: (scores: number[], deal: TrixDeal) => void;
  onClose: () => void;
};

function TrixEntry({ kingdom, onSubmit, onClose }: TrixEntryProps) {
  const { t } = useLang();
  const { state } = useGame();
  const players = state.players;
  const n = players.length;

  const { penalties: remaining, trixAvailable } = useMemo(
    () => trixKingdomRemaining(state.trixMatch!.rounds, kingdom),
    [state.trixMatch, kingdom],
  );

  // Deal type: default to whichever is the only option; else let the user pick.
  const onlyTrix = remaining.length === 0 && trixAvailable;
  const onlyPenalty = !trixAvailable && remaining.length > 0;
  const [dealType, setDealType] = useState<'penalty' | 'trix' | null>(
    onlyTrix ? 'trix' : onlyPenalty ? 'penalty' : null,
  );

  return (
    <div className="trix-entry">
      {/* Deal-type picker — only shown when both options are still open. */}
      {!onlyTrix && !onlyPenalty && (
        <div className="trix-block">
          <div className="trix-label">{t('trixDealTypeLabel')}</div>
          <div className="segmented">
            <button
              type="button"
              className={dealType === 'penalty' ? 'on' : ''}
              disabled={remaining.length === 0}
              onClick={() => setDealType('penalty')}
            >
              {t('trixPenaltyDeal')}
            </button>
            <button
              type="button"
              className={dealType === 'trix' ? 'on' : ''}
              disabled={!trixAvailable}
              onClick={() => setDealType('trix')}
            >
              {t('trixLadderDeal')}
            </button>
          </div>
        </div>
      )}

      {dealType === 'penalty' && (
        <PenaltyEntry
          players={players}
          remaining={remaining}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      )}
      {dealType === 'trix' && (
        <LadderEntry n={n} players={players} onSubmit={onSubmit} onClose={onClose} />
      )}
      {dealType === null && (
        <p className="trix-hint-text">{t('trixSelectContracts')}</p>
      )}
    </div>
  );
}

// ── Penalty deal: merge multi-select + per-contract inputs ──────────

type PenaltyEntryProps = {
  players: string[];
  remaining: TrixPenalty[];
  onSubmit: (scores: number[], deal: TrixDeal) => void;
  onClose: () => void;
};

function PenaltyEntry({ players, remaining, onSubmit, onClose }: PenaltyEntryProps) {
  const { t } = useLang();
  const zeros = useMemo(() => players.map(() => 0), [players]);

  const [selected, setSelected] = useState<TrixPenalty[]>([]);
  const [kohCapturer, setKohCapturer] = useState<number | null>(null);
  const [queens, setQueens] = useState<number[]>(zeros);
  const [diamonds, setDiamonds] = useState<number[]>(zeros);
  const [tricks, setTricks] = useState<number[]>(zeros);

  const counts: Record<'queens' | 'diamonds' | 'tricks', [number[], (v: number[]) => void]> = {
    queens: [queens, setQueens],
    diamonds: [diamonds, setDiamonds],
    tricks: [tricks, setTricks],
  };

  const toggle = (c: TrixPenalty) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const contractName = (c: TrixPenalty): string =>
    c === 'kingOfHearts'
      ? t('trixKingOfHearts')
      : c === 'queens'
        ? t('trixQueens')
        : c === 'diamonds'
          ? t('trixDiamonds')
          : t('trixTricks');

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const scores = players.map((_, p) => {
    let s = 0;
    if (selected.includes('kingOfHearts') && kohCapturer === p) s += PENALTY_PER.kingOfHearts;
    if (selected.includes('queens')) s += queens[p] * PENALTY_PER.queens;
    if (selected.includes('diamonds')) s += diamonds[p] * PENALTY_PER.diamonds;
    if (selected.includes('tricks')) s += tricks[p] * PENALTY_PER.tricks;
    return s;
  });

  const complete =
    selected.length > 0 &&
    (!selected.includes('kingOfHearts') || kohCapturer !== null) &&
    (!selected.includes('queens') || sum(queens) === PENALTY_TARGET.queens) &&
    (!selected.includes('diamonds') || sum(diamonds) === PENALTY_TARGET.diamonds) &&
    (!selected.includes('tricks') || sum(tricks) === PENALTY_TARGET.tricks);

  const deal: TrixDeal = { kind: 'penalty', contracts: selected };
  const expected = trixExpectedDealTotal(deal);
  const actual = sum(scores);
  const checksumOff = complete && actual !== expected;

  const bump = (
    setter: (v: number[]) => void,
    arr: number[],
    p: number,
    d: number,
    max: number,
  ) => {
    const next = Math.max(0, Math.min(max, (arr[p] ?? 0) + d));
    setter(arr.map((v, i) => (i === p ? next : v)));
  };

  return (
    <>
      <div className="trix-block">
        <div className="trix-label">{t('trixSelectContracts')}</div>
        <div className="trix-contract-chips">
          {remaining.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${selected.includes(c) ? 'active' : ''}`}
              onClick={() => toggle(c)}
            >
              {contractName(c)}
            </button>
          ))}
        </div>
      </div>

      {selected.includes('kingOfHearts') && (
        <div className="trix-block">
          <div className="trix-label">{t('trixCapturerLabel')}</div>
          <div className="trix-capturer-row">
            {players.map((name, p) => (
              <button
                key={p}
                type="button"
                className={`chip ${kohCapturer === p ? 'active' : ''}`}
                onClick={() => setKohCapturer(kohCapturer === p ? null : p)}
              >
                {name} <span className="num">+75</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(['queens', 'diamonds', 'tricks'] as const).map((c) =>
        selected.includes(c) ? (
          <div key={c} className="trix-block">
            <div className="trix-label">
              {contractName(c)}
              <span className="trix-remaining num">
                {' · '}
                {t('trixCountRemaining')((PENALTY_TARGET[c] as number) - sum(counts[c][0]))}
              </span>
            </div>
            <div className="trix-count-rows">
              {players.map((name, p) => {
                const [arr, setter] = counts[c];
                return (
                  <div key={p} className="trix-count-row">
                    <span className="trix-count-name">{name}</span>
                    <div className="pmcontrol">
                      <button
                        type="button"
                        onClick={() => bump(setter, arr, p, -1, PENALTY_TARGET[c] as number)}
                        disabled={(arr[p] ?? 0) === 0}
                      >
                        <Icon.Minus size={14} />
                      </button>
                      <span className="val">{arr[p] ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => bump(setter, arr, p, 1, PENALTY_TARGET[c] as number)}
                        disabled={sum(arr) >= (PENALTY_TARGET[c] as number)}
                      >
                        <Icon.Plus size={14} />
                      </button>
                    </div>
                    <span className="trix-count-pts num">
                      +{(arr[p] ?? 0) * PENALTY_PER[c]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null,
      )}

      {checksumOff && (
        <div className="trix-warn">{t('trixChecksumWarn')(expected, actual)}</div>
      )}

      <SheetFooter
        onSubmit={() => onSubmit(scores.slice(), deal)}
        onClose={onClose}
        disabled={!complete}
      />
    </>
  );
}

// ── Trix ladder: assign finish order ────────────────────────────────

type LadderEntryProps = {
  n: number;
  players: string[];
  onSubmit: (scores: number[], deal: TrixDeal) => void;
  onClose: () => void;
};

function LadderEntry({ n, players, onSubmit, onClose }: LadderEntryProps) {
  const { t } = useLang();
  const [order, setOrder] = useState<number[]>([]); // player indices, finish order
  const [naghil, setNaghil] = useState(false);

  const tap = (p: number) =>
    setOrder((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const ladderScore = (pos: number) =>
    pos === 0 && naghil ? TRIX_NAGHIL : (TRIX_LADDER[pos] ?? 0);

  const scores = players.map((_, p) => {
    const pos = order.indexOf(p);
    return pos === -1 ? 0 : ladderScore(pos);
  });

  const complete = order.length === n;
  const deal: TrixDeal = naghil ? { kind: 'trix', naghil: true } : { kind: 'trix' };

  return (
    <>
      <div className="trix-block">
        <div className="trix-label">{t('trixFinishOrderLabel')}</div>
        <div className="trix-ladder-rows">
          {players.map((name, p) => {
            const pos = order.indexOf(p);
            const assigned = pos !== -1;
            return (
              <button
                key={p}
                type="button"
                className={`trix-ladder-row${assigned ? ' on' : ''}`}
                onClick={() => tap(p)}
              >
                <span className="trix-ladder-pos">
                  {assigned ? t('trixFinishPos')(pos + 1) : '—'}
                </span>
                <span className="trix-ladder-name">{name}</span>
                <span className="trix-ladder-pts num">
                  {assigned ? ladderScore(pos) : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="trix-naghil-toggle">
        <input
          type="checkbox"
          checked={naghil}
          onChange={(e) => setNaghil(e.target.checked)}
        />
        <span>
          <strong>{t('trixNaghil')}</strong> — {t('trixNaghilHint')}
        </span>
      </label>

      <SheetFooter
        onSubmit={() => onSubmit(scores.slice(), deal)}
        onClose={onClose}
        disabled={!complete}
      />
    </>
  );
}

// ── Footer (Cancel + Save) — mirrors RoundSheet's. ──────────────────

type SheetFooterProps = {
  onSubmit: () => void;
  onClose: () => void;
  disabled: boolean;
};

function SheetFooter({ onSubmit, onClose, disabled }: SheetFooterProps) {
  const { t } = useLang();
  return (
    <div
      className="sheet-foot"
      style={{ marginTop: 14, marginInline: -22, marginBottom: -16 }}
    >
      <button type="button" className="btn btn-ghost" onClick={onClose}>
        {t('sheetCancel')}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onSubmit}
        disabled={disabled}
      >
        <Icon.Check size={16} /> {t('sheetSave')}
      </button>
    </div>
  );
}
