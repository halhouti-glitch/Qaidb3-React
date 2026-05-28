import { useCallback, useState, type ReactElement, type ReactNode } from 'react';
import { render } from '@testing-library/react';
import { LangProvider } from '../i18n/LangContext';
import type { Lang } from '../i18n/strings';
import { ToastProvider } from '../components/Toast';
import { ConfirmProvider } from '../components/ConfirmSheet';
import {
  GameProvider,
  useGame,
  type GameActions,
} from '../state/GameContext';
import {
  DEFAULT_STATE,
  type PersistedState,
} from '../state/persistedState';

// Mirrors App.tsx's provider stack so the screens under test see the same
// context shape they would at runtime. Owns `state` so tests can drive it
// the way the real App does (via setState passed into GameProvider).
function TestProviders({
  initial,
  children,
}: {
  initial: PersistedState;
  children: ReactNode;
}) {
  const [state, setState] = useState<PersistedState>(initial);
  const setLang = useCallback((lang: Lang) => {
    setState((s) => ({ ...s, lang }));
  }, []);
  return (
    <LangProvider lang={state.lang} setLang={setLang}>
      <ToastProvider>
        <ConfirmProvider>
          <GameProvider state={state} setState={setState}>
            {children}
          </GameProvider>
        </ConfirmProvider>
      </ToastProvider>
    </LangProvider>
  );
}

// Tiny hidden component that publishes the current `state` + `actions` to
// the test via a mutable container. Re-runs on every state change so the
// container always points at the latest snapshot. Returning `null` keeps
// it invisible to DOM queries.
function GameProbe({ sink }: { sink: TestApi }) {
  const ctx = useGame();
  sink.state = ctx.state;
  sink.actions = ctx.actions;
  return null;
}

export type TestApi = {
  state: PersistedState;
  actions: GameActions;
};

export type RenderOptions = {
  /** Partial state merged into DEFAULT_STATE. `lang` defaults to 'en' and
   *  `sound` to false unless overridden. */
  initial?: Partial<PersistedState>;
};

export type RenderResult = ReturnType<typeof render> & {
  /** Always-current state/actions snapshot — read inside `act()` callbacks
   *  so the React update has flushed before you inspect. */
  api: TestApi;
};

// Mount a UI tree with the full provider stack and a state probe. Returns
// RTL's render result plus an `api` accessor for state + actions.
export function renderWithGame(
  ui: ReactElement | null,
  options: RenderOptions = {},
): RenderResult {
  const initial: PersistedState = {
    ...DEFAULT_STATE,
    lang: 'en',
    sound: false,
    ...options.initial,
  };
  // Pre-seed so tests can read api.state synchronously before any user
  // event fires.
  const sink = { state: initial, actions: {} as GameActions } as TestApi;
  const result = render(
    <TestProviders initial={initial}>
      <GameProbe sink={sink} />
      {ui}
    </TestProviders>,
  );
  return Object.assign(result, { api: sink });
}
