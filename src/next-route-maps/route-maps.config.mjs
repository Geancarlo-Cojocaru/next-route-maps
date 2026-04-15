/**
 * @typedef {Object} RouteMap
 * @property {string} outputPath - The output path for the JSON file.
 * @property {string[]} folderPaths - The folder paths to parse.
 * @property {string[]} [staticRoutes] - Optional static routes to include.
 */

/**
 * List of route maps to generate.
 * @type {RouteMap[]}
 *
 * @example
 * [{
 *   outputPath: 'src/next-route-maps/public-routes.json',
 *   folderPaths: ['src/app/[locale]/(app-presentation)', 'src/app/[locale]/(auth)'],
 *   staticRoutes: ['/', '/healthz'],
 * },
 * {
 *   outputPath: 'src/next-route-maps/private-routes.json',
 *   folderPaths: ['src/app/[locale]/(private)'],
 *   staticRoutes: ['/private'],
 * }]
 */
export const routeMaps = [
  { // Public routes example
    outputPath: 'src/next-route-maps/public-routes.json',
    folderPaths: [
      'src/app/[locale]/(app-presentation)',
      'src/app/[locale]/(auth)',
    ],
    staticRoutes: ['/', '/healthz'],
  },
];
