# Next.js Route Maps Utility

This utility provides a robust way to generate JSON maps of your Next.js `app` directory routes. These maps are primarily used in **Proxy** to perform highly efficient, pattern-based route matching (e.g., for authentication, authorization, or redirects) without having to manually maintain a list of public/private paths.

The `proxy.js|ts` file is used to write Proxy and run code on the server before a request is completed. Then, based on the incoming request, you can modify the response by rewriting, redirecting, modifying the request or response headers, or responding directly.

Proxy executes before routes are rendered. It's particularly useful for implementing custom server-side logic like authentication, logging, or handling redirects.

## Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [How it Works](#how-it-works)
  - [Route Transformation Rules](#route-transformation-rules)
- [Configuration](#configuration)
- [Usage](#usage)
  - [1. Generating the Maps](#1-generating-the-maps)
  - [2. Using in Proxy](#2-using-in-proxy)
- [CI/CD & Automation](#cicd--automation)
- [Customization](#customization)

---

## Overview

In Next.js, managing complex route access can be error-prone when done manually. `next-route-maps` automates this by:
1. Scanning your `app` directory for `page.tsx` files.
2. Handling Route Groups (e.g., `(auth)`, `(app-presentation)`).
3. Transforming Next.js dynamic routes (`[slug]`, `[...catchAll]`) into standard `path-to-regexp` patterns.
4. Outputting a JSON array that can be imported and matched at runtime.

---

## Installation & Setup

This is an internal utility designed to be copy-pasted and modified. 

### Dependencies

Ensure your project has `path-to-regexp` installed:

```bash
npm install path-to-regexp
```

### File Structure

Place the utility in your project (e.g., `src/next-route-maps`):

```text
src/next-route-maps/
├── index.mjs               # The generator script (CLI)
├── route-maps.config.mjs    # Configuration (folders to scan)
├── parse-route-maps.ts      # Runtime utility for matching
└── utils/
    └── paths.mjs           # Path resolution helpers
```

---

## How it Works

The utility recursively traverses the specified directories in your `src/app` and looks for folders containing a `page.tsx` file.

### Route Transformation Rules

The generator maps Next.js filesystem naming conventions to `path-to-regexp` patterns:

| Next.js Folder | Transformed Pattern | Description                             |
|:---------------|:--------------------|:----------------------------------------|
| `(group)`      | *Ignored*           | Route groups are removed from the path. |
| `[slug]`       | `:slug`             | Standard dynamic parameter.             |
| `[...slug]`    | `*slug`             | Catch-all route.                        |
| `[[...slug]]`  | `{/*slug}`          | Optional catch-all route.               |
| `static-path`  | `/static-path`      | Standard static route.                  |

---

## Configuration

Edit `route-maps.config.mjs` to define which parts of your `app` directory should be mapped.

```javascript
export const routeMaps = [
  {
    // Where the resulting JSON will be saved
    outputPath: 'src/next-route-maps/public-routes.json',
    // Folders to scan (relative to project root)
    folderPaths: [
      'src/app/[locale]/(app-presentation)',
      'src/app/[locale]/(auth)',
    ],
    // Manual overrides or routes that don't follow the page.tsx convention
    staticRoutes: ['/', '/healthz'],
  },
];
```

---

## Usage

### 1. Generating the Maps

Add a script to your `package.json` to trigger the generation:

```json
{
  "scripts": {
    "route-maps:generate": "node ./src/next-route-maps/index.mjs generateRouteMaps"
  }
}
```

Run it manually during development when you add new routes:
```bash
npm run route-maps:generate
```

### 2. Using in Proxy

Import the runtime utility and the generated JSON in your proxy:

```typescript
import { checkRouteMap } from './src/next-route-maps/parse-route-maps';
import publicRoutes from './src/next-route-maps/public-routes.json';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if current route is public
  const isPublic = checkRouteMap(pathname, publicRoutes);

  if (!isPublic && !isAuthenticated) {
     // Redirect to login...
  }
}
```

---

## CI/CD & Automation

**Important:** The generated JSON maps are build artifacts. To ensure they never go out of sync with your filesystem:

1. **Build Step:** Always run `npm run route-maps:generate` before (or during) `npm run build`.
2. **Git Hooks:** It is highly recommended to run the generator in a `pre-commit` hook (using `husky` and `lint-staged`) to ensure the JSON files in the repository are always updated.

Example `package.json` build sequence:
```json
{
  "scripts": {
    "build": "npm run route-maps:generate && next build"
  }
}
```

---

## Customization

Since this is a copy-paste utility, you are encouraged to modify it:

- **i18n Support:** If your project uses different locales, update the `LOCALES` array in `parse-route-maps.ts` to properly strip locale prefixes before matching.
- **Filtering:** Modify `containsPageTsx` in `index.mjs` if you want to include API routes (`route.ts`) or other file types.
- **Output Format:** You can change `generateSingleRouteMap` to output TypeScript files instead of JSON if you prefer static types for your maps.
