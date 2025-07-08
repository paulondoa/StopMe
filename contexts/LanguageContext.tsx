import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '../lib/i18n';

export type SupportedLanguage = 'en' | 'fr' | 'es' | 'de';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, options?: any) => string;
  supportedLanguages: { code: SupportedLanguage; name: string; nativeName: string }[];
}

const supportedLanguages = [
  { code: 'en' as SupportedLanguage, name: 'English', nativeName: 'English' },
  { code: 'fr' as SupportedLanguage, name: 'French', nativeName: 'Français' },
  { code: 'es' as SupportedLanguage, name: 'Spanish', nativeName: 'Español' },
  { code: 'de' as SupportedLanguage, name: 'German', nativeName: 'Deutsch' },
];

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    try {
      // Check for saved language preference
      const savedLanguage = await AsyncStorage.getItem('language');
      
      if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
        await i18n.changeLanguage(savedLanguage);
        setCurrentLanguage(savedLanguage as SupportedLanguage);
      } else {
        // Use device locale as fallback
        const deviceLocale = Localization.locale.split('-')[0];
        const supportedLocale = supportedLanguages.find(lang => lang.code === deviceLocale);
        
        if (supportedLocale) {
          await i18n.changeLanguage(supportedLocale.code);
          setCurrentLanguage(supportedLocale.code);
        } else {
          // Default to English
          await i18n.changeLanguage('en');
          setCurrentLanguage('en');
        }
      }
    } catch (error) {
      console.error('Error initializing language:', error);
      await i18n.changeLanguage('en');
      setCurrentLanguage('en');
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (language: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem('language', language);
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  const t = (key: string, options?: any) => {
    return i18n.t(key, options);
  };

  if (isLoading) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        supportedLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};