export type Locale = 'pt' | 'en' | 'es' | 'fr';

/**
 * Maps a BCP-47 language tag (e.g. navigator.language) to one of the 4
 * supported app locales. Falls back to 'en' for anything unknown.
 */
export function detectLocale(navigatorLocale: string): Locale {
  const lang = navigatorLocale.toLowerCase();
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('fr')) return 'fr';
  return 'en';
}
