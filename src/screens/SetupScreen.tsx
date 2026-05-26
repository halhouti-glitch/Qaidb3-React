import { useLang } from '../i18n/LangContext';
import type { ScreenProps } from './types';

export function SetupScreen({ navigate }: ScreenProps) {
  const { t } = useLang();
  return (
    <div className="screen">
      <div className="setup-body">
        <h2 className="heading" style={{ padding: '22px 22px 8px', margin: 0 }}>
          {t('gameSetup')}
        </h2>
        <p className="sub" style={{ padding: '0 22px' }}>
          Phase 3 will fill this in with the team setup, target chips, and roster.
        </p>
        <div style={{ display: 'flex', gap: 8, padding: '16px 22px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('home')}>
            {t('goBack')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('play')}>
            {t('startGame')}
          </button>
        </div>
      </div>
    </div>
  );
}
