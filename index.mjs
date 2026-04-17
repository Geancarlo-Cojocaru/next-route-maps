import fs from 'fs';
import path from 'path';
import { getFileDir, getProjectRoot } from './utils/paths.mjs';
import { routeMaps } from './route-maps.config.mjs';

const rootDir = getProjectRoot(getFileDir(import.meta.url));

const isRouteGroup = /^\(.*\)$/;
const isDynamicRoute = /^\[(.+)]$/;
const isCatchAllRoute = /^\[\.{3}(.+)]$/;
const isOptionalCatchAllRoute = /^\[\[\.{3}(.+)]]$/;
const accoladeWithSlash = /\/\{\//g;

/**
 * Applies transformation to folder names based on the following rules:
 * - `[slug]` => `:slug`
 * - `[...slug]` => `*slug`
 * - `[[...slug]]` => `{/*slug}`
 * @param {string} folderName - The original folder name.
 * @returns {string|null} - The transformed folder name or `null` if it should not be included.
 */
const transformFolderName = (folderName) => {
  if (isRouteGroup.test(folderName)) {
    return null;
  } else if (isOptionalCatchAllRoute.test(folderName)) {
    const name = folderName.match(isOptionalCatchAllRoute)[1];
    return `{/*${name}}`;
  } else if (isCatchAllRoute.test(folderName)) {
    const name = folderName.match(isCatchAllRoute)[1];
    return `*${name}`;
  } else if (isDynamicRoute.test(folderName)) {
    const name = folderName.match(isDynamicRoute)[1];
    return `:${name}`;
  }
  return `/${folderName}`;
};

/**
 * Checks if a folder contains a file named 'page.tsx'.
 * @param {string} folderPath - The path of the folder to check.
 * @returns {boolean}
 */
const containsPageTsx = (folderPath) => {
  const files = fs.readdirSync(folderPath);
  return files.includes('page.tsx');
};

/**
 * Recursively parses a directory and returns an array of transformed folder paths.
 * @param {string} dir - The directory path to start parsing.
 * @param {string} basePath - The base path to maintain relative paths in the array.
 * @returns {string[]}
 */
const parseDirectoryToFoldersArray = (dir, basePath = '') => {
  let result = [];

  const items = fs.readdirSync(dir, { withFileTypes: true });

  items.forEach((item) => {
    if (item.isDirectory()) {
      const transformedFolderName = transformFolderName(item.name);
      const fullPath = path.join(dir, item.name);

      if (transformedFolderName !== null) {
        const relativePath = path.join(basePath, transformedFolderName);
        const relativePathProcessed = relativePath.replace(accoladeWithSlash, '{/');

        if (containsPageTsx(fullPath)) {
          result.push(relativePathProcessed);
        }

        result = result.concat(parseDirectoryToFoldersArray(fullPath, relativePath));
      } else {
        result = result.concat(parseDirectoryToFoldersArray(fullPath, basePath));
      }
    }
  });

  return result;
};

/**
 * Ensures the directory for the output file exists. If not, creates it.
 * @param {string} filePath - The path of the file (including the file name).
 */
const ensureDirectoryExistence = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Check if two arrays are equal. The order of the elements matters.
 * @param {string[]} array1
 * @param {string[]} array2
 * @returns {boolean}
 */
const arraysAreEqual = (array1, array2) => {
  if (array1.length !== array2.length) return false;
  return array1.every((element, index) => element === array2[index]);
};

/**
 * Writes the merged route map for multiple folder paths and optional static routes to a JSON file.
 * @param {string[]} folderPaths - The folder paths to parse.
 * @param {string} outputPath - The output path for the JSON file.
 * @param {string[]} [staticRoutes=[]] - Additional static routes to include.
 */
const generateSingleRouteMap = (folderPaths, outputPath, staticRoutes = []) => {
  try {
    const rootOutputPath = path.join(rootDir, outputPath);

    const folderPathsArray = folderPaths.flatMap((folderPath) =>
      parseDirectoryToFoldersArray(path.join(rootDir, folderPath)),
    );

    const combined = [...staticRoutes, ...folderPathsArray];

    ensureDirectoryExistence(rootOutputPath);

    let oldMap = [];
    if (fs.existsSync(rootOutputPath)) {
      oldMap = JSON.parse(fs.readFileSync(rootOutputPath, 'utf-8'));
    }

    if (arraysAreEqual(combined, oldMap)) {
      console.log(`Route map for '${outputPath}' is up to date, skipping.`);
      return;
    }

    fs.writeFileSync(rootOutputPath, JSON.stringify(combined, null, 2), 'utf-8');
    console.log(`Route map written to '${outputPath}'`);
  } catch (err) {
    console.error(`Error while writing route map: ${err.message}`);
  }
};

/**
 * Generates all route maps defined in route-maps.config.mjs.
 */
export const generateRouteMaps = () => {
  routeMaps.forEach(({ folderPaths, outputPath, staticRoutes }) => {
    generateSingleRouteMap(folderPaths, outputPath, staticRoutes);
  });
};

if (process.argv.includes('generateRouteMaps')) {
  generateRouteMaps();
}
