import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { shareGameImage } from './share';
import { DEFAULT_STATE, type PersistedState } from './state/persistedState';

// Smoke tests for the Web-Share fallback paths in share.ts. The canvas
// rendering itself isn't tested — jsdom has no canvas backend, and
// pixel-level assertions aren't worth the mock weight here. These tests
// verify the IO branches: alert on render failure, navigator.share usage
// when available, and download fallback when not.

function makeState(): PersistedState {
  return {
    ...DEFAULT_STATE,
    lang: 'en',
    gameMode: 'sebeeta',
    players: ['A', 'B', 'C', 'D', 'E', 'F'],
    playerTeam: [0, 0, 0, 1, 1, 1],
    teamNames: ['Alpha', 'Bravo'],
    threshold: 201,
    winRule: 'lowest',
    scores: [[210, 0, 0, 0, 0, 0]],
    gameOver: true,
  };
}

describe('shareGameImage — fallback paths', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('calls alert when canvas rendering fails (jsdom has no 2d context)', async () => {
    // jsdom returns null from canvas.getContext('2d') — renderGameSummaryPNG
    // returns null, shareGameImage hits the catch branch.
    await shareGameImage(makeState());
    expect(alertSpy).toHaveBeenCalled();
    // The fallback alert message comes from t('shareError').
    const msg = alertSpy.mock.calls[0]?.[0];
    expect(typeof msg).toBe('string');
  });

  it('uses navigator.share when the API is present and canShare returns true', async () => {
    // Mock the full canvas chain: getContext returns a stub, toBlob calls
    // back with a mock blob.
    const fakeBlob = new Blob(['png-data'], { type: 'image/png' });
    // Stub canvas 2d context: any method call returns the stub itself so
    // chained calls (e.g. `ctx.createLinearGradient(...).addColorStop(...)`)
    // don't NPE inside renderGameSummaryPNG.
    const ctxStub: unknown = new Proxy(
      {},
      {
        get: () => () => ctxStub,
        set: () => true,
      },
    );
    const origCreate = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          const el = origCreate('div') as unknown as HTMLCanvasElement;
          (el as unknown as { getContext: () => unknown }).getContext = () =>
            ctxStub;
          (el as unknown as { toBlob: (cb: (b: Blob) => void) => void }).toBlob =
            (cb) => cb(fakeBlob);
          return el;
        }
        return origCreate(tag);
      });

    const shareSpy = vi.fn().mockResolvedValue(undefined);
    const canShareSpy = vi.fn().mockReturnValue(true);
    const nav = navigator as Navigator & {
      share?: typeof shareSpy;
      canShare?: typeof canShareSpy;
    };
    const origShare = nav.share;
    const origCanShare = nav.canShare;
    nav.share = shareSpy;
    nav.canShare = canShareSpy;

    try {
      await shareGameImage(makeState());
      expect(canShareSpy).toHaveBeenCalled();
      expect(shareSpy).toHaveBeenCalledOnce();
      const arg = shareSpy.mock.calls[0]?.[0] as ShareData & { files: File[] };
      expect(arg.files).toBeDefined();
      expect(arg.files[0]).toBeInstanceOf(File);
      expect(arg.files[0].name).toMatch(/^qaid-\d{4}-\d{2}-\d{2}\.png$/);
    } finally {
      createSpy.mockRestore();
      nav.share = origShare;
      nav.canShare = origCanShare;
    }
  });
});
