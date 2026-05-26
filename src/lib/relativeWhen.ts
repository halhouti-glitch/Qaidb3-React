import type { Lang } from '../i18n/strings';

// Renders a recent-game timestamp as "Just now / Today / Yesterday / N days
// ago / locale date" relative to now. Mirrors legacy.html:2132.
export function relativeWhen(ts: number, lang: Lang, now: Date = new Date()): string {
  if (!ts) return '';
  const d = new Date(ts);
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 3600000;
  if (diffH < 1) return lang === 'ar' ? 'قبل قليل' : 'Just now';
  if (diffH < 24) return lang === 'ar' ? 'اليوم' : 'Today';
  if (diffH < 48) return lang === 'ar' ? 'أمس' : 'Yesterday';
  const days = Math.floor(diffH / 24);
  if (days < 7) return lang === 'ar' ? `قبل ${days} أيام` : `${days} days ago`;
  return d.toLocaleDateString(lang === 'ar' ? 'ar' : 'en');
}
