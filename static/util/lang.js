const cleanLang = (code) => code.slice(0, 2);

export const getCurrentLanguage = () => cleanLang(navigator.language);

export const getLanguagesWithFallback = (fallbacks) =>
  navigator.languages.map(cleanLang).concat(fallbacks);
