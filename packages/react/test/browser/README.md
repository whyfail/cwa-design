# Component interaction fixture

This source fixture exercises Sheet and recipes independently of the docs app. It is not included in the package exports or production build.

From the repository root, start its Vite server:

```sh
rtk proxy env NVMD_NODE_VERSION=24.21.0 corepack pnpm exec vite --config packages/react/test/browser/vite.config.ts --host 127.0.0.1 --port 4182 --strictPort
```

Run `verify-sheet.mjs` using an available Playwright installation. `CWA_PLAYWRIGHT_MODULE` can point to its absolute `index.mjs`; `CWA_CHROMIUM_CHANNEL=chrome` uses installed Chrome. Firefox and WebKit need their Playwright browser runtimes. No dependency is added to the component package.

```sh
rtk proxy env NVMD_NODE_VERSION=24.21.0 CWA_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs CWA_CHROMIUM_CHANNEL=chrome node packages/react/test/browser/verify-sheet.mjs
```

The script writes `results.json`, including actual browser versions, measured panel positions and errors. Checks cover grip dragging, correct-axis reset, RTL, synthetic pointer cancellation, scroll separation, reduced motion, keyboard/focus recovery, scope inheritance, narrow layouts and local recipe feedback. WebKit results do not establish real Safari/iOS touch behavior.
