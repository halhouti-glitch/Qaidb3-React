import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider } from '../i18n/LangContext';
import { UpdatePrompt } from './UpdatePrompt';
import { __pwaMock } from '../test/pwa-register-mock';
import type { Lang } from '../i18n/strings';

function renderPrompt(lang: Lang = 'en') {
  return render(
    <LangProvider lang={lang} setLang={() => {}}>
      <UpdatePrompt />
    </LangProvider>,
  );
}

describe('UpdatePrompt', () => {
  beforeEach(() => {
    __pwaMock.reset();
  });

  it('renders nothing when no update is waiting', () => {
    const { container } = renderPrompt();
    expect(container.querySelector('.update-prompt')).toBeNull();
  });

  it('shows the banner when a new worker is waiting', () => {
    __pwaMock.needRefresh = true;
    renderPrompt('en');
    expect(screen.getByText('A new version is available.')).toBeTruthy();
    expect(screen.getByText('Update')).toBeTruthy();
    expect(screen.getByText('Later')).toBeTruthy();
  });

  it('reloads onto the new build when Update is tapped', () => {
    const updateServiceWorker = vi.fn();
    __pwaMock.needRefresh = true;
    __pwaMock.updateServiceWorker = updateServiceWorker;
    renderPrompt('en');
    fireEvent.click(screen.getByText('Update'));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('dismisses without reloading when Later is tapped', () => {
    const setNeedRefresh = vi.fn();
    const updateServiceWorker = vi.fn();
    __pwaMock.needRefresh = true;
    __pwaMock.setNeedRefresh = setNeedRefresh;
    __pwaMock.updateServiceWorker = updateServiceWorker;
    renderPrompt('en');
    fireEvent.click(screen.getByText('Later'));
    expect(setNeedRefresh).toHaveBeenCalledWith(false);
    expect(updateServiceWorker).not.toHaveBeenCalled();
  });

  it('renders the Arabic copy', () => {
    __pwaMock.needRefresh = true;
    renderPrompt('ar');
    expect(screen.getByText('يتوفر إصدار جديد.')).toBeTruthy();
    expect(screen.getByText('تحديث')).toBeTruthy();
  });
});
