// Bundles haptics + audio-blip into named UI moments. Each FX function reads
// the current `state.sound` flag from GameContext — pass-through wrappers,
// no extra plumbing at callsites. PORT_FROM_VANILLA.md item 7.
import { useCallback, useMemo } from 'react';
import { useGame } from '../state/GameContext';
import { vibrate } from './haptics';
import { blip } from './sound';

export type AudioFx = {
  /** Light tactile + tone — bare-minimum tap feedback. Currently unused but
   *  exported for future buttons / chips. */
  tap: () => void;
  /** Played after a round commit (saved scores). */
  roundCommit: () => void;
  /** Played when the user undoes a round (button or snackbar action). */
  undo: () => void;
  /** Major-triad arpeggio + multi-pulse vibration on game completion. */
  gameOver: () => void;
};

export function useAudio(): AudioFx {
  const { state } = useGame();
  const enabled = state.sound;

  const tap = useCallback(() => {
    vibrate(8, enabled);
    blip(880, 0.06, enabled, { gain: 0.06 });
  }, [enabled]);

  const roundCommit = useCallback(() => {
    vibrate(15, enabled);
    blip(660, 0.09, enabled, { gain: 0.1 });
  }, [enabled]);

  const undo = useCallback(() => {
    vibrate(10, enabled);
    blip(440, 0.08, enabled, { gain: 0.08 });
  }, [enabled]);

  const gameOver = useCallback(() => {
    vibrate([20, 60, 20, 60, 30], enabled);
    // Major triad: C5 / E5 / G5
    blip(523, 0.18, enabled, { gain: 0.1 });
    setTimeout(() => blip(659, 0.18, enabled, { gain: 0.1 }), 120);
    setTimeout(() => blip(784, 0.3, enabled, { gain: 0.12 }), 240);
  }, [enabled]);

  return useMemo(() => ({ tap, roundCommit, undo, gameOver }), [tap, roundCommit, undo, gameOver]);
}
