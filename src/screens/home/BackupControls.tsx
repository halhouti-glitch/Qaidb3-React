import { useRef } from 'react';
import { useLang } from '../../i18n/LangContext';
import { useGame } from '../../state/GameContext';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmSheet';
import { downloadBackup, parseBackup } from '../../state/backup';
import { Icon } from '../../components/Icon';

// Home-screen "Backup & restore" block. Export downloads the full persisted
// state as a JSON file; Import reads a file, validates it, and (after a
// confirm) replaces all current data. Lives on Home because that's the only
// screen with cross-cutting app chrome.
export function BackupControls() {
  const { t } = useLang();
  const { state, actions } = useGame();
  const toast = useToast();
  const { confirm } = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    downloadBackup(state);
    toast.show(t('backupExported'));
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;
    file
      .text()
      .then((text) => {
        const next = parseBackup(text);
        if (!next) {
          toast.show(t('backupImportError'));
          return;
        }
        confirm({
          title: t('backupConfirmReplace'),
          confirmLabel: t('backupImport'),
          destructive: true,
          onConfirm: () => {
            actions.replaceState(next);
            toast.show(t('backupRestored'));
          },
        });
      })
      .catch(() => toast.show(t('backupImportError')));
  };

  return (
    <div className="backup-section">
      <div className="backup-head">
        <h3>{t('backupTitle')}</h3>
      </div>
      <p className="backup-hint">{t('backupHint')}</p>
      <div className="backup-actions">
        <button type="button" className="btn btn-ghost" onClick={onExport}>
          <Icon.Download size={16} /> {t('backupExport')}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => fileRef.current?.click()}
        >
          <Icon.Upload size={16} /> {t('backupImport')}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
