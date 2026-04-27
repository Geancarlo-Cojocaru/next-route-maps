# Next.js Route Maps Utility

This tool is essentially a Node.js tree parser that reads the folder structure into a JSON route map, following Next.js conventions. This utility provides a robust way to generate JSON maps of your Next.js `app` directory routes.

These route maps are primarily intended for use in `proxy.js|ts` (formerly `middleware`) to perform efficient, pattern-based route matching (e.g., for authentication, authorization, or redirects) without the need for manual maintenance of public/private path lists.

## Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [How it Works](#how-it-works)
  - [Route Transformation Rules](#route-transformation-rules)
- [Configuration](#configuration)
- [Usage](#usage)
  - [1. Generating the Maps](#1-generating-the-maps)
  - [2. Using in proxy.ts](#2-using-in-proxyts)
- [CI/CD & Automation](#cicd--automation)
- [Customization](#customization)
- [License](#license)

---

## Overview

In Next.js, managing complex route access can be error-prone when done manually. `next-route-maps` automates this by:
1. Scanning your `app` directory for `page.tsx` files.
2. Handling Route Groups (e.g., `(auth)`, `(app-presentation)`).
3. Transforming Next.js dynamic routes (`[slug]`, `[...catchAll]`) into standard `path-to-regexp` patterns.
4. Outputting a JSON array that can be imported and matched at runtime.

---

## Installation & Setup

Copy the utility into your project using one of the following methods:

**Default path (`src/next-route-maps`):**

```bash
git clone --depth 1 https://github.com/Geancarlo-Cojocaru/next-route-maps.git src/next-route-maps && rm -rf src/next-route-maps/.git
```

**Custom path:**

```bash
git clone --depth 1 https://github.com/Geancarlo-Cojocaru/next-route-maps.git your/custom/path && rm -rf your/custom/path/.git
```

### Dependencies

Ensure your project has `path-to-regexp` installed:

```bash
npm install -D path-to-regexp
```

### File Structure

After copying, the utility files will be in your chosen directory (e.g., `src/next-route-maps`):

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
    // Example of where the resulting JSON will be saved
    outputPath: 'src/next-route-maps/public-routes.json',
    // Example of folders to scan (relative to project root)
    folderPaths: [
      'src/app/[locale]/(app-presentation)',
      'src/app/[locale]/(auth)',
      'src/app/[locale]/products',
    ],
    // Example for root or single pages
    staticRoutes: ['/', '/some-static-page'],
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

### 2. Using in `proxy.ts`

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

### 3. Example Output

#### Sample Directory Structure

If your `app` directory looks like this:

```text
src/app/[locale]/
├── page.tsx                # => /
├── (app-presentation)/
│   ├── about/
│   │   └── page.tsx        # => /about
│   └── contact/
│       └── page.tsx        # => /contact
├── (auth)/
│   ├── signin/
│   │   └── page.tsx        # => /signin
│   └── forgot-password/
│       └── page.tsx        # => /forgot-password
├── (auth-required)/
│   ├── dashboard/
│   │   └── page.tsx        # => /dashboard
│   └── settings/
│       └── page.tsx        # => /settings
└── products/
    ├── [slug]/
    │   └── page.tsx        # => /products/:slug
    └── categories/
        └── [[...filter]]/
            └── page.tsx    # => /products/categories{/*filter}
```

#### Configuration Example

Define your public routes in `route-maps.config.mjs`:

```javascript
export const routeMaps = [
  {
    outputPath: 'src/next-route-maps/public-routes.json',
    folderPaths: [
      'src/app/[locale]/(app-presentation)',
      'src/app/[locale]/(auth)',
      'src/app/[locale]/products',
    ],
    staticRoutes: ['/'],
  },
];
```

#### Generated JSON Map

The generator will output a simple array of strings where each string is a `path-to-regexp` pattern.

**Public Routes Map:**

```json
[
  "/",
  "/about",
  "/contact",
  "/signin",
  "/forgot-password",
  "/products/:slug",
  "/products/categories{/*filter}"
]
```

**Private Routes Map:**
*(If you were to scan `(auth-required)` folders)*

```json
[
  "/dashboard",
  "/settings"
]
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

---

## License

MIT
