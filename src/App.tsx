import { useCallback, useEffect, useRef, useState } from 'react';
import { LangProvider } from './i18n/LangContext';
import {
  loadState,
  saveState,
  type PersistedState,
} from './state/persistedState';
import type { Lang } from './i18n/strings';
import { GameProvider, useGame } from './state/GameContext';
import { ToastProvider } from './components/Toast';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { PlayScreen } from './screens/PlayScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { WinnerScreen } from './screens/WinnerScreen';

export function App() {
  const [state, setState] = useState<PersistedState>(() => loadState());

  // Persist on change. Skip the initial mount — the value already came from
  // localStorage on load, so re-writing it would be wasted work.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  const setLang = useCallback((lang: Lang) => {
    setState((s) => ({ ...s, lang }));
  }, []);

  return (
    <LangProvider lang={state.lang} setLang={setLang}>
      <ToastProvider>
        <GameProvider state={state} setState={setState}>
          <AppShell />
        </GameProvider>
      </ToastProvider>
    </LangProvider>
  );
}

function AppShell() {
  const { state } = useGame();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const screen = state.currentScreen;

  return (
    <div className="container">
      {screen === 'home' && <HomeScreen />}
      {screen === 'setup' && <SetupScreen />}
      {screen === 'play' && <PlayScreen />}
      {screen === 'history' && <HistoryScreen />}
      {screen === 'winner' && <WinnerScreen />}
      <footer className="app-version" aria-label="App version">
        v{__APP_VERSION__}
      </footer>
    </div>
  );
}
