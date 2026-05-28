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
import { ConfirmProvider } from './components/ConfirmSheet';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { PlayScreen } from './screens/PlayScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { WinnerScreen } from './screens/WinnerScreen';
import { useAudio } from './lib/audio';
import type { Screen } from './state/persistedState';

// Item 8: screen depth lookup. Forward transitions increase depth, back
// transitions decrease it. Equal-depth jumps default to forward (a tie
// shouldn't happen with the current state machine, but we keep the table
// total so future screens can be added without surprise).
const screenDepth: Record<Screen, number> = {
  home: 0,
  setup: 1,
  play: 2,
  history: 3,
  winner: 3,
};

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
        <ConfirmProvider>
          <GameProvider state={state} setState={setState}>
            <AppShell />
          </GameProvider>
        </ConfirmProvider>
      </ToastProvider>
    </LangProvider>
  );
}

function AppShell() {
  const { state } = useGame();
  const fx = useAudio();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Game-over fx — fire the major-triad arpeggio + multi-pulse vibration
  // exactly once when gameOver flips false → true. Tracked via ref so a
  // page reload with a finished game (gameOver already true at mount)
  // doesn't re-trigger. Item 7.
  const prevGameOver = useRef(state.gameOver);
  useEffect(() => {
    if (!prevGameOver.current && state.gameOver) {
      fx.gameOver();
    }
    prevGameOver.current = state.gameOver;
  }, [state.gameOver, fx]);

  // Item 8: derive transition direction *during render* so the
  // data-direction attribute on .container is in DOM at the moment the
  // new .screen child mounts. CSS animations run once on element mount;
  // setting direction in a useEffect would miss the first frame.
  //
  // Snapshot is stored in state so the derivation is StrictMode-safe —
  // a ref mutated during render would get overwritten by StrictMode's
  // second render pass. The setSnapshot-during-render pattern is
  // documented React (see "deriving state from props"); React aborts
  // the in-flight render and restarts with the new state before commit.
  const [transition, setTransition] = useState<{
    screen: Screen;
    direction: 'forward' | 'back';
  }>({ screen: state.currentScreen, direction: 'forward' });
  if (transition.screen !== state.currentScreen) {
    setTransition({
      screen: state.currentScreen,
      direction:
        screenDepth[state.currentScreen] >= screenDepth[transition.screen]
          ? 'forward'
          : 'back',
    });
  }
  const direction = transition.direction;

  const screen = state.currentScreen;

  return (
    <div className="container" data-direction={direction}>
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
