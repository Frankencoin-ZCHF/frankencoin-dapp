/** @type {import('next-i18next').UserConfig} */
module.exports = {
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'de', 'es', 'fr'],
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    load: 'languageOnly',
    detection: {
      order: ['cookie', 'localStorage', 'path', 'htmlTag'],
      caches: ['cookie', 'localStorage']
    }
  }