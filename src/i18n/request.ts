import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Default locale for SSR — the client overrides via I18nProvider
  const locale = 'pt';
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
