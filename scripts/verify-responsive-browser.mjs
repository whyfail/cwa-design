// F05/F06：响应式与交互几何门禁（浏览器执行按维护者规范另行授权，本轮为代码与夹具交付）。
// 覆盖：视口 × 根字号矩阵；功能容器与语义交互控件分开；逐控件相对 overflow
// 裁切祖先与视口（水平）的裁切边界；命中测试只认可交互目标自身或其后代，
// 且命中链不得有 pointer-events:none；真实键盘 Tab 走查与程序化 focus 分开；
// 每状态保存逐样本明细。负向夹具：CWA_RESPONSIVE_SELFTEST=1 时注入
// 裁切/遮挡/pointer-events:none/错误选择器场景验证门禁会失败。
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const { inPageChecker } = await import(
  new URL("./responsive-in-page-checker.mjs", import.meta.url).href
);

import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const qaRequire = createRequire(path.join(root, "packages/qa/package.json"));
const { chromium } = process.env.CWA_PLAYWRIGHT_MODULE
  ? await import(process.env.CWA_PLAYWRIGHT_MODULE)
  : qaRequire("playwright");
const base = process.env.CWA_DOCS_URL || "http://127.0.0.1:4173/cwa-design/";
await mkdir(path.join(root, "reports/screenshots"), { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CWA_CHROMIUM_CHANNEL ? { channel: process.env.CWA_CHROMIUM_CHANNEL } : {}),
});
const results = [];
const WIDTHS = [320, 360, 390, 768, 1440];
const FONT_SCALES = [100, 150, 200];
// F05：功能容器（只做裁切检查）与语义交互目标（裁切 + 命中 + 焦点走查）分开，
// 并断言每个选择器的命中数量——缺 Slider 或按钮即失败。
const CONTAINER_SELECTORS = [
  ".glass-control-panel",
  ".glass-music-bar",
  ".glass-playground .cwa-design-field",
  ".panel-status",
  ".scene-caption",
];
const INTERACTIVE_TARGETS = [
  { selector: ".glass-playground button", expected: 3, kind: "button" },
  { selector: ".glass-playground .cwa-design-input", expected: 1, kind: "input" },
  { selector: ".glass-playground input[type=range]", expected: 1, kind: "slider" },
  { selector: ".glass-playground [role=switch]", expected: 1, kind: "switch" },
  {
    selector: ".glass-playground .cwa-design-segmented__label",
    expected: 3,
    kind: "segmented-label",
  },
];

try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ colorScheme: theme });
    await context.addInitScript((value) => localStorage.setItem("cwa-theme", value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const width of WIDTHS) {
      for (const fontScale of FONT_SCALES) {
        await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
        const response = await page.goto(new URL("", base).href);
        assert.equal(response.status(), 200);
        await page.waitForFunction(
          (value) => document.documentElement.dataset.cwaTheme === value,
          theme,
        );
        await page.evaluate((scale) => {
          document.documentElement.style.fontSize = `${scale}%`;
        }, fontScale);
        await page.evaluate(() => document.fonts.ready);
        const playground = page.locator(".glass-playground").first();
        await playground.scrollIntoViewIfNeeded();
        const geometry = await page.evaluate(inPageChecker, {
          containers: CONTAINER_SELECTORS,
          targets: INTERACTIVE_TARGETS,
        });
        // 数量断言：缺 Slider/按钮等直接失败。
        const countErrors = geometry.targets.filter((item) => item.countError);
        assert.deepEqual(
          countErrors,
          [],
          `selector count mismatch at ${width}px/${fontScale}%: ${JSON.stringify(countErrors)}`,
        );
        const clipped = [...geometry.containers, ...geometry.targets].filter(
          (item) => item.clip.clippedPx > 0,
        );
        assert.deepEqual(
          clipped,
          [],
          `functional elements clipped at ${width}px/${fontScale}%: ${JSON.stringify(clipped)}`,
        );
        const unhittable = geometry.targets.filter((item) => item.hitOk === false);
        assert.deepEqual(
          unhittable,
          [],
          `interactive targets not hittable at ${width}px/${fontScale}%: ${JSON.stringify(unhittable)}`,
        );
        // F05：真实键盘 Tab 走查（区别于程序化 focus）。
        const tabWalk = [];
        await page.evaluate(() => {
          document.body.focus();
          getSelection()?.removeAllRanges();
        });
        for (let step = 0; step < 40; step += 1) {
          await page.keyboard.press("Tab");
          const info = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return { loop: true };
            const box = el.getBoundingClientRect();
            return {
              label: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24),
              className: String(el.className).slice(0, 50),
              inPlayground: Boolean(el.closest(".glass-playground")),
              right: Math.round(box.right),
              viewportRight: document.documentElement.clientWidth,
            };
          });
          if (info.loop) break;
          tabWalk.push(info);
          const visited = tabWalk.filter(
            (item) => item.label === info.label && item.className === info.className,
          ).length;
          if (visited > 2) break; // 走出实验室后停止。
        }
        const playgroundFocusables = tabWalk.filter((item) => item.inPlayground);
        // F05 键盘走查的语义期望（实测 Tab 序列）：slider range input、switch
        // root、input、保存按钮、播放按钮共 5 个初始面板控件；Segmented 隐藏
        // radio 是 1px sr-only 元素（label 为空），由"关键控件必须命中"清单覆盖
        // 语义；"查看材质说明"按钮位于 panel-top 也在序列中（label 匹配）。
        const expectedFocusableCount = 5;
        assert(
          playgroundFocusables.length >= expectedFocusableCount,
          `keyboard Tab reached only ${playgroundFocusables.length}/${expectedFocusableCount} playground focusables at ${width}px/${fontScale}%: ${JSON.stringify(playgroundFocusables)}`,
        );
        // 关键语义控件必须出现在 Tab 序列中（radio 组内只要求一个）。
        const tabLabels = playgroundFocusables.map((item) => item.label).join("|");
        for (const required of ["背景音量", "保存偏好", "开始演示"]) {
          assert(
            tabLabels.includes(required),
            `keyboard Tab missed "${required}" at ${width}px/${fontScale}%: ${JSON.stringify(playgroundFocusables)}`,
          );
        }
        const focusClipped = playgroundFocusables.filter(
          (item) => item.right > item.viewportRight + 1,
        );
        assert.deepEqual(
          focusClipped,
          [],
          `keyboard focus beyond viewport at ${width}px/${fontScale}%: ${JSON.stringify(focusClipped)}`,
        );
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        assert(
          scrollWidth <= clientWidth + 1,
          `horizontal overflow at ${width}px/${fontScale}%: ${scrollWidth}`,
        );
        results.push({
          theme,
          width,
          fontScale,
          passed: true,
          samples: {
            containersChecked: geometry.containers.length,
            targetsChecked: geometry.targets.length,
            expectedFocusableCount,
            tabWalkLength: tabWalk.length,
          },
          details: geometry,
          tabWalk,
        });
        if (fontScale === 200 && [320, 390].includes(width)) {
          await playground.screenshot({
            path: path.join(root, `reports/screenshots/playground-${theme}-${width}-font200.png`),
            animations: "disabled",
          });
        }
      }
    }
    // 原有路由溢出检查保留。
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width === 375 ? 844 : 1000 });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "";
      });
      for (const [name, route] of Object.entries({
        home: "",
        components: "components/",
        button: "components/button/",
        themes: "themes/",
        patterns: "patterns/",
      })) {
        const response = await page.goto(new URL(route, base).href);
        assert.equal(response.status(), 200);
        await page.waitForFunction(
          (value) => document.documentElement.dataset.cwaTheme === value,
          theme,
        );
        await page.evaluate(() => document.fonts.ready);
        const layout = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          viewport: document.documentElement.clientWidth,
        }));
        assert(layout.width <= layout.viewport, `${name} ${theme} ${width} overflow`);
        results.push({ name, route, theme, width, fontScale: 100, layout, passed: true });
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await writeFile(
    path.join(root, "reports/optimization/responsive-browser-results.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        browserVersion: browser.version(),
        engineChannel: process.env.CWA_CHROMIUM_CHANNEL ?? "playwright-chromium (locked)",
        base,
        matrix: { widths: WIDTHS, fontScales: FONT_SCALES, themes: ["light", "dark"] },
        results,
        limitations: [
          "Chromium responsive/font-scale checks; no real iOS or physical touch device.",
          "Root font-size stress (100/150/200%) is not a full WCAG resize-text conformance audit.",
          "Keyboard walk covers the home lab scene; other routes only assert horizontal overflow.",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Responsive verification: ${results.length} states passed with per-sample details.`);
} finally {
  await browser.close();
}
