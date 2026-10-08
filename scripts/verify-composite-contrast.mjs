// F03/F06：完整背景可读性矩阵（2 主题 × 11 背景 × 4 材质）+ Clear 媒体工具栏样张。
// 采样与截图使用同一原点和尺度（CSS 像素；devicePixelRatio 固定 1）。
// 样本分类（F03）：普通文字 4.5:1；带实色底面的装饰/图标按其有效字形区域的
// 内缩包围框采样（避免圆角容器空角），非文本门槛 3:1；零样本/空框/越界/图片
// 加载失败一律失败。4.5:1 门槛用未取整比值比较。
// 压力集合与官网实验室同源：apps/docs/src/background-policy.ts。
// CWA_CONTRAST_SELFTEST=1 时运行校验器负向夹具（零样本/空框/越界框）。
// 默认引擎为 packages/qa 锁定的 Playwright Chromium；显式 CWA_CHROMIUM_CHANNEL
// 才使用系统浏览器（并在报告中记录 channel）。
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const qaRequire = createRequire(path.join(root, "packages/qa/package.json"));
const { chromium } = process.env.CWA_PLAYWRIGHT_MODULE
  ? await import(process.env.CWA_PLAYWRIGHT_MODULE)
  : qaRequire("playwright");
const base = process.env.CWA_DOCS_URL || "http://127.0.0.1:4173/cwa-design/";
const temp = await mkdtemp(path.join(os.tmpdir(), "cwa-contrast-"));
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
const browser = isMain
  ? await chromium.launch({
      headless: true,
      ...(process.env.CWA_CHROMIUM_CHANNEL ? { channel: process.env.CWA_CHROMIUM_CHANNEL } : {}),
    })
  : null;
const engineLabel = browser
  ? `${browser.version()}${process.env.CWA_CHROMIUM_CHANNEL ? ` (${process.env.CWA_CHROMIUM_CHANNEL})` : " (playwright)"}`
  : "not-launched (imported for validation)";
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

// Python：逐样本未取整最小比值 + 采样像素数 + 包围框诊断图（含内缩区域框）。
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
 if item.get("insetRatio"):
  dx=w*item["insetRatio"]; dy=h*item["insetRatio"]; x,y,w,h=x+dx,y+dy,w-2*dx,h-2*dy
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
 threshold=3.0 if item.get("sampleType") in ("decorative-glyph-on-solid-tile","necessary-icon") else 4.5
 item["threshold"]=threshold
 item["passed"]=bool(ratios) and min(ratios)>=threshold
 colors=["#ff3b30","#ffd60a","#30d158","#409cff","#ff9f0a","#bf5af2","#64d2ff"]
 draw.rectangle([x,y,x+w,y+h], outline=colors[idx%len(colors)], width=1)
 out.append(item)
diag_path=sys.argv[1].replace(".png","-diagnostic.png")
diagnostic.save(diag_path)
print(json.dumps({"samples":out,"diagnostic":diag_path},ensure_ascii=False))`;

/**
 * F03：样本集合校验（纯函数，供采样与负向夹具共用）。
 * 断言：样本数等于预期、每框在截图内且非空、未取整最小值有限。
 */
export function validateSamples(samples, { expectedCount, imageWidth, imageHeight, tags }) {
  if (!Array.isArray(samples) || samples.length !== expectedCount)
    throw new Error(
      `invalid sampling in ${tags}: expected ${expectedCount} samples, got ${samples?.length ?? 0} — empty selector or markup drift`,
    );
  for (const sample of samples) {
    if (sample.error || !sample.boxInsideImage)
      throw new Error(
        `invalid sampling in ${tags}: ${JSON.stringify(sample)} — origin/scale mismatch`,
      );
    const [x, y, w, h] = sample.box;
    if (!(x >= 0 && y >= 0 && x + w <= imageWidth && y + h <= imageHeight))
      throw new Error(`box outside image in ${tags}: ${JSON.stringify(sample.box)}`);
    if (
      !sample.sampledPixelCount ||
      sample.minimumUnrounded === null ||
      !Number.isFinite(sample.minimumUnrounded)
    )
      throw new Error(`empty sample in ${tags}: ${JSON.stringify(sample)}`);
  }
  return true;
}

/**
 * F03：等待共同媒体 canvas 中的全部图片完成 load + decode。
 * 截图元素（Surface）与媒体 img 是兄弟关系，必须以共同祖先为等待范围；
 * 加载失败立即报错，等待有上限。
 */
async function waitForImages(waitScope, timeoutMs = 15000) {
  await waitScope.evaluate(async (element) => {
    const images = [...element.querySelectorAll("img")];
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete || img.naturalWidth === 0) {
          await Promise.race([
            new Promise((resolve, reject) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", () => reject(new Error(`image failed: ${img.src}`)), {
                once: true,
              });
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`image load timeout: ${img.src}`)), 15000),
            ),
          ]);
        }
        if (img.decode) await img.decode();
      }),
    );
  });
  void timeoutMs;
}

/**
 * 采样：隐藏字形 → 截图（与包围框同原点）→ 逐样本校验（含预期数量）→ 恢复。
 * sampleGroups：[{ selector, sampleType, insetRatio?, thresholdNote }]。
 */
async function sampleScene({ scene, waitScope, sampleGroups, tags }) {
  await waitForImages(waitScope ?? scene);
  const measured = await scene.evaluate((element, groups) => {
    const origin = element.getBoundingClientRect();
    const items = [];
    for (const group of groups) {
      for (const node of element.querySelectorAll(group.selector)) {
        const rect = node.getBoundingClientRect();
        const css = getComputedStyle(node);
        items.push({
          text: node.textContent.trim(),
          sampleType: group.sampleType,
          insetRatio: group.insetRatio ?? null,
          rgb: css.color
            .match(/[\d.]+/g)
            .slice(0, 3)
            .map(Number),
          fontSize: css.fontSize,
          box: [rect.x - origin.x, rect.y - origin.y, rect.width, rect.height],
        });
        node.dataset.cwaContrastStyle = node.getAttribute("style") || "";
        node.style.color = "transparent";
        node.style.webkitTextFillColor = "transparent";
        node.style.textShadow = "none";
      }
    }
    return items;
  }, sampleGroups);
  const shotPath = path.join(temp, `${tags}.png`);
  const shot = await scene.screenshot({ path: shotPath, animations: "disabled" });
  const parsed = JSON.parse(
    execFileSync("python3", ["-c", python, shotPath], {
      input: JSON.stringify(measured),
      encoding: "utf8",
    }),
  );
  // F03：尺寸与数量在 js 校验（python 输出含诊断路径）。
  const size = JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        `from PIL import Image;import json,sys;im=Image.open(sys.argv[1]);print(json.dumps(im.size))`,
        shotPath,
      ],
      { encoding: "utf8" },
    ),
  );
  validateSamples(parsed.samples, {
    expectedCount: measured.length,
    imageWidth: size[0],
    imageHeight: size[1],
    tags,
  });
  await scene.evaluate((element) => {
    for (const node of element.querySelectorAll("[data-cwa-contrast-style]")) {
      node.setAttribute("style", node.dataset.cwaContrastStyle);
      delete node.dataset.cwaContrastStyle;
    }
  });
  return {
    screenshot: shotPath,
    diagnostic: parsed.diagnostic,
    samples: parsed.samples,
    screenshotBytes: shot.byteLength,
  };
}

/** 负向夹具（CWA_CONTRAST_SELFTEST=1）：校验器必须拒绝错误输入。 */
function selfTest() {
  const makeImage = (width, height, file) =>
    execFileSync("python3", [
      "-c",
      `from PIL import Image; import sys; Image.new("RGB", (${width}, ${height}), "#ffffff").save(sys.argv[1])`,
      file,
    ]);
  const runPython = (samples, file) =>
    JSON.parse(
      execFileSync("python3", ["-c", python, file], {
        input: JSON.stringify(samples),
        encoding: "utf8",
      }),
    );
  const expectValidatorError = (name, samples, width, height, expectedCount) => {
    const file = path.join(temp, `selftest-${name}.png`);
    makeImage(width, height, file);
    const parsed = runPython(samples, file);
    expectThrows(
      () =>
        validateSamples(parsed.samples, {
          expectedCount,
          imageWidth: width,
          imageHeight: height,
          tags: name,
        }),
      name,
    );
    return { name, flagged: true };
  };
  const expectThrows = (fn, name) => {
    try {
      fn();
    } catch {
      return;
    }
    throw new Error(`self-test ${name}: validator accepted invalid input`);
  };
  const cases = [
    // F03：零样本（空选择器/markup 漂移）必须失败，不能静默通过。
    expectValidatorError("zero-samples", [], 100, 100, 9),
    // 圆角容器空角：整框采样会混入透明角——由内缩采样规避；此处验证越界/空框仍被拒绝。
    expectValidatorError(
      "box-outside-image",
      [{ text: "x", rgb: [0, 0, 0], box: [900, 500, 40, 20], sampleType: "text" }],
      100,
      100,
      1,
    ),
    expectValidatorError(
      "empty-box",
      [{ text: "x", rgb: [0, 0, 0], box: [10, 10, 0, 0], sampleType: "text" }],
      100,
      100,
      1,
    ),
  ];
  console.log(`Contrast self-test: ${cases.length} injected failure cases rejected as expected.`);
  return cases;
}

function clearRecord(theme, background, sampled, mediaKey) {
  const failedSamples = sampled.samples.filter((sample) => !sample.passed);
  return {
    kind: "clear-toolbar",
    theme,
    material: "glass-clear (media toolbar, classified samples)",
    background,
    pressure: clearMediaPressure[theme].includes(mediaKey),
    sampleCount: sampled.samples.length,
    failedCount: failedSamples.length,
    minimum: Math.min(...sampled.samples.map((sample) => sample.minimumUnrounded)),
    diagnostic: sampled.diagnostic,
    failedSamples: failedSamples.map((sample) => ({
      text: sample.text,
      sampleType: sample.sampleType,
      contrast: sample.minimumUnrounded,
      threshold: sample.threshold,
      fontSize: sample.fontSize,
    })),
  };
}

const LAB_LABEL_GROUPS = [{ selector: LABEL_SELECTOR, sampleType: "text" }];

function buildLabGroups() {
  return LAB_LABEL_GROUPS;
}

async function runMatrix() {
  if (!browser) throw new Error("browser not launched (imported module)");
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
            sampleGroups: buildLabGroups(),
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
      // Clear 媒体工具栏：截图 Surface，等待共同媒体 canvas（stage 兄弟 img）。
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
        waitScope: selfDrawnStage,
        sampleGroups: [
          { selector: "p, strong", sampleType: "text" },
          {
            selector: ".clear-media-toolbar__glyph, [data-cwa-decorative-glyph]",
            sampleType: "decorative-glyph-on-solid-tile",
            insetRatio: 0.3,
          },
          { selector: "button", sampleType: "necessary-icon" },
        ],
        tags: `clear-toolbar-${theme}-self-drawn`,
      });
      results.push(
        clearRecord(theme, "self-drawn media toolbar (registry example)", selfDrawn, "self-drawn"),
      );
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
          waitScope: realStage,
          sampleGroups: [
            { selector: "p, strong", sampleType: "text" },
            {
              selector: ".clear-media-toolbar__glyph, [data-cwa-decorative-glyph]",
              sampleType: "decorative-glyph-on-solid-tile",
              insetRatio: 0.3,
            },
            { selector: "button", sampleType: "necessary-icon" },
          ],
          tags: `clear-toolbar-${theme}-${media}`,
        });
        results.push(clearRecord(theme, `real-media stage: ${media}`, sampled, media));
      }
      await context.close();
    }
    const labScenes = results.filter((scene) => scene.kind === "lab");
    const clearScenes = results.filter((scene) => scene.kind === "clear-toolbar");
    const measurable = results.filter((scene) => scene.kind !== "self-test");
    const supportedFailures = measurable.filter(
      (scene) => !scene.pressure && scene.failedCount > 0,
    );
    const labPressure = labScenes.filter((scene) => scene.pressure);
    const clearPressure = clearScenes.filter((scene) => scene.pressure);
    const pressureFailing = [...labPressure, ...clearPressure].filter(
      (scene) => scene.failedCount > 0,
    );
    const report = {
      generatedAt: new Date().toISOString(),
      engine: engineLabel,
      devicePixelRatio: 1,
      base,
      sampling:
        "bounding-box screening with glyphs hidden; boxes and screenshots share one origin; unrounded ratios; classified samples (text 4.5:1, decorative/necessary-icon on solid tile inset 30% at 3:1)",
      matrix: {
        themes: 2,
        backgrounds: 11,
        materials: MATERIALS.length,
        scenes: measurable.length,
        samples: measurable.reduce((sum, scene) => sum + scene.sampleCount, 0),
        threshold: ">= 4.5:1 text / >= 3:1 non-text, compared unrounded",
      },
      supportedScenes: measurable.filter((scene) => !scene.pressure).length,
      pressureScenesLab: labPressure.length,
      pressureScenesClearToolbar: clearPressure.length,
      pressureScenesTotal: labPressure.length + clearPressure.length,
      pressureFailingScenes: pressureFailing.length,
      scenes: results,
      pressureDetails: [...labPressure, ...clearPressure].map((scene) => ({
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
        "Backdrop screening only: glyphs are hidden and the minimum ratio over each sample region is measured; not a per-glyph WCAG conformance audit.",
        "Excludes focus rings and control boundaries; axe and manual review cover those separately.",
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
        "Supported scenes below threshold:",
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
      throw new Error(`${supportedFailures.length} supported scenes failed the screening`);
    }
    console.log(
      `Composite contrast matrix: ${measurable.length} scenes, ${report.matrix.samples} samples (unrounded); supported scenes all pass; pressure = ${labPressure.length} lab + ${clearPressure.length} clear-toolbar (${pressureFailing.length} currently below threshold).`,
    );
  } finally {
    await browser?.close();
  }
}
if (isMain) {
  await runMatrix();
}
