import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { expect, it } from 'vitest';
import ko from '@/i18n/translation/ko';
import en from '@/i18n/translation/en';

it('keeps Korean and English translations and interpolation working with the React integration', async () => {
  const instance = createInstance();
  await instance.use(initReactI18next).init({
    lng: 'ko',
    resources: { ko: { translation: ko }, en: { translation: en } },
    interpolation: { escapeValue: false },
  });
  expect(instance.t('my-info')).toBe('내 정보');
  expect(instance.t('ranking-subtitle', { user: '테스트', ranking: '새내기' })).toBe('테스트 님의 등급은 새내기입니다.');
  await instance.changeLanguage('en');
  expect(instance.t('my-info')).toBe('My info');
  expect(instance.t('ranking-posts-count', { count: 3 })).toBe('3');
});
