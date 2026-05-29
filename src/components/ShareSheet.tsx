import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { useGame } from '../state/GameContext';
import { useToast } from './Toast';
import { useFocusTrap } from '../lib/useFocusTrap';
import { Icon } from './Icon';
import { copyShareText, shareGameImage, shareGameText } from '../share';
import type { Lang } from '../i18n/strings';

type Props = { open: boolean; onClose: () => void };

// Share options sheet — replaces the winner screen's single-tap PNG share with
// a menu: share image (in a chosen language), copy a text summary, or share as
// text via the native share sheet.
export function ShareSheet({ open, onClose }: Props) {
  const { t, lang } = useLang();
  const { state } = useGame();
  const toast = useToast();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [imgLang, setImgLang] = useState<Lang>(lang);
  const [busy, setBusy] = useState(false);

  useFocusTrap(sheetRef, open);

  // Keep the image-language default in sync with the UI language each time the
  // sheet opens.
  useEffect(() => {
    if (open) setImgLang(lang);
  }, [open, lang]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const shareImage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareGameImage({ ...state, lang: imgLang });
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const copy = async () => {
    const ok = await copyShareText(state);
    toast.show(ok ? t('shareCopied') : t('shareTextError'));
    onClose();
  };

  const asText = async () => {
    const ok = await shareGameText(state);
    if (!ok) toast.show(t('shareTextError'));
    onClose();
  };

  return (
    <>
      <div
        className={`sheet-scrim${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        className={`sheet share-sheet${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('shareOptionsTitle')}
        tabIndex={-1}
      >
        <div className="grabber" />
        <div className="share-sheet-head">
          <h2>{t('shareOptionsTitle')}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={t('closeLabel')}
          >
            <Icon.Close size={18} />
          </button>
        </div>

        <div className="share-lang">
          <span className="share-lang-label">{t('shareImageLangLabel')}</span>
          <div className="segmented share-lang-seg" role="group">
            <button
              type="button"
              className={imgLang === 'ar' ? 'on' : ''}
              onClick={() => setImgLang('ar')}
              aria-pressed={imgLang === 'ar'}
            >
              ع
            </button>
            <button
              type="button"
              className={imgLang === 'en' ? 'on' : ''}
              onClick={() => setImgLang('en')}
              aria-pressed={imgLang === 'en'}
            >
              EN
            </button>
          </div>
        </div>

        <div className="share-actions">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={shareImage}
            disabled={busy}
          >
            <Icon.Share size={16} /> {t('shareImageBtn')}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={asText}>
            <Icon.Share size={16} /> {t('shareTextBtn')}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={copy}>
            <Icon.Copy size={16} /> {t('shareCopyText')}
          </button>
        </div>
      </div>
    </>
  );
}
