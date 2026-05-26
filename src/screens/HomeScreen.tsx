import { useLang } from '../i18n/LangContext';
import type { ScreenProps } from './types';

export function HomeScreen({ navigate }: ScreenProps) {
  const { t } = useLang();
  return (
    <div className="screen">
      <div className="home-body">
        <div className="home-hero">
          <span className="eyebrow">QAID</span>
          <h2 className="heading">{t('title')}</h2>
          <p className="sub">Phase 3 will replace this with the full home picker.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 22px' }}>
          <button type="button" className="btn btn-primary" onClick={() => navigate('setup')}>
            {t('startGame')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('play')}>
            {t('resumeGame')}
          </button>
        </div>
      </div>
    </div>
  );
}
