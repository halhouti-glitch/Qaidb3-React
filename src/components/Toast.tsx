import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// Optional in-toast action button — when provided, renders alongside the
// message and dismisses the toast after invocation. Used by the
// post-round-commit "Undo" snackbar (PORT_FROM_VANILLA.md item 5).
export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  durationMs?: number;
  action?: ToastAction;
};

type ToastContextValue = {
  show: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastState = {
  id: number;
  message: string;
  visible: boolean;
  action?: ToastAction;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, options: ToastOptions = {}) => {
    // Toasts with an action persist longer (4s) than plain confirmations
    // (1.6s) so the user has time to read + decide to undo.
    const defaultDuration = options.action ? 4000 : 1600;
    const durationMs = options.durationMs ?? defaultDuration;

    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (clearTimer.current) clearTimeout(clearTimer.current);

    const id = Date.now();
    setToast({ id, message, visible: true, action: options.action });

    hideTimer.current = setTimeout(() => {
      setToast((t) => (t && t.id === id ? { ...t, visible: false } : t));
    }, durationMs);
    clearTimer.current = setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, durationMs + 240);
  }, []);

  const dismissNow = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setToast((t) => (t ? { ...t, visible: false } : t));
    clearTimer.current = setTimeout(() => setToast(null), 240);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          className={`toast${toast.visible ? ' show' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="toast-message">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.action!.onClick();
                dismissNow();
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
