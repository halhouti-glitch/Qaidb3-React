import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastContextValue = {
  show: (message: string, durationMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

type ToastState = { id: number; message: string; visible: boolean };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, durationMs = 1600) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (clearTimer.current) clearTimeout(clearTimer.current);

    const id = Date.now();
    setToast({ id, message, visible: true });

    hideTimer.current = setTimeout(() => {
      setToast((t) => (t && t.id === id ? { ...t, visible: false } : t));
    }, durationMs);
    clearTimer.current = setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, durationMs + 240);
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
        <div className={`toast${toast.visible ? ' show' : ''}`}>{toast.message}</div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
