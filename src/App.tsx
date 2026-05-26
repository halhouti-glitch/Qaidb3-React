import { useCallback, useEffect, useRef, useState } from 'react';
import { LangProvider } from './i18n/LangContext';
import {
  loadState,
  saveState,
  type PersistedState,
  type Screen,
} from './state/persistedState';
import type { Lang } from './i18n/strings';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { PlayScreen } from './screens/PlayScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { WinnerScreen } from './screens/WinnerScreen';

export function App() {
  const [state, setState] = useState<PersistedState>(() => loadState());

  // Persist on change. Skip the initial mount — the value already came from
  // localStorage on load.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const setLang = useCallback((lang: Lang) => {
    setState((s) => ({ ...s, lang }));
  }, []);

  const navigate = useCallback((screen: Screen) => {
    setState((s) => ({ ...s, currentScreen: screen }));
  }, []);

  return (
    <LangProvider lang={state.lang} setLang={setLang}>
      <div className="container">
        {state.currentScreen === 'home' && <HomeScreen navigate={navigate} />}
        {state.currentScreen === 'setup' && <SetupScreen navigate={navigate} />}
        {state.currentScreen === 'play' && <PlayScreen navigate={navigate} />}
        {state.currentScreen === 'history' && <HistoryScreen navigate={navigate} />}
        {state.currentScreen === 'winner' && <WinnerScreen navigate={navigate} />}
      </div>
    </LangProvider>
  );
}
