import { useLang } from '../i18n/LangContext';
import { Icon } from './Icon';

type SheetFooterProps = {
  onSubmit: () => void;
  onClose: () => void;
  disabled: boolean;
};

// Cancel + Save footer shared by the round-entry sheets (RoundSheet,
// TrixRoundSheet, and future modes).
export function SheetFooter({ onSubmit, onClose, disabled }: SheetFooterProps) {
  const { t } = useLang();
  return (
    <div
      className="sheet-foot"
      style={{ marginTop: 14, marginInline: -22, marginBottom: -16 }}
    >
      <button type="button" className="btn btn-ghost" onClick={onClose}>
        {t('sheetCancel')}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onSubmit}
        disabled={disabled}
      >
        <Icon.Check size={16} /> {t('sheetSave')}
      </button>
    </div>
  );
}
