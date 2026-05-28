import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLang } from '../i18n/LangContext';

// App-native confirm dialog — replaces `window.confirm`, which is jarring
// on mobile and breaks the Liquid Glass aesthetic. Reuses the same scrim +
// grabber primitives as RoundSheet so the styling comes for free
// (themes.css `.sheet`, `.sheet-scrim`, `.grabber`).

export type ConfirmOptions = {
  /** Headline question — usually the full sentence ("Reset the game?"). */
  title: string;
  /** Optional secondary body text. */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, the confirm button is styled as a danger action. */
  destructive?: boolean;
  /** Fired when the user taps Confirm. Cancel just closes the sheet. */
  onConfirm: () => void;
};

type ConfirmContextValue = {
  confirm: (opts: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type SheetState = ConfirmOptions & { id: number };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const [sheet, setSheet] = useState<SheetState | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setSheet({ ...opts, id: Date.now() });
  }, []);

  const close = useCallback(() => setSheet(null), []);

  const onConfirm = useCallback(() => {
    if (!sheet) return;
    sheet.onConfirm();
    setSheet(null);
  }, [sheet]);

  // Escape key cancels.
  useEffect(() => {
    if (!sheet) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [sheet, close]);

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  const confirmLabel = sheet?.confirmLabel ?? t('saveBtn');
  const cancelLabel = sheet?.cancelLabel ?? t('cancelBtn');

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {sheet && (
        <>
          <div
            className="sheet-scrim open"
            onClick={close}
            aria-hidden="true"
          />
          <div
            className="sheet confirm-sheet open"
            role="alertdialog"
            aria-modal="true"
            aria-label={sheet.title}
          >
            <div className="grabber" />
            <div className="confirm-body">
              <h2 className="confirm-title">{sheet.title}</h2>
              {sheet.message && (
                <p className="confirm-message">{sheet.message}</p>
              )}
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={close}
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  className={`btn ${sheet.destructive ? 'btn-danger' : 'btn-primary'}`}
                  onClick={onConfirm}
                  autoFocus
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
