import { useMemo, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmSheet';
import { Header } from '../components/Header';
import { Icon } from '../components/Icon';
import { dealerIndex } from '../engine/scoring';

type Column = {
  short: string;
  full: string;
  idxs: number[];
};

export function HistoryScreen() {
  const { t } = useLang();
  const { state, actions } = useGame();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [editingRound, setEditingRound] = useState<number | null>(null);

  const isKout = state.gameMode === 'kout';

  const teamLabel = (idx: 0 | 1): string =>
    state.teamNames[idx]?.trim() ||
    (idx === 0 ? t('teamAFull') : t('teamBFull'));
  const teamShort = (idx: 0 | 1): string => {
    const label = teamLabel(idx);
    const stripped = label.replace(/^team\s+/i, '').trim();
    return (stripped.split(/\s+/).pop() ?? (idx === 0 ? 'A' : 'B')).slice(0, 10);
  };

  const cols: Column[] = useMemo(() => {
    if (isKout) {
      return [
        { short: teamShort(0), full: teamLabel(0), idxs: [0] },
        { short: teamShort(1), full: teamLabel(1), idxs: [1] },
      ];
    }
    return state.players.map((name, i) => ({
      short: name || `P${i + 1}`,
      full: name,
      idxs: [i],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKout, state.players, state.teamNames, t]);

  // Running totals + per-row dealer index
  const runningTotals = new Array<number>(cols.length).fill(0);
  const totalsByRow = state.scores.map((round) => {
    cols.forEach((c, ci) => {
      runningTotals[ci] += c.idxs.reduce((s, ix) => s + (round[ix] ?? 0), 0);
    });
    const dealer = runningTotals.some((v) => v > 0)
      ? dealerIndex(runningTotals.slice(), state.winRule)
      : -1;
    return { running: runningTotals.slice(), dealer };
  });

  const totalsFinal = runningTotals.slice();
  const totalsDealer = totalsFinal.some((v) => v > 0)
    ? dealerIndex(totalsFinal.slice(), state.winRule)
    : -1;

  const submitEdit = (idx: number, round: number[]) => {
    actions.editRound(idx, round);
    setEditingRound(null);
    toast.show(t('sheetUpdate'));
  };

  const onDelete = (idx: number) => {
    confirm({
      title: t('confirmDelete')(idx + 1),
      confirmLabel: t('deleteBtn'),
      destructive: true,
      onConfirm: () => {
        actions.deleteRound(idx);
        if (editingRound === idx) setEditingRound(null);
        else if (editingRound !== null && editingRound > idx) setEditingRound(editingRound - 1);
        toast.show(t('deleteBtn'));
      },
    });
  };

  const roundCount = state.scores.length;

  return (
    <div className="screen">
      <Header
        title={t('historyTitle')}
        eyebrow={t('historyCount')(roundCount)}
        left={
          <button
            type="button"
            className="icon-btn"
            onClick={() => actions.navigate('play')}
            aria-label={t('goBack')}
          >
            <Icon.Back />
          </button>
        }
      />

      <div className="history-body">
        {roundCount === 0 ? (
          <div className="history-empty">{t('historyEmpty')}</div>
        ) : (
          <>
            <div className="history-totals-card">
              <div className="htc-label">{t('historyTotals')}</div>
              <div
                className="htc-grid"
                style={{
                  gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`,
                }}
              >
                {cols.map((c, ci) => (
                  <div
                    key={ci}
                    className={`htc-cell${totalsDealer === ci ? ' dealer' : ''}`}
                  >
                    <div className="htc-name">{c.short}</div>
                    <div className="htc-val num">{totalsFinal[ci]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="history-hint">{t('historyTapHint')}</div>

            <div className="history-list">
              {state.scores.map((round, ri) => (
                <HistoryCardItem
                  key={ri}
                  round={round}
                  cols={cols}
                  editing={editingRound === ri}
                  onStartEdit={() => setEditingRound(ri)}
                  onCancelEdit={() => setEditingRound(null)}
                  onSave={(updated) => submitEdit(ri, updated)}
                  onDelete={() => onDelete(ri)}
                  saveLabel={t('saveBtn')}
                  cancelLabel={t('cancelBtn')}
                  roundLabel={t('historyRoundLabel')(ri + 1)}
                  editLabel={t('editBtn')}
                  deleteLabel={t('deleteBtn')}
                  dealerForRow={totalsByRow[ri]?.dealer ?? -1}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type CardItemProps = {
  round: number[];
  cols: Column[];
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updated: number[]) => void;
  onDelete: () => void;
  saveLabel: string;
  cancelLabel: string;
  editLabel: string;
  deleteLabel: string;
  roundLabel: string;
  dealerForRow: number;
};

function HistoryCardItem({
  round,
  cols,
  editing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  saveLabel,
  cancelLabel,
  editLabel,
  deleteLabel,
  roundLabel,
  dealerForRow,
}: CardItemProps) {
  const [draft, setDraft] = useState<string[]>(() =>
    cols.map((c) =>
      String(c.idxs.reduce((s, ix) => s + (round[ix] ?? 0), 0)),
    ),
  );

  const commit = () => {
    const updated = new Array<number>(round.length).fill(0);
    cols.forEach((c, ci) => {
      const parsed = parseInt(draft[ci] ?? '', 10);
      const value = Number.isNaN(parsed) ? 0 : parsed;
      // For columns spanning multiple indices (not used in current design but
      // safe), put the value in the first index.
      if (c.idxs[0] !== undefined) updated[c.idxs[0]] = value;
    });
    onSave(updated);
  };

  if (editing) {
    return (
      <div className="history-card" style={{ cursor: 'default' }}>
        <div className="hc-head">
          <span className="hc-no">{roundLabel}</span>
        </div>
        <div
          className="history-edit-row"
          style={{
            gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`,
          }}
        >
          {cols.map((c, ci) => (
            <input
              key={ci}
              type="number"
              inputMode="numeric"
              value={draft[ci] ?? '0'}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) =>
                setDraft((prev) =>
                  prev.map((v, k) => (k === ci ? e.target.value : v)),
                )
              }
              aria-label={c.full}
            />
          ))}
        </div>
        <div className="history-edit-buttons">
          <button
            type="button"
            className="btn-ghost"
            onClick={onCancelEdit}
            style={{
              background: 'transparent',
              boxShadow: 'inset 0 0 0 1px var(--line-strong)',
              color: 'var(--ink)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={commit}
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    );
  }

  // Read view
  return (
    <div className="history-card" style={{ cursor: 'default' }}>
      <div className="hc-head">
        <span className="hc-no">{roundLabel}</span>
        <span className="hc-actions">
          <button
            type="button"
            className="hc-edit"
            onClick={onStartEdit}
            aria-label={editLabel}
          >
            <Icon.Edit size={14} />
          </button>
          <button
            type="button"
            className="hc-delete"
            onClick={onDelete}
            aria-label={deleteLabel}
          >
            <Icon.Trash size={14} />
          </button>
        </span>
      </div>
      <div
        className="hc-scores"
        style={{
          gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`,
        }}
      >
        {cols.map((c, ci) => {
          const v = c.idxs.reduce((s, ix) => s + (round[ix] ?? 0), 0);
          return (
            <div
              key={ci}
              className={`hc-score${v === 0 ? ' zero' : ''}${v < 0 ? ' neg' : ''}`}
            >
              <span className="hc-name">
                {c.short}
                {ci === dealerForRow && v > 0 ? ' ★' : ''}
              </span>
              <span className="hc-val num">
                {v > 0 ? '+' : ''}
                {v}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
