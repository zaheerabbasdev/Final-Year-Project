'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import en from '../../messages/en.json';
import ur from '../../messages/ur.json';

export type Lang = 'en' | 'ur';

// ---------------------------------------------------------------------------
// t() — dot-notation key resolver
// e.g. t('auth.login.signIn') → "Sign in"
// ---------------------------------------------------------------------------
function resolve(messages: Record<string, any>, key: string): string {
  const parts = key.split('.');
  let node: any = messages;
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return key;
    node = node[part];
  }
  return typeof node === 'string' ? node : key;
}

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------
interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  isRTL: false,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kaarkun_lang') as Lang | null;
      if (stored === 'ur' || stored === 'en') {
        setLangState(stored);
      }
    } catch {}
  }, []);

  // Persist + apply dir / lang attribute to <html> whenever language changes
  useEffect(() => {
    try {
      localStorage.setItem('kaarkun_lang', lang);
    } catch {}
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const messages = lang === 'ur' ? ur : en;

  const t = useCallback(
    (key: string) => resolve(messages as Record<string, any>, key),
    [messages],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ur' }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useLanguage() {
  return useContext(LanguageContext);
}
