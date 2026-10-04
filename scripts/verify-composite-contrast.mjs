// N03/N06：完整背景可读性矩阵。2 主题 × 11 背景 × 4 材质 = 88 场景，
// 每场景 9 个文字样本（隐藏字形后按包围框采样背景，阈值 4.5:1）。
// 正式支持的组合必须全部达标；压力负例逐场景记录实测最低比值，
// 不允许通过换有利底图或删样本隐藏。压力集合与官网实验室同源：
// apps/docs/src/background-policy.ts。
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const { chromium } = await import(process.env.CWA_PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(import.meta.dirname, "..");
const base = process.env.CWA_DOCS_URL || "http://127.0.0.1:4173/cwa-design/";
const temp = await mkdtemp(path.join(os.tmpdir(), "cwa-contrast-"));
const browser = await chromium.launch({
  headless: true,
  channel: process.env.CWA_CHROMIUM_CHANNEL || "chrome",
});
const policySource = await readFile(path.join(root, "apps/docs/src/background-policy.ts"), "utf8");
const parseArray = (name) => {
  const match = new RegExp(`${name}\\s*=\\s*\\[([^\\]]*)\\]`).exec(policySource);
  assert(match, `background-policy.ts must define ${name}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
};
const glassPressure = {
  light: parseArray("glassLightPressure"),
  dark: parseArray("glassDarkPressure"),
};
const MATERIALS = ["glass", "frosted", "glass-clear", "solid"];
const LABEL_SELECTOR =
  ".panel-top strong, .panel-top p, .panel-volume > div > span, .panel-volume output, .cwa-design-switch__label, .cwa-design-field__label, .panel-status, .glass-music-bar strong, .glass-music-bar p";
const python = `import json,sys,math
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB')
def lum(rgb):
 c=[v/255 for v in rgb]; c=[v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4 for v in c]
 return .2126*c[0]+.7152*c[1]+.0722*c[2]
out=[]
for item in json.load(sys.stdin):
 x,y,w,h=item['box']; foreground=lum(item['rgb']); ratios=[]
 for py in range(max(0,math.ceil(y)+1),min(im.height,math.floor(y+h)-1)):
  for px in range(max(0,math.ceil(x)+1),min(im.width,math.floor(x+w)-1)):
   bg=lum(im.getpixel((px,py))); ratios.append((max(foreground,bg)+.05)/(min(foreground,bg)+.05))
 item['minimumContrast']=round(min(ratios),3) if ratios else None; item['passed']=item['minimumContrast'] is not None and min(ratios)>=4.5; out.append(item)
print(json.dumps(out,ensure_ascii=False))`;
const results = [];
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: theme,
    });
    await context.addInitScript((value) => localStorage.setItem("cwa-theme", value), theme);
    const page = await context.newPage();
    await page.goto(new URL("themes/", base).href);
    await page.waitForFunction(
      (value) => document.documentElement.dataset.cwaTheme === value,
      theme,
    );
    const controls = page.locator(".theme-controls");
    const materialSelect = controls.getByRole("combobox", { name: /^材质/ });
    const backgroundSelect = controls.getByRole("combobox", { name: /^背景/ });
    const options = await backgroundSelect
      .locator("option")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("value")));
    assert.equal(options.length, 11, "11 backgrounds available in the lab");
    for (const material of MATERIALS) {
      await materialSelect.selectOption(material);
      for (const background of options) {
        await backgroundSelect.selectOption(background);
        const scene = page.locator(".glass-playground");
        await scene.waitFor({ timeout: 15000 });
        await scene.scrollIntoViewIfNeeded();
        await page.waitForTimeout(120);
        const labels = await scene.evaluate((element, selector) => {
          const box = element.getBoundingClientRect();
          return [...element.querySelectorAll(selector)].map((node) => {
            const rect = node.getBoundingClientRect();
            const css = getComputedStyle(node);
            const item = {
              text: node.textContent.trim(),
              rgb: css.color
                .match(/[\d.]+/g)
                .slice(0, 3)
                .map(Number),
              fontSize: css.fontSize,
              box: [rect.x - box.x, rect.y - box.y, rect.width, rect.height],
            };
            node.dataset.cwaContrastStyle = node.getAttribute("style") || "";
            node.style.color = "transparent";
            node.style.webkitTextFillColor = "transparent";
            node.style.textShadow = "none";
            return item;
          });
        }, LABEL_SELECTOR);
        assert.equal(
          labels.length,
          9,
          `9 label samples per scene: ${theme}/${material}/${background}`,
        );
        const file = path.join(temp, `${theme}-${material}-${background}.png`);
        await scene.screenshot({ path: file, animations: "disabled" });
        const samples = JSON.parse(
          execFileSync("python3", ["-c", python, file], {
            input: JSON.stringify(labels),
            encoding: "utf8",
          }),
        );
        await scene.evaluate((element) => {
          for (const node of element.querySelectorAll("[data-cwa-contrast-style]")) {
            node.setAttribute("style", node.dataset.cwaContrastStyle);
            delete node.dataset.cwaContrastStyle;
          }
        });
        const failedSamples = samples.filter((sample) => !sample.passed);
        const isPressure =
          material === "glass-clear" ||
          (material === "glass" && glassPressure[theme].includes(background));
        results.push({
          theme,
          material,
          background,
          pressure: isPressure,
          sampleCount: samples.length,
          failedCount: failedSamples.length,
          minimum: Math.min(...samples.map((sample) => sample.minimumContrast)),
          failedSamples: failedSamples.map((sample) => ({
            text: sample.text,
            contrast: sample.minimumContrast,
            fontSize: sample.fontSize,
          })),
        });
      }
    }
    // 受支持的 Clear 用法：Surface 页的媒体工具栏样张（浅色配亮媒体 / 深色配暗媒体）。
    await page.goto(new URL("components/surface/", base).href);
    for (const stage of await page.locator(".demo-stage").all()) {
      await stage.scrollIntoViewIfNeeded();
    }
    const clearStage = page.locator(".demo-stage:has(.cwa-design-surface--glass-clear)");
    await clearStage.waitFor({ timeout: 15000 });
    await clearStage.scrollIntoViewIfNeeded();
    const clearLabels = await clearStage.evaluate((element) => {
      const scene = element.querySelector(".cwa-design-surface--glass-clear");
      const box = scene.getBoundingClientRect();
      return [...scene.querySelectorAll("p, span, strong")].map((node) => {
        const rect = node.getBoundingClientRect();
        const css = getComputedStyle(node);
        const item = {
          text: node.textContent.trim(),
          rgb: css.color
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number),
          fontSize: css.fontSize,
          box: [rect.x - box.x, rect.y - box.y, rect.width, rect.height],
        };
        node.dataset.cwaContrastStyle = node.getAttribute("style") || "";
        node.style.color = "transparent";
        node.style.webkitTextFillColor = "transparent";
        node.style.textShadow = "none";
        return item;
      });
    });
    const clearFile = path.join(temp, `${theme}-clear-toolbar.png`);
    await clearStage.screenshot({ path: clearFile, animations: "disabled" });
    const clearSamples = JSON.parse(
      execFileSync("python3", ["-c", python, clearFile], {
        input: JSON.stringify(clearLabels),
        encoding: "utf8",
      }),
    );
    await clearStage.evaluate((element) => {
      for (const node of element.querySelectorAll("[data-cwa-contrast-style]")) {
        node.setAttribute("style", node.dataset.cwaContrastStyle);
        delete node.dataset.cwaContrastStyle;
      }
    });
    results.push({
      theme,
      material: "glass-clear (supported media toolbar)",
      background: "self-drawn media toolbar sample",
      pressure: false,
      sampleCount: clearSamples.length,
      failedCount: clearSamples.filter((sample) => !sample.passed).length,
      minimum: Math.min(...clearSamples.map((sample) => sample.minimumContrast)),
      failedSamples: clearSamples.filter((sample) => !sample.passed),
    });
    await context.close();
  }
  const labScenes = results.filter((scene) => !scene.background.includes("toolbar"));
  const supportedFailures = results.filter((scene) => !scene.pressure && scene.failedCount > 0);
  const pressureScenes = labScenes.filter((scene) => scene.pressure);
  const pressureFailing = pressureScenes.filter((scene) => scene.failedCount > 0);
  const report = {
    generatedAt: new Date().toISOString(),
    engine: browser.version(),
    matrix: {
      themes: 2,
      backgrounds: 11,
      materials: MATERIALS.length,
      scenes: results.length,
      samples: results.reduce((sum, scene) => sum + scene.sampleCount, 0),
      threshold: "4.5:1 (WCAG 2.2 AA normal text, unrounded comparison)",
    },
    supportedScenes: results.filter((scene) => !scene.pressure).length,
    pressureScenes: pressureScenes.length,
    pressureFailingScenes: pressureFailing.length,
    scenes: results,
    pressureDetails: pressureScenes.map((scene) => ({
      theme: scene.theme,
      material: scene.material,
      background: scene.background,
      minimum: scene.minimum,
      failedCount: scene.failedCount,
      guidance:
        scene.material === "glass-clear"
          ? "Clear 全表单为刻意压力负例；正式用法是媒体轻工具栏（见受支持样张场景）。"
          : "regular 副文字压力背景；正文与控件标签仍达标。安全替代：frosted/solid 或局部实色底面。",
    })),
    limitations: [
      "Backdrop screening only: glyphs are hidden and the minimum ratio over each label's bounding box is measured; not a per-glyph WCAG conformance audit.",
      "Excludes button text, focus rings and control boundaries; axe and manual review cover those separately.",
      "Chromium-only measurement; Firefox/WebKit compositing is not covered by this script.",
    ],
  };
  await writeFile(
    path.join(root, "reports/optimization/composite-contrast-results.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  if (supportedFailures.length) {
    console.error(
      "Supported scenes below 4.5:1:",
      JSON.stringify(
        supportedFailures.map(({ theme, material, background, failedSamples }) => ({
          theme,
          material,
          background,
          failedSamples,
        })),
        null,
        1,
      ),
    );
    throw new Error(`${supportedFailures.length} supported scenes failed the 4.5:1 screening`);
  }
  console.log(
    `Composite contrast matrix: ${results.length} scenes, ${report.matrix.samples} samples; supported scenes all pass; ${pressureScenes.length} pressure negatives recorded (${pressureFailing.length} currently below threshold).`,
  );
} finally {
  await browser.close();
}
