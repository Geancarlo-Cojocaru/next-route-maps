import { match } from 'path-to-regexp';

/** Define or import the locales if you're using i18n */
const LOCALES = ['en', 'ro'];

/**
 * @description Locales regex. This regex is used to match the locale in the URL pathname.
 * Delete if you're not using i18n.
 * Example: /^(en|ro)/
 */
const localesRegex = new RegExp(`^/(${LOCALES.join('|')})`);

/**
 * Check if the pathname is part of the routeMap.
 *
 * @param {string} pathname - The pathname to check
 * @param {string[]} jsonMap - The routeMap
 * @returns {boolean} - True if the pathname is part of the routeMap, false otherwise
 *
 * @example
 * const isPublic = checkRouteMap(pathname, publicRoutes);
 */
export const checkRouteMap = (pathname: string, jsonMap: string[]): boolean => {
  // Remove the locale from the pathname. If you're not using i18n, you can remove this line.
  const cleanPathname = pathname?.replace(localesRegex, '');
  return jsonMap.some((route) => !!match(route)(cleanPathname));
};
