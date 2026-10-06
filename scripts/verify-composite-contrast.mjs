// V03：完整背景可读性矩阵（2 主题 × 11 背景 × 4 材质）+ Clear 媒体工具栏样张。
// 采样与截图使用同一原点和尺度（CSS 像素；devicePixelRatio 固定 1），
// 每个样本断言包围框在截图内且非空。4.5:1 门槛用未取整比值比较。
// 压力集合与官网实验室同源：apps/docs/src/background-policy.ts。
// CWA_CONTRAST_SELFTEST=1 时运行校验器失败用例（坐标原点/空框）。
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const qaRequire = createRequire(path.join(root, "packages/qa/package.json"));
const { chromium } = process.env.CWA_PLAYWRIGHT_MODULE
  ? await import(process.env.CWA_PLAYWRIGHT_MODULE)
  : qaRequire("playwright");
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
const clearMediaPressure = {
  light: parseArray("clearLightMediaPressure"),
  dark: parseArray("clearDarkMediaPressure"),
};
const MATERIALS = ["glass", "frosted", "glass-clear", "solid"];
const LABEL_SELECTOR =
  ".panel-top strong, .panel-top p, .panel-volume > div > span, .panel-volume output, .cwa-design-switch__label, .cwa-design-field__label, .panel-status, .glass-music-bar strong, .glass-music-bar p";

// Python：逐样本未取整最小比值 + 采样像素数 + 包围框诊断图。
const python = `import json,sys,math
from PIL import Image, ImageDraw
im=Image.open(sys.argv[1]).convert("RGB")
diagnostic=Image.open(sys.argv[1]).convert("RGB")
draw=ImageDraw.Draw(diagnostic)
def lum(rgb):
 c=[v/255 for v in rgb]; c=[v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4 for v in c]
 return .2126*c[0]+.7152*c[1]+.0722*c[2]
out=[]
for idx,item in enumerate(json.load(sys.stdin)):
 x,y,w,h=item["box"]
 inside = x>=0 and y>=0 and x+w<=im.width and y+h<=im.height
 if not inside or w<=0 or h<=0:
  item["error"]="box-outside-image-or-empty"; item["boxInsideImage"]=inside; out.append(item); continue
 foreground=lum(item["rgb"]); ratios=[]
 for py in range(max(0,math.ceil(y)),min(im.height,math.floor(y+h)+1)):
  for px in range(max(0,math.ceil(x)),min(im.width,math.floor(x+w)+1)):
   bg=lum(im.getpixel((px,py))); ratios.append((max(foreground,bg)+.05)/(min(foreground,bg)+.05))
 item["minimumUnrounded"]=min(ratios) if ratios else None
 item["minimumContrast"]=round(min(ratios),3) if ratios else None
 item["sampledPixelCount"]=len(ratios)
 item["boxInsideImage"]=inside
 item["passed"]=bool(ratios) and min(ratios)>=4.5
 colors=["#ff3b30","#ffd60a","#30d158","#409cff","#ff9f0a","#bf5af2","#64d2ff"]
 draw.rectangle([x,y,x+w,y+h], outline=colors[idx%len(colors)], width=1)
 out.append(item)
diag_path=sys.argv[1].replace(".png","-diagnostic.png")
diagnostic.save(diag_path)
print(json.dumps({"samples":out,"diagnostic":diag_path},ensure_ascii=False))`;

/** 等待场景内全部图片真实加载并 decode（不使用固定延时）。 */
async function waitForImages(scene) {
  await scene.evaluate(async (element) => {
    const images = [...element.querySelectorAll("img")];
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete || img.naturalWidth === 0) {
          await new Promise((resolve, reject) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", () => reject(new Error(`image failed: ${img.src}`)), {
              once: true,
            });
          });
        }
        if (img.decode) await img.decode();
      }),
    );
  });
}

/** 采样：隐藏字形 → 截图（与包围框同原点）→ 逐样本校验 → 计算比值 → 恢复。 */
async function sampleScene({ scene, labelSelector, tags }) {
  await waitForImages(scene);
  const measured = await scene.evaluate((element, selector) => {
    const origin = element.getBoundingClientRect();
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
        box: [rect.x - origin.x, rect.y - origin.y, rect.width, rect.height],
      };
      node.dataset.cwaContrastStyle = node.getAttribute("style") || "";
      node.style.color = "transparent";
      node.style.webkitTextFillColor = "transparent";
      node.style.textShadow = "none";
      return item;
    });
  }, labelSelector);
  const shotPath = path.join(temp, `${tags}.png`);
  await scene.screenshot({ path: shotPath, animations: "disabled" });
  const parsed = JSON.parse(
    execFileSync("python3", ["-c", python, shotPath], {
      input: JSON.stringify(measured),
      encoding: "utf8",
    }),
  );
  await scene.evaluate((element) => {
    for (const node of element.querySelectorAll("[data-cwa-contrast-style]")) {
      node.setAttribute("style", node.dataset.cwaContrastStyle);
      delete node.dataset.cwaContrastStyle;
    }
  });
  const invalid = parsed.samples.filter(
    (sample) => sample.error || !sample.boxInsideImage || !sample.sampledPixelCount,
  );
  if (invalid.length)
    throw new Error(
      `invalid sampling in ${tags}: ${JSON.stringify(invalid.slice(0, 3))} — origin/scale mismatch`,
    );
  return { screenshot: shotPath, diagnostic: parsed.diagnostic, samples: parsed.samples };
}

/** 校验器失败用例（CWA_CONTRAST_SELFTEST=1）：脚本必须拒绝错误输入。 */
function selfTest() {
  const makeImage = (width, height, file) =>
    execFileSync("python3", [
      "-c",
      `from PIL import Image; import sys; Image.new("RGB", (${width}, ${height}), "#ffffff").save(sys.argv[1])`,
      file,
    ]);
  const expectError = (name, samples, width, height) => {
    const file = path.join(temp, `selftest-${name}.png`);
    makeImage(width, height, file);
    const parsed = JSON.parse(
      execFileSync("python3", ["-c", python, file], {
        input: JSON.stringify(samples),
        encoding: "utf8",
      }),
    );
    const flagged = parsed.samples.filter((sample) => sample.error || !sample.passed);
    assert(
      flagged.length === samples.length,
      `self-test ${name}: validator must flag all injected bad samples`,
    );
    return { name, flagged: flagged.length };
  };
  const cases = [
    expectError(
      "box-outside-image",
      [{ text: "x", rgb: [0, 0, 0], box: [900, 500, 40, 20] }],
      100,
      100,
    ),
    expectError("empty-box", [{ text: "x", rgb: [0, 0, 0], box: [10, 10, 0, 0] }], 100, 100),
  ];
  console.log(`Contrast self-test: ${cases.length} injected failure cases rejected as expected.`);
  return cases;
}

function clearRecord(theme, background, sampled) {
  const failedSamples = sampled.samples.filter((sample) => !sample.passed);
  // 逐媒体状态与 background-policy.ts 同源：self-drawn 恒为受支持，
  // 真实照片/分区按 clearMediaPressure 分类（V03 重测结论）。
  const mediaKey = background.startsWith("real-media stage: ")
    ? background.replace("real-media stage: ", "")
    : "self-drawn";
  return {
    kind: "clear-toolbar",
    theme,
    material: "glass-clear (supported media toolbar)",
    background,
    pressure: clearMediaPressure[theme].includes(mediaKey),
    sampleCount: sampled.samples.length,
    failedCount: failedSamples.length,
    minimum: Math.min(...sampled.samples.map((sample) => sample.minimumUnrounded)),
    diagnostic: sampled.diagnostic,
    failedSamples: failedSamples.map((sample) => ({
      text: sample.text,
      contrast: sample.minimumUnrounded,
      fontSize: sample.fontSize,
    })),
  };
}

const results = [];
try {
  if (process.env.CWA_CONTRAST_SELFTEST === "1") {
    results.push({ kind: "self-test", cases: selfTest() });
  }
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: theme,
      deviceScaleFactor: 1,
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
        const sampling = await sampleScene({
          scene,
          labelSelector: LABEL_SELECTOR,
          tags: `lab-${theme}-${material}-${background}`,
        });
        const failedSamples = sampling.samples.filter((sample) => !sample.passed);
        const isPressure =
          material === "glass-clear" ||
          (material === "glass" && glassPressure[theme].includes(background));
        results.push({
          kind: "lab",
          theme,
          material,
          background,
          pressure: isPressure,
          sampleCount: sampling.samples.length,
          failedCount: failedSamples.length,
          minimum: Math.min(...sampling.samples.map((sample) => sample.minimumUnrounded)),
          diagnostic: sampling.diagnostic,
          failedSamples: failedSamples.map((sample) => ({
            text: sample.text,
            contrast: sample.minimumUnrounded,
            fontSize: sample.fontSize,
          })),
        });
      }
    }
    // Clear 媒体工具栏：Surface 页自绘示例 + 真实媒体舞台（亮/暗/分区）。
    await page.goto(new URL("components/surface/", base).href);
    for (const stage of await page.locator(".demo-stage").all()) {
      await stage.scrollIntoViewIfNeeded();
    }
    const selfDrawnStage = page.locator(".demo-stage:has(.cwa-design-surface--glass-clear)");
    await selfDrawnStage.waitFor({ timeout: 15000 });
    const selfDrawnSurface = selfDrawnStage.locator(".cwa-design-surface--glass-clear").first();
    await selfDrawnSurface.scrollIntoViewIfNeeded();
    const selfDrawn = await sampleScene({
      scene: selfDrawnSurface,
      labelSelector: "p, span, strong",
      tags: `clear-toolbar-${theme}-self-drawn`,
    });
    results.push(clearRecord(theme, "self-drawn media toolbar (registry example)", selfDrawn));
    const realStage = page.locator("[data-clear-media-stage]");
    await realStage.scrollIntoViewIfNeeded();
    const mediaButtons = {
      "real-bright": "真实亮照片",
      "real-dark": "真实暗照片",
      split: "自绘明暗分区",
    };
    for (const [media, label] of Object.entries(mediaButtons)) {
      await realStage.getByRole("button", { name: label }).click();
      const surface = realStage.locator(".cwa-design-surface--glass-clear");
      await surface.waitFor();
      await surface.scrollIntoViewIfNeeded();
      const sampled = await sampleScene({
        scene: surface,
        labelSelector: "p, span, strong",
        tags: `clear-toolbar-${theme}-${media}`,
      });
      results.push(clearRecord(theme, `real-media stage: ${media}`, sampled));
    }
    await context.close();
  }
  const labScenes = results.filter((scene) => scene.kind === "lab");
  const measurable = results.filter((scene) => scene.kind !== "self-test");
  const supportedFailures = measurable.filter((scene) => !scene.pressure && scene.failedCount > 0);
  const pressureScenes = labScenes.filter((scene) => scene.pressure);
  const pressureFailing = pressureScenes.filter((scene) => scene.failedCount > 0);
  const report = {
    generatedAt: new Date().toISOString(),
    engine: browser.version(),
    devicePixelRatio: 1,
    sampling:
      "bounding-box screening with glyphs hidden; boxes and screenshots share one origin; unrounded ratios",
    matrix: {
      themes: 2,
      backgrounds: 11,
      materials: MATERIALS.length,
      scenes: measurable.length,
      samples: measurable.reduce((sum, scene) => sum + scene.sampleCount, 0),
      threshold: ">= 4.5:1 compared unrounded (WCAG 2.2 AA normal text)",
    },
    supportedScenes: measurable.filter((scene) => !scene.pressure).length,
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
          ? "Clear 全表单为刻意压力负例；正式用法是媒体轻工具栏（见 Clear 工具栏场景）。"
          : "regular 压力背景；安全替代：frosted/solid 或局部实色底面。",
    })),
    limitations: [
      "Backdrop screening only: glyphs are hidden and the minimum ratio over each label's bounding box is measured; not a per-glyph WCAG conformance audit.",
      "Excludes button text, focus rings and control boundaries; axe and manual review cover those separately.",
      "Chromium-only measurement; Firefox/WebKit compositing is not covered by this script.",
      "Clear media toolbar samples cover bright/dark real photos and a split backdrop; not an exhaustive media set.",
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
    `Composite contrast matrix: ${measurable.length} scenes, ${report.matrix.samples} samples (unrounded); supported scenes all pass; ${pressureScenes.length} pressure negatives recorded (${pressureFailing.length} below threshold).`,
  );
} finally {
  await browser.close();
}
