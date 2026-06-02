import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ar from "./locales/ar.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
];

export const DEFAULT_LANGUAGE = "en";

export const getDirection = (lng) =>
  SUPPORTED_LANGUAGES.find((l) => l.code === lng)?.dir ?? "ltr";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      // Persist the user's explicit choice, fall back to browser, then default
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "app_language",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

export default i18n;
