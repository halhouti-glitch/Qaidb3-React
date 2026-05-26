import { useLang } from '../i18n/LangContext';
import type { ScreenProps } from './types';

export function HistoryScreen({ navigate }: ScreenProps) {
  const { t } = useLang();
  return (
    <div className="screen">
      <div className="history-body">
        <h2 className="heading" style={{ padding: '22px 22px 8px', margin: 0 }}>
          {t('roundHistory')}
        </h2>
        <p className="sub" style={{ padding: '0 22px' }}>
          Phase 3 will fill this in with the totals card and round list.
        </p>
        <div style={{ padding: '16px 22px' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('play')}>
            {t('goBack')}
          </button>
        </div>
      </div>
    </div>
  );
}
