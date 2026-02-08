// Importing the necessary libraries
import { I18nManager } from 'react-native';

// Define the available languages
export const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'bg', 'tr', 'ja', 'zh', 'hi', 'ar'];

// Set a default language
export const DEFAULT_LANGUAGE = 'en';

// Translation strings
export const UI_TRANSLATIONS = {
  en: {
    welcome: 'Welcome',
    goodbye: 'Goodbye',
    //... (87 more strings)
  },
  es: {
    welcome: 'Bienvenido',
    goodbye: 'Adiós',
    //... (87 more strings)
  },
  fr: {
    welcome: 'Bienvenue',
    goodbye: 'Au revoir',
    //... (87 more strings)
  },
  de: {
    welcome: 'Willkommen',
    goodbye: 'Auf Wiedersehen',
    //... (87 more strings)
  },
  it: {
    welcome: 'Benvenuto',
    goodbye: 'Arrivederci',
    //... (87 more strings)
  },
  pt: {
    welcome: 'Bem-vindo',
    goodbye: 'Adeus',
    //... (87 more strings)
  },
  bg: {
    welcome: 'Добре дошли',
    goodbye: 'Довиждане',
    //... (87 more strings)
  },
  tr: {
    welcome: 'Hoşgeldiniz',
    goodbye: 'Hoşça kal',
    //... (87 more strings)
  },
  ja: {
    welcome: 'ようこそ',
    goodbye: 'さようなら',
    //... (87 more strings)
  },
  zh: {
    welcome: '欢迎',
    goodbye: '再见',
    //... (87 more strings)
  },
  hi: {
    welcome: 'स्वागत है',
    goodbye: 'अलविदा',
    //... (87 more strings)
  },
  ar: {
    welcome: 'أهلًا وسهلًا',
    goodbye: 'وداعا',
    //... (87 more strings)
  }
};

// Helper functions
export const getTranslation = (key, lang = DEFAULT_LANGUAGE) => {
  const translations = UI_TRANSLATIONS[lang];
  return translations ? translations[key] : key;
};

export const setLanguage = (lang) => {
  if (LANGUAGES.includes(lang)) {
    I18nManager.forceRTL(lang === 'ar'); // Example for RTL languages
    return lang;
  }
  return DEFAULT_LANGUAGE;
};

export const getAvailableLanguages = () => LANGUAGES;