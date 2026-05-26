import { useLang } from '../i18n/LangContext';
import type { ScreenProps } from './types';

export function PlayScreen({ navigate }: ScreenProps) {
  const { t } = useLang();
  return (
    <div className="screen">
      <div className="play-body">
        <h2 className="heading" style={{ padding: '22px 22px 8px', margin: 0 }}>
          {t('standings')}
        </h2>
        <p className="sub" style={{ padding: '0 22px' }}>
          Phase 3 will fill this with the scoreboard, round controls, and sheet.
        </p>
        <div style={{ display: 'flex', gap: 8, padding: '16px 22px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('home')}>
            {t('goHome')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('history')}>
            {t('roundHistory')}
          </button>
        </div>
      </div>
    </div>
  );
}
