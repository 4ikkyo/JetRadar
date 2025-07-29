import en from '../locales/en.json';
import ru from '../locales/ru.json';
import uk from '../locales/uk.json';

export const translations = { en, ru, uk };

export const translate = (lang, key) => translations[lang]?.[key] || translations.en[key] || key;
