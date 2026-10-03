import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const { chromium } = await import(process.env.CWA_PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(import.meta.dirname, "..");
const base = process.env.CWA_DOCS_URL || "http://127.0.0.1:4173/cwa-design/";
await mkdir(path.join(root, "reports/screenshots"), { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.CWA_CHROMIUM_CHANNEL || "chrome" });
const results = [];
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ colorScheme: theme });
    await context.addInitScript((value) => localStorage.setItem("cwa-theme", value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width === 375 ? 844 : 1000 });
      for (const [name, route] of Object.entries({ home: "", components: "components/", button: "components/button/", themes: "themes/", patterns: "patterns/" })) {
        const response = await page.goto(new URL(route, base).href);
        assert.equal(response.status(), 200);
        await page.waitForFunction((value) => document.documentElement.dataset.cwaTheme === value, theme);
        await page.evaluate(() => document.fonts.ready);
        const layout = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
        assert(layout.width <= layout.viewport, `${name} ${theme} ${width} overflow`);
        results.push({ name, route, theme, width, layout, passed: true });
        if ([375, 1440].includes(width) && ["home", "button", "themes"].includes(name)) {
          await page.screenshot({ path: path.join(root, `reports/screenshots/${name}-final-${theme}-${width}.png`), animations: "disabled" });
          if (name === "home") {
            const panel = page.locator(".glass-playground").first();
            await panel.scrollIntoViewIfNeeded();
            await panel.screenshot({ path: path.join(root, `reports/screenshots/glass-final-${theme}-${width}.png`), animations: "disabled" });
            if (width === 1440) {
              await page.locator(".material-comparison").scrollIntoViewIfNeeded();
              await page.screenshot({ path: path.join(root, `reports/screenshots/material-comparison-final-${theme}.png`), animations: "disabled" });
            }
          }
        }
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await writeFile(path.join(root, "reports/optimization/responsive-browser-results.json"), JSON.stringify({ generatedAt: new Date().toISOString(), browserVersion: browser.version(), results, limitations: ["Chromium responsive layout checks; no real iOS or physical touch device.", "Viewport screenshots avoid Chromium full-page backdrop-filter tiling artifacts."] }, null, 2) + "\n");
  console.log(`Responsive verification: ${results.length} page/theme/width states passed.`);
} finally { await browser.close(); }
