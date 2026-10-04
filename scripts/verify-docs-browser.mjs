/* global window, document, getComputedStyle, KeyboardEvent, fetch, localStorage */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const playwright = await import(process.env.CWA_PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(import.meta.dirname, "..");
const base = process.env.CWA_DOCS_URL || "http://127.0.0.1:4173/cwa-design/";
const qaDirectory = (
  await readFile(
    process.env.CWA_AXE_DIRECTORY_FILE || "/tmp/cwa-design-qa-current-path.txt",
    "utf8",
  )
).trim();
const axePath = path.join(qaDirectory, "node_modules/axe-core/axe.min.js");
const axeVersion = JSON.parse(
  await readFile(path.join(qaDirectory, "node_modules/axe-core/package.json"), "utf8"),
).version;
const release = await fetch(new URL("release.json", base)).then((response) => {
  assert(response.ok, "release.json must be served");
  return response.json();
});
const routes = await fetch(new URL("routes.json", base)).then((response) => {
  assert(response.ok, "routes.json must be served");
  return response.json();
});
const components = routes.filter((route) => route.kind === "component");
assert.equal(components.length, 30, "30 component routes required");
const htmlFingerprint = async () =>
  `sha256:${createHash("sha256")
    .update(await fetch(base).then((response) => response.text()))
    .digest("hex")}`;
const buildFingerprint = await htmlFingerprint();
const results = {
  status: "in-progress",
  generatedAt: new Date().toISOString(),
  base,
  release,
  buildFingerprint,
  axeVersion,
  browsers: [],
  limitations: [
    "Playwright WebKit is not real Safari or iOS touch hardware.",
    "Automated axe checks do not establish screen-reader usability or contrast over every composited glass background.",
    "Downloads and local example actions are tested without calling external business/model services.",
  ],
};
const outputPath = path.join(root, "reports/optimization/docs-browser-results.json");
async function persist() {
  await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
}
const engines = (process.env.CWA_DOCS_ENGINES || "chromium,firefox,webkit").split(",");

for (const engine of engines) {
  assert(["chromium", "firefox", "webkit"].includes(engine), "known browser engine");
  const browser = await playwright[engine].launch({
    headless: true,
    ...(engine === "chromium" && process.env.CWA_CHROMIUM_CHANNEL
      ? { channel: process.env.CWA_CHROMIUM_CHANNEL }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    acceptDownloads: true,
  });
  await context.addInitScript(() => {
    try {
      if (!localStorage.getItem("cwa-theme")) localStorage.setItem("cwa-theme", "light");
    } catch {
      /* A blocked storage still permits in-memory theme changes. */
    }
  });
  const page = await context.newPage();
  const record = {
    engine,
    version: browser.version(),
    scenarios: [],
    axe: [],
    pageErrors: [],
    httpErrors: [],
    failures: [],
  };
  results.browsers.push(record);
  page.on("pageerror", (error) =>
    record.pageErrors.push({ url: page.url(), message: error.message }),
  );
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      response.url().startsWith(base) &&
      !response.url().includes("__qa_missing__/")
    )
      record.httpErrors.push({ url: response.url(), status: response.status() });
  });
  async function scenario(name, callback) {
    try {
      const details = await callback();
      record.scenarios.push({ name, passed: true, ...(details ? { details } : {}) });
    } catch (error) {
      record.scenarios.push({ name, passed: false });
      record.failures.push({ name, url: page.url(), message: error.stack });
      console.log(`${engine}: FAIL ${name}: ${error.message}`);
    }
    await persist();
  }
  async function goto(route = "") {
    const response = await page.goto(new URL(route.replace(/^\//, ""), base).href, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(response.status(), 200, `route must serve real HTML: ${route}`);
    await page.locator("html[data-cwa-theme]").waitFor();
    assert.equal(await page.locator("h1").count(), 1, "one page heading");
    assert.equal(await page.locator("#cwa-page-data").count(), 1, "SSG page data");
    assert.equal(await page.locator("main").count(), 1, "one main landmark");
  }
  async function layout() {
    const data = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      width: document.documentElement.scrollWidth,
    }));
    assert(data.width <= data.viewport + 1, `horizontal overflow: ${JSON.stringify(data)}`);
    return data;
  }
  async function duplicateIds() {
    const duplicates = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll("[id]"), (element) => element.id);
      return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    });
    assert.deepEqual(duplicates, [], "duplicate DOM ids");
  }
  async function setTheme(value) {
    const current = await page.locator("html").getAttribute("data-cwa-theme");
    if (current !== value) await page.getByRole("button", { name: "切换网站主题" }).click();
    await page.waitForFunction(
      (expected) => document.documentElement.dataset.cwaTheme === expected,
      value,
    );
  }
  async function axe(name) {
    // Audit settled UI: entering opacity changes contrast while a modal is still materializing.
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll("[role=dialog], [role=menu], [role=listbox]"))
        .filter((el) => el.getClientRects().length && !el.hasAttribute("data-ending-style"))
        .every(
          (el) =>
            Number(getComputedStyle(el).opacity) >= 0.999 &&
            !el.hasAttribute("data-starting-style"),
        ),
    );
    await page.addScriptTag({ path: axePath });
    const scanned = await page.evaluate(async () => {
      const result = await window.axe.run(document);
      const simplify = (item) => ({
        id: item.id,
        impact: item.impact,
        description: item.description,
        helpUrl: item.helpUrl,
        nodes: item.nodes.map((node) => ({
          target: node.target,
          html: node.html.slice(0, 600),
          failureSummary: node.failureSummary,
        })),
      });
      return {
        violations: result.violations.map(simplify),
        incomplete: result.incomplete.map(simplify),
        passes: result.passes.length,
      };
    });
    const severe = scanned.violations.filter((item) =>
      ["serious", "critical"].includes(item.impact),
    );
    record.axe.push({ name, url: page.url(), ...scanned, severeCount: severe.length });
    if (severe.length)
      console.log(
        `${engine}: AXE ${name}: ${severe.map((item) => `${item.id}(${item.nodes.length})`).join(", ")}`,
      );
    await persist();
    return severe.length;
  }
  async function loadExamples() {
    const stages = page.locator(".demo-stage");
    assert((await stages.count()) >= 1, "each component needs a real demo stage");
    for (const stage of await stages.all()) {
      await stage.scrollIntoViewIfNeeded();
      await stage.locator(".demo-loading").waitFor({ state: "hidden", timeout: 10_000 });
      // Alert is itself a component demo; only a direct fallback paragraph indicates a load error.
      assert.equal(
        await stage.locator(":scope > p[role=alert]").count(),
        0,
        "no demo runtime/load error",
      );
      assert(
        (await stage.locator(":scope > *").count()) >= 1,
        "loaded module renders real children",
      );
    }
    await duplicateIds();
    return await stages.count();
  }
  try {
    await scenario("home-light-interactions", async () => {
      await goto();
      await setTheme("light");
      const initial = await page.locator(".glass-control-panel").evaluate((el) => ({
        fill: getComputedStyle(el).backgroundColor,
        filter: getComputedStyle(el).backdropFilter,
      }));
      assert(initial.filter.includes("blur("), "hero uses real glass sampling");
      await page.getByLabel("工作区名称").fill("QA workspace");
      await page.getByRole("button", { name: /^保存偏好/ }).click();
      assert(await page.getByText("偏好已保存到本次演示").isVisible());
      await page.getByRole("button", { name: "开始演示" }).click();
      assert.equal(
        await page.getByRole("button", { name: "暂停演示" }).getAttribute("aria-pressed"),
        "true",
      );
      await page.getByLabel("对比实色材质").check();
      assert.equal(
        await page
          .locator(".glass-control-panel")
          .evaluate((el) => getComputedStyle(el).backdropFilter),
        "none",
      );
      await page.getByLabel("对比实色材质").uncheck();
      await duplicateIds();
      const dimensions = await layout();
      await axe("home-light");
      return { ...dimensions, material: initial };
    });
    await scenario("home-dark-persistence", async () => {
      await goto();
      await setTheme("dark");
      const dark = await page.locator(".glass-control-panel").evaluate((el) => ({
        fill: getComputedStyle(el).backgroundColor,
        text: getComputedStyle(el).color,
      }));
      assert.match(dark.fill, /rgba\(28, 29, 34,/);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.documentElement.dataset.cwaTheme === "dark");
      await axe("home-dark");
      return dark;
    });
    await scenario("mobile-home-navigation", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await goto();
      await setTheme("light");
      const trigger = page.getByRole("button", { name: "打开移动导航" });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "浏览 CWA Design" });
      await dialog.waitFor({ state: "visible" });
      assert(await dialog.getByRole("navigation", { name: "移动导航" }).isVisible());
      await axe("mobile-navigation-open");
      const focusGuards = await dialog.evaluate((el) =>
        Array.from(
          el
            .closest(".cwa-design-portal-scope")
            .querySelectorAll('[data-base-ui-focus-guard][role="button"]'),
          (guard) => ({
            role: guard.getAttribute("role"),
            tabIndex: guard.getAttribute("tabindex"),
            label: guard.getAttribute("aria-label"),
          }),
        ),
      );
      if (engine === "webkit") {
        assert(focusGuards.length >= 2, "WebKit retains Base UI VoiceOver focus guards");
        assert(
          focusGuards.every((guard) => guard.label?.trim() && guard.tabIndex === "0"),
          "VoiceOver guards have names without losing focus behavior",
        );
      }
      await page.getByRole("button", { name: "关闭移动导航" }).click();
      await dialog.waitFor({ state: "hidden" });
      assert(
        await trigger.evaluate((el) => el === document.activeElement),
        "menu closes to its trigger",
      );
      await trigger.click();
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await axe("mobile-home-light");
      const light = await layout();
      await setTheme("dark");
      await axe("mobile-home-dark");
      const dark = await layout();
      return { light, dark, focusGuards };
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const route of components) {
      await scenario(`component-${route.id}-demo`, async () => {
        await goto(route.path);
        await setTheme("light");
        const demos = await loadExamples();
        assert((await page.locator("#api table").count()) >= 1, "component API table rendered");
        await axe(`component-${route.id}`);
        return { demos, ...(await layout()) };
      });
    }
    await scenario("example-source-copy", async () => {
      await goto("components/button/");
      await loadExamples();
      if (engine === "chromium")
        await context.grantPermissions(["clipboard-read", "clipboard-write"], {
          origin: new URL(base).origin,
        });
      const demo = page.locator(".demo-card").first();
      await demo.getByText("查看与复制源码", { exact: true }).click();
      const code = demo.locator(".demo-source .code-block");
      const expected = await code.locator("pre code").textContent();
      await code.getByRole("button", { name: "复制", exact: true }).click();
      await page.waitForFunction(() =>
        /已复制|请选择源码后复制/.test(
          document.querySelector(".demo-source .code-toolbar button").textContent,
        ),
      );
      const feedback = await code.locator(".code-toolbar button").textContent();
      if (engine === "chromium")
        assert.equal(
          await page.evaluate(() => window.navigator.clipboard.readText()),
          expected,
          "copied code equals the manifest's rendered source",
        );
      return {
        feedback,
        sourceLength: expected.length,
        clipboardContentVerified: engine === "chromium",
      };
    });
    await scenario("search-alias-keyboard-empty-state", async () => {
      await goto("search/?q=按钮");
      const search = page.getByRole("combobox", { name: "搜索组件和文档" });
      await search.waitFor();
      await page.waitForFunction(() => document.querySelector("[role=combobox]").value === "按钮");
      assert(await page.getByRole("option", { name: /Button 按钮/ }).isVisible());
      await search.fill("CWA_QA_NO_RESULT_76D982");
      assert(await page.getByText("没有找到相关内容").isVisible());
      assert.equal(await page.getByRole("option").count(), 0);
      await page.getByRole("button", { name: "清除搜索", exact: true }).first().click();
      assert((await page.getByRole("option").count()) > 0);
      await search.fill("弹窗");
      assert(await page.getByRole("option", { name: /Dialog 对话框/ }).isVisible());
      const urlBeforeIme = page.url();
      await search.evaluate((el) =>
        el.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true }),
        ),
      );
      assert.equal(page.url(), urlBeforeIme, "IME composition must not navigate");
      await axe("search-page");
      await page.keyboard.press("Control+k");
      const dialog = page.getByRole("dialog", { name: "搜索文档", exact: true });
      await dialog.waitFor({ state: "visible" });
      await duplicateIds();
      const dialogSearch = dialog.getByRole("combobox", { name: "搜索组件和文档" });
      await dialogSearch.fill("按钮");
      const first = await dialogSearch.getAttribute("aria-activedescendant");
      await dialogSearch.press("ArrowDown");
      const second = await dialogSearch.getAttribute("aria-activedescendant");
      if ((await dialog.getByRole("option").count()) > 1) assert.notEqual(second, first);
      await dialogSearch.press("ArrowUp");
      await axe("search-dialog-open");
      await dialogSearch.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await search.fill("按钮");
      await search.press("Enter");
      await page.waitForURL(new URL("components/button/", base).href);
    });
    await scenario("theme-lab-material-background-export", async () => {
      await goto("themes/");
      await setTheme("light");
      async function downloadTheme() {
        const downloadEvent = page.waitForEvent("download");
        await page.getByRole("button", { name: /导出当前配置 JSON/ }).click();
        const download = await downloadEvent;
        assert.equal(download.suggestedFilename(), "cwa-design-theme.json");
        assert.equal(await download.failure(), null);
        const stream = await download.createReadStream();
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return JSON.parse(Buffer.concat(chunks).toString());
      }
      async function verifyExport(config, theme) {
        const liveTokens = await page.locator(".glass-control-panel").evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            fill: style.getPropertyValue("--cwa-design-color-glass-regular-fill").trim(),
            onAccent: style.getPropertyValue("--cwa-design-color-on-accent").trim(),
          };
        });
        const normalize = (value) => value.replace(/\s+/g, "").replace(/^#fff$/, "#ffffff");
        assert.equal(config.provider.theme, theme, "export specifies the preview theme");
        // 默认继承主题 Token：未显式调整时导出不应包含覆盖项。
        const exportedFill = config.cssTokens["--cwa-design-color-glass-regular-fill"];
        if (exportedFill === undefined) {
          assert.match(
            liveTokens.fill,
            theme === "dark" ? /^rgba\(28, 29, 34,/ : /^rgba\(255, 255, 255,/,
            "unadjusted preview inherits the theme fill token",
          );
        } else {
          assert.equal(
            normalize(exportedFill),
            normalize(liveTokens.fill),
            "export fill matches the composited preview token",
          );
        }
        const exportedOnAccent = config.cssTokens["--cwa-design-color-on-accent"];
        if (exportedOnAccent !== undefined) {
          assert.equal(
            normalize(exportedOnAccent),
            normalize(liveTokens.onAccent),
            "export foreground matches the preview accent-button text",
          );
        }
        return liveTokens;
      }
      const controls = page.locator(".theme-controls");
      const material = controls.getByRole("combobox", { name: /^材质/ });
      const background = controls.getByRole("combobox", { name: /^背景/ });
      const accent = controls.getByRole("combobox", { name: /^主色/ });
      const defaultConfig = await downloadTheme();
      assert.deepEqual(
        defaultConfig.cssTokens,
        {},
        "unadjusted lab exports no overrides and previews theme tokens",
      );
      const lightTokens = await page.locator(".glass-control-panel").evaluate((el) => ({
        fill: getComputedStyle(el).getPropertyValue("--cwa-design-color-glass-regular-fill").trim(),
      }));
      // 构建器可能把 rgba() 压缩为 8 位 hex，两种写法都接受。
      assert.match(
        lightTokens.fill.replace(/\s+/g, ""),
        /^(#ffffff85|rgba\(255,255,255,0?\.52\))$/,
        "unadjusted light preview inherits the 52% theme fill",
      );
      await material.selectOption("frosted");
      assert(
        await page
          .locator(".glass-control-panel")
          .evaluate((el) => el.classList.contains("cwa-design-surface--frosted")),
      );
      await material.selectOption("glass-clear");
      assert(
        await page
          .locator(".glass-control-panel")
          .evaluate((el) => el.classList.contains("cwa-design-surface--glass-clear")),
      );
      await background.selectOption("checker");
      assert(await page.locator(".glass-playground--checker").isVisible());
      await background.selectOption("split");
      assert(await page.locator(".glass-playground--split").isVisible());
      await accent.selectOption("#087a6a");
      await page.locator(".theme-range input").fill("70");
      const config = await downloadTheme();
      assert.equal(config.surface.material, "glass-clear");
      assert.equal(config.cssTokens["--cwa-design-color-accent"], "#087a6a");
      assert.equal(
        config.cssTokens["--cwa-design-color-glass-regular-fill"],
        "rgba(255,255,255,0.7)",
      );
      await verifyExport(config, "light");
      await page.getByLabel("显式实色降级").check();
      assert.equal(
        await page
          .locator(".glass-control-panel")
          .evaluate((el) => getComputedStyle(el).backdropFilter),
        "none",
      );
      await page.getByRole("button", { name: "重置", exact: true }).click();
      assert.equal(await material.inputValue(), "glass");
      assert.equal(await background.inputValue(), "landscape");
      assert.equal(await accent.inputValue(), "", "accent resets to inherit-theme default");
      assert.equal(await page.getByLabel("显式实色降级").isChecked(), false);
      await axe("theme-lab-light");
      await setTheme("dark");
      await page.waitForFunction(() => {
        const raw = getComputedStyle(document.querySelector(".glass-control-panel"))
          .getPropertyValue("--cwa-design-color-glass-regular-fill")
          .replace(/\s+/g, "");
        const hex = raw.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
        if (hex)
          return (
            parseInt(hex[1].slice(0, 2), 16) === 28 &&
            parseInt(hex[1].slice(2, 4), 16) === 29 &&
            parseInt(hex[1].slice(4, 6), 16) === 34
          );
        return raw.startsWith("rgba(28,29,34,");
      });
      const darkConfig = await downloadTheme();
      assert.deepEqual(
        darkConfig.cssTokens,
        {},
        "reset lab exports no overrides; preview uses theme tokens",
      );
      const darkTokens = await page.locator(".glass-control-panel").evaluate((el) => ({
        onAccent: getComputedStyle(el).getPropertyValue("--cwa-design-color-on-accent").trim(),
      }));
      assert.equal(darkTokens.onAccent, "#061c34", "dark accent text follows the theme token");
      await axe("theme-lab-dark");
      await page.setViewportSize({ width: 390, height: 844 });
      await axe("theme-lab-mobile-dark");
      const mobile = await layout();
      await page.setViewportSize({ width: 1440, height: 1000 });
      return {
        exportedConfig: config,
        lightTokens,
        darkExportedConfig: darkConfig,
        darkTokens,
        mobile,
      };
    });
    await scenario("theme-lab-explicit-override-consistency", async () => {
      // N01 回归：深色 68 → 67 → 68 的显式覆盖必须使用主题石墨底色，
      // 预览、CSS/TSX 代码与 JSON 导出三处一致（旧缺陷：预览用旧蓝灰 24,31,45）。
      await goto("themes/");
      await setTheme("dark");
      const controls = page.locator(".theme-controls");
      const slider = controls.locator(".theme-range input");
      const previewFill = () =>
        page.locator(".glass-control-panel").evaluate((el) => {
          // normalizeToken 需要在浏览器上下文内定义（evaluate 回调无法引用 Node 作用域）。
          const raw = getComputedStyle(el)
            .getPropertyValue("--cwa-design-color-glass-regular-fill")
            .trim()
            .replace(/\s+/g, "");
          const hex = raw.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
          if (hex)
            return `rgba(${parseInt(hex[1].slice(0, 2), 16)},${parseInt(hex[1].slice(2, 4), 16)},${parseInt(hex[1].slice(4, 6), 16)},${hex[2] ? Math.round((parseInt(hex[2], 16) / 255) * 100) / 100 : 1})`;
          return raw;
        });
      const cssBlock = page.locator(".code-block").nth(1).locator("pre code");
      const tsxBlock = page.locator(".code-block").first().locator("pre code");
      async function downloadConfig() {
        const downloadEvent = page.waitForEvent("download");
        await page.getByRole("button", { name: /导出当前配置 JSON/ }).click();
        const download = await downloadEvent;
        const stream = await download.createReadStream();
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return JSON.parse(Buffer.concat(chunks).toString());
      }
      assert.equal(
        await previewFill(),
        "rgba(28,29,34,0.68)",
        "dark default inherits graphite 68%",
      );
      await slider.fill("67");
      assert.equal(
        await previewFill(),
        "rgba(28,29,34,0.67)",
        "explicit 67% uses the graphite base, not legacy blue-gray",
      );
      assert.match(
        (await cssBlock.textContent()).replace(/\s+/g, ""),
        /\.my-cwa-theme\{--cwa-design-color-glass-regular-fill:rgba\(28,29,34,0\.67\);\}/,
        "CSS export matches the preview override",
      );
      const config67 = await downloadConfig();
      assert.equal(
        config67.cssTokens["--cwa-design-color-glass-regular-fill"],
        "rgba(28,29,34,0.67)",
      );
      assert.match(
        (await tsxBlock.textContent()).replace(/\s+/g, ""),
        /className="my-cwa-theme"/,
        "TSX wires the my-cwa-theme scope for the exported CSS",
      );
      await slider.fill("68");
      assert.equal(
        await previewFill(),
        "rgba(28,29,34,0.68)",
        "68 → 67 → 68 returns to the theme value",
      );
      const config68 = await downloadConfig();
      assert.equal(
        config68.cssTokens["--cwa-design-color-glass-regular-fill"],
        "rgba(28,29,34,0.68)",
      );
      // 浅色主题同规则：显式覆盖用白色底。
      await setTheme("light");
      await slider.fill("60");
      assert.equal(await previewFill(), "rgba(255,255,255,0.6)");
      assert.match((await cssBlock.textContent()).replace(/\s+/g, ""), /rgba\(255,255,255,0\.6\)/);
      await page.getByRole("button", { name: "重置", exact: true }).click();
      assert.equal(
        await previewFill(),
        "rgba(255,255,255,0.52)",
        "reset returns to the light theme default",
      );
      assert.match(await cssBlock.textContent(), /无覆盖/, "reset clears the exported overrides");
      // solid 切换时预览仍是 glass Token 导出（Provider 属性在 TSX 中体现）。
      await page.getByLabel("显式实色降级").check();
      const solidConfig = await downloadConfig();
      assert.equal(solidConfig.provider.material, "solid");
      assert.match(await tsxBlock.textContent(), /material="solid"/);
      await page.getByRole("button", { name: "重置", exact: true }).click();
      await axe("theme-lab-override-consistency");
      return {
        dark67: config67.cssTokens,
        dark68: config68.cssTokens,
        solid: solidConfig.provider,
      };
    });
    await scenario("heading-text-cascade-isolation", async () => {
      // N02 回归：组件排版（Heading level × visualSize、Text as × variant × tone）
      // 在官网文档祖先内与祖先外的计算样式必须一致（site 排版规则零特异性）。
      await goto("components/heading/");
      await setTheme("light");
      await loadExamples();
      const matrix = await page.evaluate(() => {
        // 段落规则是 .site-doc-main 内的 section 后代，因此文档侧克隆挂在真实 section 里。
        const docsHost =
          document.querySelector(".site-doc-main section") ??
          document.querySelector(".site-doc-main");
        const isolatedHost = document.createElement("div");
        isolatedHost.style.cssText =
          "position:absolute;width:900px;height:12px;overflow:hidden;opacity:0;pointer-events:none";
        document.body.appendChild(isolatedHost);
        const cases = [];
        for (const cls of [
          "cwa-design-heading--display",
          "cwa-design-heading--title",
          "cwa-design-heading--body",
        ])
          for (const tag of ["h1", "h2", "h3", "h4"]) cases.push({ kind: "heading", cls, tag });
        for (const variant of ["body", "caption"])
          for (const tone of ["default", "muted"])
            for (const tag of ["p", "span"]) cases.push({ kind: "text", variant, tone, tag });
        const props = [
          "fontSize",
          "lineHeight",
          "marginTop",
          "marginBottom",
          "color",
          "letterSpacing",
          "fontWeight",
        ];
        const results = [];
        for (const item of cases) {
          const mount = (parent) => {
            const el = document.createElement(item.tag);
            if (item.kind === "heading") {
              el.className = `cwa-design-heading ${item.cls}`;
              el.textContent = "层级样例";
            } else {
              el.className = `cwa-design-text cwa-design-text--${item.variant} cwa-design-text--${item.tone}`;
              el.textContent = "正文样例";
            }
            parent.appendChild(el);
            return el;
          };
          const inDocs = mount(docsHost.appendChild(document.createElement("div")));
          const isolated = mount(isolatedHost.appendChild(document.createElement("div")));
          const one = getComputedStyle(inDocs);
          const two = getComputedStyle(isolated);
          const diffs = props
            .filter((prop) => one[prop] !== two[prop])
            .map((prop) => `${prop}: ${one[prop]} != ${two[prop]}`);
          results.push({
            ...item,
            equal: diffs.length === 0,
            diffs,
            inDocs: Object.fromEntries(props.map((prop) => [prop, one[prop]])),
          });
          inDocs.parentElement.remove();
          isolated.parentElement.remove();
        }
        isolatedHost.remove();
        return results;
      });
      const mismatches = matrix.filter((row) => !row.equal);
      assert.deepEqual(
        mismatches,
        [],
        `component typography must not depend on the docs ancestor: ${JSON.stringify(mismatches.slice(0, 3))}`,
      );
      const display = matrix.find(
        (row) =>
          row.kind === "heading" && row.cls === "cwa-design-heading--display" && row.tag === "h2",
      );
      assert.equal(
        display.inDocs.fontSize,
        "28px",
        "Heading display keeps the component size inside docs",
      );
      assert.equal(
        display.inDocs.marginTop,
        "0px",
        "Heading display keeps the component margin inside docs",
      );
      const bodyText = matrix.find(
        (row) =>
          row.kind === "text" &&
          row.variant === "body" &&
          row.tone === "default" &&
          row.tag === "p",
      );
      assert.equal(
        bodyText.inDocs.fontSize,
        "16px",
        "Text body keeps the component size inside docs",
      );
      assert.equal(
        matrix.length,
        20,
        "explicit scenario coverage: 3 heading sizes × 4 levels + 2 variants × 2 tones × 2 elements",
      );
      await axe("heading-cascade-isolation");
      return {
        cases: matrix.length,
        sample: { display: display.inDocs, bodyText: bodyText.inDocs },
      };
    });
    await scenario("overlay-stage-real-media", async () => {
      // N07：浮层材质对照舞台使用真实照片，图片必须实际加载并切换。
      await goto("components/popover/");
      await loadExamples();
      const stage = page.locator(".overlay-stage");
      await stage.scrollIntoViewIfNeeded();
      const image = stage.locator("img.overlay-stage-media");
      await image.waitFor();
      await page.waitForFunction(
        (element) => element.complete && element.naturalWidth > 1000,
        await image.elementHandle(),
      );
      assert(
        await stage.getByRole("button", { name: "真实暗照片" }).isVisible(),
        "stage media picker offers real dark photo",
      );
      await stage.getByRole("button", { name: "真实暗照片" }).click();
      const darkImage = stage.locator("img.overlay-stage-media");
      await page.waitForFunction(
        (element) => element.src.includes("photo-real-dark"),
        await darkImage.elementHandle(),
      );
      await stage.getByRole("button", { name: "自绘明暗分区" }).click();
      assert(await stage.locator(".overlay-stage-media--split").isVisible());
      // 每个浮层组件页都有舞台实例。
      for (const id of ["dropdown-menu", "select", "dialog", "sheet"]) {
        await goto(`components/${id}/`);
        assert(
          (await page.locator(`.overlay-stage[data-overlay-stage=${id}]`).count()) === 1,
          `${id} has its own media stage`,
        );
      }
      return { popoverStage: true, mediaSwitch: ["real-dark", "split"] };
    });
    await scenario("dialog-real-open-close-focus", async () => {
      await goto("components/dialog/");
      await loadExamples();
      const trigger = page.locator(".demo-stage").getByRole("button", { name: "新建工作区" });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "新建工作区" });
      await dialog.waitFor({ state: "visible" });
      await axe("dialog-example-open");
      await dialog.getByRole("button", { name: "取消" }).click();
      await dialog.waitFor({ state: "hidden" });
      assert(await trigger.evaluate((el) => el === document.activeElement));
    });
    await scenario("select-real-keyboard-choice", async () => {
      await goto("components/select/");
      await loadExamples();
      const trigger = page.locator(".demo-stage").getByRole("combobox", { name: "工作区" });
      await trigger.press("ArrowDown");
      await page.getByRole("option", { name: "研发团队" }).waitFor({ state: "visible" });
      await axe("select-example-open");
      await page.keyboard.press("End");
      await page.keyboard.press("Enter");
      assert(await trigger.textContent().then((value) => value.includes("研发团队")));
      await page.waitForFunction(
        () => document.activeElement === document.querySelector('.demo-stage [role="combobox"]'),
      );
      assert(await trigger.evaluate((el) => el === document.activeElement));
    });
    await scenario("menu-real-action-disabled", async () => {
      await goto("components/dropdown-menu/");
      await loadExamples();
      await page.locator(".demo-stage").getByRole("button", { name: "项目操作" }).click();
      const menu = page.getByRole("menu");
      await menu.waitFor({ state: "visible" });
      assert.equal(
        await menu.getByRole("menuitem", { name: "删除（无权限）" }).getAttribute("aria-disabled"),
        "true",
      );
      await axe("menu-example-open");
      await menu.getByRole("menuitem", { name: "复制链接" }).click();
      assert(await page.locator(".demo-stage").getByText("已复制链接").isVisible());
    });
    await scenario("sheet-real-mobile-grip-close", async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await goto("components/sheet/");
      await loadExamples();
      const trigger = page.locator(".demo-stage").getByRole("button", { name: "查看详细信息" });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "工作区详情" });
      await dialog.waitFor({ state: "visible" });
      await axe("sheet-example-open-mobile");
      const box = await dialog
        .getByRole("button", { name: "关闭面板；拖动也可关闭" })
        .boundingBox();
      assert(box.width >= 44 && box.height >= 44);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert(await trigger.evaluate((el) => el === document.activeElement));
      await layout();
      await page.setViewportSize({ width: 1440, height: 1000 });
    });
    for (const route of ["docs/getting-started/", "ai/mcp/", "resources/", "patterns/"]) {
      await scenario(`support-page-${route}`, async () => {
        await goto(route);
        await setTheme("light");
        await duplicateIds();
        await axe(route);
        await page.setViewportSize({ width: 390, height: 844 });
        const mobile = await layout();
        await page.setViewportSize({ width: 1440, height: 1000 });
        return mobile;
      });
    }
    const latestRelease = await fetch(new URL("release.json", base)).then((response) =>
      response.json(),
    );
    assert.deepEqual(latestRelease, release, "build identity changed during browser verification");
    assert.equal(
      await htmlFingerprint(),
      buildFingerprint,
      "rendered build/assets changed during browser verification",
    );
    record.severeAxeCount = record.axe.reduce((sum, item) => sum + item.severeCount, 0);
    record.passed =
      record.failures.length === 0 &&
      record.pageErrors.length === 0 &&
      record.httpErrors.length === 0 &&
      record.severeAxeCount === 0;
    if (!record.passed) process.exitCode = 1;
  } catch (error) {
    record.failures.push({ name: "engine-or-build-stability", message: error.stack });
    record.passed = false;
    process.exitCode = 1;
  } finally {
    await persist();
    console.log(
      `${engine}: ${record.scenarios.filter((item) => item.passed).length}/${record.scenarios.length} scenarios; serious/critical axe=${record.severeAxeCount ?? "incomplete"}; pageErrors=${record.pageErrors.length}`,
    );
    await browser.close();
  }
}
results.completedAt = new Date().toISOString();
results.status = "complete";
await persist();
console.log(
  JSON.stringify(
    results.browsers.map(
      ({ engine, version, passed, severeAxeCount, failures, pageErrors, httpErrors }) => ({
        engine,
        version,
        passed,
        severeAxeCount,
        failures: failures.length,
        pageErrors: pageErrors.length,
        httpErrors: httpErrors.length,
      }),
    ),
    null,
    2,
  ),
);
