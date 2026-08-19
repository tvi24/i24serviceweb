import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { en, type Dict, type TranslationKey } from './en';
import { th } from './th';

export type Lang = 'en' | 'th';

export type TVars = Record<string, string | number>;
export type TFunc = (key: TranslationKey, vars?: TVars) => string;

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunc;
}

const STORAGE_KEY = 'im.lang';
const DICTS: Record<Lang, Dict> = { en, th };

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'th') return stored;
  } catch {
    /* localStorage unavailable */
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('th')) {
    return 'th';
  }
  return 'en';
}

function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
}

/** Build a translator for a given language. Missing key → English → raw key never shown. */
export function makeTranslator(lang: Lang): TFunc {
  const dict = DICTS[lang];
  return (key, vars) => {
    const template = dict[key] ?? en[key] ?? '';
    return interpolate(template, vars);
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = resolveInitialLang();
    if (typeof document !== 'undefined') document.documentElement.lang = initial;
    return initial;
  });

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') document.documentElement.lang = next;
    setLangState(next);
  }, []);

  const t = useMemo<TFunc>(() => makeTranslator(lang), [lang]);

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const fallback: I18nContextValue = { lang: 'en', setLang: () => {}, t: makeTranslator('en') };

/** Full i18n context. Falls back to English when used outside a provider (e.g. unit tests). */
export function useI18n(): I18nContextValue {
  return useContext(I18nContext) ?? fallback;
}

/** Convenience hook returning just the translator. */
export function useT(): TFunc {
  return useI18n().t;
}
