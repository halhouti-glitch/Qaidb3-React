import type { Screen } from '../state/persistedState';

export type ScreenProps = {
  navigate: (screen: Screen) => void;
};
