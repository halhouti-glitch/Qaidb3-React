import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLang } from '../i18n/LangContext';

// How often a long-lived standalone session re-checks for a fresh service
// worker. Without this, a PWA the user never closes would only discover a new
// build on a manual reload. One hour is frequent enough to surface updates the
// same day without hammering the network.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Surfaces an in-app "new version available" prompt for the PWA.
 *
 * The service worker is registered with `registerType: 'prompt'` (see
 * vite.config.ts), so a freshly-built worker installs but *waits* instead of
 * silently taking over. `useRegisterSW` flips `needRefresh` to true while that
 * worker is waiting; tapping Update calls `updateServiceWorker`, which skips
 * waiting and reloads the page onto the new build. Tapping Later just dismisses
 * the banner — the worker stays parked and the prompt returns next launch.
 */
export function UpdatePrompt() {
  const { t } = useLang();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="toast update-prompt show" role="status" aria-live="polite">
      <span className="toast-message">{t('updateAvailable')}</span>
      <button
        type="button"
        className="toast-action"
        onClick={() => void updateServiceWorker(true)}
      >
        {t('updateReload')}
      </button>
      <button
        type="button"
        className="toast-action toast-action--ghost"
        onClick={() => setNeedRefresh(false)}
      >
        {t('updateLater')}
      </button>
    </div>
  );
}
