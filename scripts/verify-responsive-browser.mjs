import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
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
  channel: process.env.CWA_CHROMIUM_CHANNEL || "chrome",
});
const results = [];
// V01 矩阵：视口 × 根字号。除页面溢出与面板间交叠外，逐个功能控件相对
// overflow 裁切祖先与视口测裁切边界，并对按钮做中心/四角命中测试。
const WIDTHS = [320, 360, 390, 768, 1440];
const FONT_SCALES = [100, 150, 200];
// 首页实验室中的功能元素：容器、输入、全部按钮与状态反馈。
const FUNCTIONAL_SELECTORS = [
  ".glass-control-panel",
  ".glass-music-bar",
  ".glass-playground .cwa-design-input",
  ".glass-playground .cwa-design-segmented",
  ".glass-playground .cwa-design-switch",
  ".glass-playground .cwa-design-slider",
  ".glass-playground .cwa-design-field",
  ".panel-status",
  ".scene-caption",
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
        // 根字号压力：模拟浏览器大字号设置（rem 全站生效）。
        await page.evaluate((scale) => {
          document.documentElement.style.fontSize = `${scale}%`;
        }, fontScale);
        await page.evaluate(() => document.fonts.ready);
        const playground = page.locator(".glass-playground").first();
        await playground.scrollIntoViewIfNeeded();
        const geometry = await page.evaluate((selectors) => {
          const rect = (selector) => {
            const el = document.querySelector(selector);
            if (!el) return null;
            const box = el.getBoundingClientRect();
            return {
              top: box.top,
              bottom: box.bottom,
              left: box.left,
              right: box.right,
              visible: box.height > 0 && box.width > 0,
            };
          };
          const overlapArea = (a, b) => {
            if (!a || !b) return 0;
            const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            return width > 0 && height > 0 ? Math.round(width * height * 100) / 100 : 0;
          };
          // V01 门禁：相对每个 overflow 裁切祖先与视口的裁切边界 + 命中测试。
          const clipsAt = (el) => {
            const cs = getComputedStyle(el);
            return ["hidden", "clip"].some(
              (value) => cs.overflowX === value || cs.overflowY === value,
            );
          };
          const clipAgainst = (element) => {
            const box = element.getBoundingClientRect();
            // 视口只断言水平边界：纵向超出视口属于正常文档滚动可达内容；
            // overflow:hidden 祖先的四边都是真实裁切。
            const bounds = [
              {
                name: "viewport",
                left: 0,
                top: Number.NEGATIVE_INFINITY,
                right: document.documentElement.clientWidth,
                bottom: Number.POSITIVE_INFINITY,
              },
            ];
            for (
              let parent = element.parentElement;
              parent && parent !== document.documentElement;
              parent = parent.parentElement
            ) {
              if (clipsAt(parent)) {
                const parentBox = parent.getBoundingClientRect();
                bounds.push({
                  name: `ancestor:${(parent.className || parent.tagName).toString().slice(0, 60)}`,
                  left: parentBox.left,
                  top: parentBox.top,
                  right: parentBox.right,
                  bottom: parentBox.bottom,
                });
              }
            }
            let worst = { clippedPx: 0, by: "", side: "" };
            for (const bound of bounds) {
              const sides = {
                right: Math.max(0, box.right - bound.right),
                left: Math.max(0, bound.left - box.left),
                bottom: Math.max(0, box.bottom - bound.bottom),
                top: Math.max(0, bound.top - box.top),
              };
              for (const [side, value] of Object.entries(sides)) {
                if (value > worst.clippedPx)
                  worst = { clippedPx: Math.round(value * 100) / 100, by: bound.name, side };
              }
            }
            return worst;
          };
          const hitTest = (element) => {
            const box = element.getBoundingClientRect();
            const points = [
              ["center", box.left + box.width / 2, box.top + box.height / 2],
              ["top-left", box.left + 3, box.top + 3],
              ["top-right", box.right - 3, box.top + 3],
              ["bottom-left", box.left + 3, box.bottom - 3],
              ["bottom-right", box.right - 3, box.bottom - 3],
            ];
            for (const [name, x, y] of points) {
              const hit = document.elementFromPoint(x, y);
              if (!hit || !(hit === element || element.contains(hit) || hit.contains(element)))
                return {
                  hittable: false,
                  point: name,
                  hit: hit ? String(hit.className || hit.tagName).slice(0, 50) : "none",
                };
            }
            return { hittable: true };
          };
          const clipping = [];
          const interactives = [];
          for (const selector of selectors) {
            for (const element of document.querySelectorAll(selector)) {
              const box = element.getBoundingClientRect();
              if (box.width === 0 && box.height === 0) continue;
              const clip = clipAgainst(element);
              clipping.push({
                selector,
                label: (element.getAttribute("aria-label") || element.textContent || "")
                  .trim()
                  .slice(0, 24),
                clip,
              });
              if (element.matches("button, input, [role=slider], [role=switch], [role=radio]")) {
                // 命中测试前滚动到视口内：视口外的点 elementFromPoint 取不到是正常滚动行为。
                element.scrollIntoView({ block: "center", behavior: "instant" });
                const hit = hitTest(element);
                interactives.push({
                  label: (element.getAttribute("aria-label") || element.textContent || "")
                    .trim()
                    .slice(0, 24),
                  ...hit,
                });
              }
            }
          }
          // 焦点可达：Tab 遍历实验室内的可聚焦元素，焦点落点必须完整落在裁切边界内。
          const focusIssues = [];
          const focusables = [
            ...document.querySelectorAll(
              ".glass-playground button:not([disabled]), .glass-playground input:not([disabled]), .glass-playground [role=slider]",
            ),
          ];
          for (const element of focusables) {
            element.focus();
            if (document.activeElement !== element) continue;
            const clip = clipAgainst(element);
            if (clip.clippedPx > 0)
              focusIssues.push({
                label: (element.getAttribute("aria-label") || element.textContent || "")
                  .trim()
                  .slice(0, 24),
                clip,
              });
          }
          const panel = rect(".glass-control-panel");
          const music = rect(".glass-music-bar");
          const status = rect(".panel-status");
          const caption = rect(".hero-visual-caption");
          const viewport = {
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
          };
          return {
            panel,
            music,
            status,
            caption,
            viewport,
            scrollWidth: document.documentElement.scrollWidth,
            overlaps: {
              "music-vs-status": overlapArea(music, status),
              "music-vs-panel": overlapArea(music, panel),
              "music-vs-caption": overlapArea(music, caption),
            },
            clipping,
            unhittable: interactives.filter((item) => !item.hittable),
            focusIssues,
            captionFontSize: caption
              ? getComputedStyle(document.querySelector(".hero-visual-caption")).fontSize
              : null,
          };
        }, FUNCTIONAL_SELECTORS);
        assert(geometry.music && geometry.panel && geometry.status, "playground landmarks render");
        for (const [pair, area] of Object.entries(geometry.overlaps)) {
          assert.equal(
            area,
            0,
            `${pair} overlap at ${width}px/${fontScale}%: ${area}px² — content occlusion`,
          );
        }
        const clippedElements = geometry.clipping.filter((item) => item.clip.clippedPx > 0);
        assert.deepEqual(
          clippedElements,
          [],
          `functional elements clipped at ${width}px/${fontScale}%: ${JSON.stringify(clippedElements)}`,
        );
        assert.deepEqual(
          geometry.unhittable,
          [],
          `interactive elements not hittable at ${width}px/${fontScale}%: ${JSON.stringify(geometry.unhittable)}`,
        );
        assert.deepEqual(
          geometry.focusIssues,
          [],
          `focusable elements clipped at ${width}px/${fontScale}%: ${JSON.stringify(geometry.focusIssues)}`,
        );
        assert(
          geometry.scrollWidth <= geometry.viewport.width + 1,
          `horizontal overflow at ${width}px/${fontScale}%: ${geometry.scrollWidth}`,
        );
        if (geometry.captionFontSize) {
          const size = parseFloat(geometry.captionFontSize);
          assert(
            size >= 11,
            `hero caption ${size}px below the 11px functional minimum at ${width}px`,
          );
        }
        results.push({
          theme,
          width,
          fontScale,
          passed: true,
          overlaps: geometry.overlaps,
          captionFontSize: geometry.captionFontSize,
          scrollWidth: geometry.scrollWidth,
        });
        if (fontScale === 200 && [390, 1440].includes(width)) {
          await playground.screenshot({
            path: path.join(root, `reports/screenshots/playground-${theme}-${width}-font200.png`),
            animations: "disabled",
          });
        }
      }
    }
    // 原有检查保留：常规视口下核心路由无横向溢出 + 截图存档。
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
        if ([375, 1440].includes(width) && ["home", "button", "themes"].includes(name)) {
          await page.screenshot({
            path: path.join(root, `reports/screenshots/${name}-final-${theme}-${width}.png`),
            animations: "disabled",
          });
          if (name === "home") {
            const panel = page.locator(".glass-playground").first();
            await panel.scrollIntoViewIfNeeded();
            await panel.screenshot({
              path: path.join(root, `reports/screenshots/glass-final-${theme}-${width}.png`),
              animations: "disabled",
            });
            if (width === 1440) {
              await page.locator(".material-comparison").scrollIntoViewIfNeeded();
              await page.screenshot({
                path: path.join(root, `reports/screenshots/material-comparison-final-${theme}.png`),
                animations: "disabled",
              });
            }
          }
        }
      }
    }
    // 浏览器缩放检查：整页 zoom 等价于把 CSS 视口按 1/zoom 缩小（内容 CSS 不变），
    // 因此用等价视口跑同一组几何/交叠断言，而不是只断言 scrollWidth。
    for (const [zoom, equivalentWidth] of [
      [1.5, 853],
      [2, 640],
    ]) {
      await page.setViewportSize({ width: equivalentWidth, height: 900 });
      await page.goto(new URL("", base).href);
      await page.waitForFunction(
        (value) => document.documentElement.dataset.cwaTheme === value,
        theme,
      );
      await page.evaluate(() => document.fonts.ready);
      const zoomed = await page.evaluate(() => {
        const rect = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const box = el.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
        };
        const overlapArea = (a, b) => {
          if (!a || !b) return 0;
          const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          return width > 0 && height > 0 ? Math.round(width * height * 100) / 100 : 0;
        };
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overlaps: {
            "music-vs-status": overlapArea(rect(".glass-music-bar"), rect(".panel-status")),
            "music-vs-panel": overlapArea(rect(".glass-music-bar"), rect(".glass-control-panel")),
          },
        };
      });
      assert(
        zoomed.scrollWidth <= zoomed.clientWidth + 1,
        `zoom ${zoom} (viewport ${equivalentWidth}px): horizontal overflow ${JSON.stringify(zoomed)}`,
      );
      for (const [pair, area] of Object.entries(zoomed.overlaps)) {
        assert.equal(area, 0, `zoom ${zoom}: ${pair} overlap ${area}px²`);
      }
      results.push({ theme, zoom, equivalentWidth, passed: true, ...zoomed });
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
        matrix: {
          widths: WIDTHS,
          fontScales: FONT_SCALES,
          themes: ["light", "dark"],
          zooms: [1.5, 2],
        },
        results,
        limitations: [
          "Chromium responsive/font-scale checks; no real iOS or physical touch device.",
          "Root font-size stress (100/150/200%) is not a full WCAG resize-text conformance audit.",
          "Browser zoom is modeled as an equivalent CSS-viewport reduction (150%/200% of a 1280px window), not engine-native zoom rendering.",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Responsive verification: ${results.length} theme/width/font/zoom states passed with zero content overlap.`,
  );
} finally {
  await browser.close();
}
