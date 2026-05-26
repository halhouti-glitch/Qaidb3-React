import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { STRINGS, type Lang, type Strings, type StringKey } from './strings';

type LangContextValue = {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Lang) => void;
  t: <K extends StringKey>(key: K) => Strings[K];
};

const LangContext = createContext<LangContextValue | null>(null);

type LangProviderProps = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  children: ReactNode;
};

export function LangProvider({ lang, setLang, children }: LangProviderProps) {
  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', dir);
    document.title = STRINGS[lang].title;
  }, [lang, dir]);

  const t = useCallback(
    <K extends StringKey>(key: K): Strings[K] => STRINGS[lang][key],
    [lang],
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, dir, setLang, t }),
    [lang, dir, setLang, t],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
