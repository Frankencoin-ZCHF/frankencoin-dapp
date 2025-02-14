/** @type {import('next-i18next').UserConfig} */
module.exports = {
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'de', 'es'],
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    load: 'languageOnly',
  }