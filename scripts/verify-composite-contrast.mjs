// Measure real rendered backdrops, rather than assuming transparent surfaces are solid.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
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
const results = [];
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
 item['minimumContrast']=round(min(ratios),2); item['passed']=min(ratios)>=4.5; out.append(item)
print(json.dumps(out,ensure_ascii=False))`;
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: theme,
    });
    await context.addInitScript((value) => localStorage.setItem("cwa-theme", value), theme);
    const page = await context.newPage();
    for (const material of ["regular", "clear"]) {
      // regular：首页样张（山水）；clear：Surface 页的媒体工具栏专用样张，
      // 浅色 Clear 配亮调媒体、深色 Clear 配暗调媒体（主题自动配对）。
      await page.goto(new URL(material === "regular" ? "" : "components/surface/", base).href);
      await page.waitForFunction(
        (value) => document.documentElement.dataset.cwaTheme === value,
        theme,
      );
      const sceneLocator = page.locator(
        material === "regular"
          ? ".glass-playground"
          : ".demo-stage:has(.cwa-design-surface--glass-clear)",
      );
      if (material === "clear") {
        // 示例经 IntersectionObserver 懒加载：先滚动全部舞台等待玻璃样张挂载。
        for (const stage of await page.locator(".demo-stage").all()) {
          await stage.scrollIntoViewIfNeeded();
        }
        await sceneLocator.waitFor({ timeout: 15000 });
      }
      const scene = sceneLocator.first();
      await scene.scrollIntoViewIfNeeded();
      const labelSelector =
        material === "regular"
          ? ".panel-top strong, .panel-top p, .panel-volume > div > span, .panel-volume output, .cwa-design-switch__label, .cwa-design-field__label, .panel-status, .glass-music-bar strong, .glass-music-bar p"
          : ".cwa-design-surface--glass-clear p";
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
      }, labelSelector);
      const file = path.join(temp, `${theme}-${material}.png`);
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
      results.push({
        theme,
        material,
        background: material === "regular" ? "original-landscape-svg" : "self-drawn-media-toolbar",
        samples,
      });
    }
    await context.close();
  }
  const failed = results.flatMap((item) =>
    item.samples
      .filter((sample) => !sample.passed)
      .map((sample) => ({ theme: item.theme, material: item.material, ...sample })),
  );
  await writeFile(
    path.join(root, "reports/optimization/composite-contrast-results.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        engine: browser.version(),
        results,
        failed,
        limitations: [
          "Checks only selected opaque labels in four default rendered scenes; not all application backgrounds or photos.",
          "Text glyphs alone were made transparent to sample the backdrop while retaining container fill, reflection and blur.",
          "This sampled contrast evidence is separate from axe and does not establish full WCAG conformance.",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  assert.deepEqual(failed, []);
  console.log(
    `Composite contrast: ${results.reduce((sum, item) => sum + item.samples.length, 0)} label samples passed 4.5:1.`,
  );
} finally {
  await browser.close();
}
