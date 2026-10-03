// Run with the project's nvmd Node and an installed Playwright module.
// QA engines are isolated; this does not control the user's browser profiles.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const { chromium, firefox, webkit } = await import(
  process.env.CWA_PLAYWRIGHT_MODULE ?? "playwright"
);
const origin = process.env.CWA_MATERIAL_ORIGIN ?? "http://127.0.0.1:4174";
const root = path.resolve(import.meta.dirname, "..");
await mkdir(path.join(root, "reports/screenshots"), { recursive: true });
const results = [];
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch({
    headless: true,
    ...(name === "chromium" && process.env.CWA_CHROMIUM_CHANNEL
      ? { channel: process.env.CWA_CHROMIUM_CHANNEL }
      : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${origin}/design/targets/glass-study.html`);
    const surface = page.locator(".cwa-design-material").first();
    const inspect = () =>
      surface.evaluate((el) => {
        const css = el.ownerDocument.defaultView.getComputedStyle(el);
        return {
          fill: css.backgroundColor,
          text: css.color,
          filter:
            css.getPropertyValue("backdrop-filter") ||
            css.getPropertyValue("-webkit-backdrop-filter"),
          shadow: css.boxShadow,
        };
      });
    const light = await inspect();
    assert.match(light.fill, /^rgba\(/);
    assert.match(light.filter, /blur\(/);
    assert.notEqual(light.shadow, "none");
    await page.screenshot({
      path: path.join(root, `reports/screenshots/material-${name}-light.png`),
    });
    await page.getByRole("button", { name: "切换深色" }).click();
    const dark = await inspect();
    assert.notEqual(dark.fill, light.fill);
    assert.notEqual(dark.text, light.text);
    await surface.evaluate((el) => el.setAttribute("data-cwa-theme", "light"));
    const nestedLight = await inspect();
    assert.equal(nestedLight.fill, light.fill);
    assert.equal(nestedLight.text, light.text);
    await page.getByLabel("强制实色").check();
    const nestedSolid = await inspect();
    assert.equal(nestedSolid.fill, "rgb(255, 255, 255)");
    assert.equal(nestedSolid.filter, "none");
    await surface.evaluate((el) => el.removeAttribute("data-cwa-theme"));
    const solid = await inspect();
    assert.equal(solid.fill, "rgb(44, 44, 46)");
    assert.equal(solid.filter, "none");
    await page.getByLabel("强制实色").uncheck();
    let reducedTransparency = null;
    if (name === "chromium") {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
      });
      reducedTransparency = await inspect();
      assert.equal(reducedTransparency.fill, solid.fill);
      assert.equal(reducedTransparency.filter, "none");
      await cdp.send("Emulation.setEmulatedMedia", { features: [] });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const layout = await page
      .locator("html")
      .evaluate((el) => ({ width: el.scrollWidth, viewport: el.clientWidth }));
    assert.ok(layout.width <= layout.viewport, `${name} mobile overflow`);
    await page.screenshot({
      path: path.join(root, `reports/screenshots/material-${name}-mobile-dark.png`),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    results.push({
      engine: name,
      browserVersion: browser.version(),
      light,
      dark,
      nestedSolid,
      solid,
      reducedTransparency,
      layout,
      pageErrors: errors,
    });
    console.log(`${name}: material, nested theme, solid and mobile checks passed.`);
  } finally {
    await browser.close();
  }
}
await writeFile(
  path.join(root, "reports/optimization/material-browser-results.json"),
  `${JSON.stringify({ date: "2026-10-03", results, limitations: ["Playwright WebKit is not real Safari/iOS", "Chromium alone emulated reduced-transparency", "No manual screen reader or full composite contrast audit"] }, null, 2)}\n`,
);
