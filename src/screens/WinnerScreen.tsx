import { useLang } from '../i18n/LangContext';
import type { ScreenProps } from './types';

export function WinnerScreen({ navigate }: ScreenProps) {
  const { t } = useLang();
  return (
    <div className="screen winner-screen">
      <div className="winner-eyebrow">{t('matchComplete')}</div>
      <div className="winner-name">—</div>
      <div className="winner-sub">Phase 3 will fill this in with the celebration card.</div>
      <div className="winner-actions">
        <button type="button" className="btn btn-primary btn-block" onClick={() => navigate('play')}>
          {t('newGame')}
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate('home')}>
          {t('goHome')}
        </button>
      </div>
    </div>
  );
}
