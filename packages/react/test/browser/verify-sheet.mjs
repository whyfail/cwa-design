/* global document, innerWidth, getComputedStyle */
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const playwright = await import(process.env.CWA_PLAYWRIGHT_MODULE || "playwright");
const baseUrl = process.env.CWA_SHEET_URL || "http://127.0.0.1:4182/";
const results = { generatedAt: new Date().toISOString(), fixture: baseUrl, browsers: [] };
const cases = [
  { name: "bottom", placement: "bottom", sign: 1 },
  { name: "end-ltr", placement: "end", sign: 1 },
  { name: "end-rtl", placement: "end", sign: -1, rtl: true },
  { name: "system-reduced-end-rtl", placement: "end", sign: -1, rtl: true, systemReduced: true },
  { name: "bottom-reduced-solid", placement: "bottom", sign: 1, reduced: true, solid: true },
];

async function drag(page, box, dx, dy, steps, pause) {
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(x + (dx * step) / steps, y + (dy * step) / steps);
    await page.waitForTimeout(pause);
  }
}

for (const engine of ["chromium", "firefox", "webkit"]) {
  const browser = await playwright[engine].launch(
    engine === "chromium" && process.env.CWA_CHROMIUM_CHANNEL
      ? { channel: process.env.CWA_CHROMIUM_CHANNEL }
      : {},
  );
  const browserResult = { engine, version: browser.version(), checks: [], errors: [] };
  try {
    for (const item of cases) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        reducedMotion: item.systemReduced ? "reduce" : "no-preference",
      });
      page.on("pageerror", (error) => browserResult.errors.push(error.message));
      const url = new URL(baseUrl);
      url.searchParams.set("placement", item.placement);
      if (item.rtl) url.searchParams.set("rtl", "1");
      if (item.reduced) url.searchParams.set("reduced", "1");
      if (item.solid) url.searchParams.set("solid", "1");
      await page.goto(url.href);
      assert.equal(
        await page.locator(".cwa-design-provider").count(),
        1,
        "recipes must inherit the parent scope",
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
        "390px recipe overflow",
      );
      const trigger = page.getByRole("button", { name: "打开测试面板" });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "测试面板" });
      await dialog.waitFor({ state: "visible" });
      await page.waitForTimeout(360);
      const grip = page.getByRole("button", { name: "关闭面板；拖动也可关闭" });
      const gripBox = await grip.boundingBox();
      assert(gripBox.width >= 44 && gripBox.height >= 44, "44px grip target");
      const before = await dialog.boundingBox();
      const axis = item.placement === "bottom" ? "y" : "x";
      const otherAxis = axis === "y" ? "x" : "y";
      await drag(page, gripBox, axis === "x" ? 35 * item.sign : 0, axis === "y" ? 35 : 0, 7, 60);
      const during = await dialog.boundingBox();
      assert(
        Math.abs(during[axis] - before[axis] - 35 * item.sign) < 1,
        `material must track the drag axis 1:1: ${JSON.stringify({ item: item.name, before, during })}`,
      );
      assert(Math.abs(during[otherAxis] - before[otherAxis]) < 1, "other axis must stay fixed");
      await page.mouse.up();
      await page.waitForTimeout(500);
      assert(await dialog.isVisible(), "short slow drag must stay open");
      const after = await dialog.boundingBox();
      assert(
        Math.abs(after[axis] - before[axis]) < 1,
        "short drag must spring back on its own axis",
      );

      await drag(
        page,
        await grip.boundingBox(),
        axis === "x" ? 35 * item.sign : 0,
        axis === "y" ? 35 : 0,
        7,
        30,
      );
      await grip.dispatchEvent("pointercancel", { pointerId: 1, pointerType: "mouse" });
      await page.mouse.up();
      await page.waitForTimeout(120);
      assert(await dialog.isVisible(), "cancelled pointer must keep panel open");
      assert(
        Math.abs((await dialog.boundingBox())[axis] - before[axis]) < 1,
        "pointercancel must reset the drag",
      );

      const scroll = dialog.locator(".cwa-design-sheet__drag");
      const scrollMetrics = await scroll.evaluate((el) => ({
        height: el.clientHeight,
        scrollHeight: el.scrollHeight,
        touchAction: getComputedStyle(el).touchAction,
        popupTouchAction: getComputedStyle(el.parentElement).touchAction,
      }));
      assert.equal(scrollMetrics.touchAction, "pan-y");
      assert.equal(scrollMetrics.popupTouchAction, "auto");
      assert(scrollMetrics.scrollHeight > scrollMetrics.height);
      assert(scrollMetrics.height <= before.height + 1, "padding must fit the popup height");
      const scrollBox = await scroll.boundingBox();
      await page.mouse.move(scrollBox.x + scrollBox.width / 2, scrollBox.y + 130);
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(300);
      assert(
        await scroll.evaluate((el) => el.scrollTop > 0),
        "body must scroll independently of the grip",
      );
      await scroll.evaluate((el) => {
        el.scrollTop = 0;
      });
      if (item.reduced || item.systemReduced) {
        const style = await dialog.evaluate((el) => ({
          transition: getComputedStyle(el).transitionProperty,
          filter: getComputedStyle(el).backdropFilter,
        }));
        assert.equal(style.transition, "opacity");
        if (item.solid) assert.equal(style.filter, "none");
      }

      await drag(
        page,
        await grip.boundingBox(),
        axis === "x" ? 130 * item.sign : 0,
        axis === "y" ? 130 : 0,
        13,
        40,
      );
      await page.mouse.up();
      await dialog.waitFor({ state: "hidden" });
      assert(
        await trigger.evaluate((el) => el === document.activeElement),
        "dismiss must restore trigger focus",
      );
      await trigger.click();
      await dialog.waitFor({ state: "visible" });
      await page.waitForTimeout(360);
      assert(
        Math.abs((await dialog.boundingBox())[axis] - before[axis]) < 1,
        "reopen must reset the previous drag",
      );
      await grip.focus();
      await page.keyboard.press("Enter");
      await dialog.waitFor({ state: "hidden" });

      await page.getByLabel("消息", { exact: true }).fill("浏览器本地消息");
      await page.getByRole("button", { name: "发送", exact: true }).click();
      assert(await page.getByText("浏览器本地消息", { exact: true }).isVisible());
      await page.getByLabel("选择本地附件").setInputFiles({
        name: "sample.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("fixture"),
      });
      assert(await page.getByText("本地附件：sample.txt").isVisible());
      await page.getByRole("button", { name: "清除附件" }).click();
      assert.equal(await page.getByText("本地附件：sample.txt").count(), 0);
      browserResult.checks.push({
        name: item.name,
        before,
        during,
        after,
        grip: gripBox,
        scroll: scrollMetrics,
        passed: true,
      });
      await page.close();
    }
    assert.equal(browserResult.errors.length, 0, "no browser runtime errors");
    browserResult.passed = true;
  } catch (error) {
    browserResult.passed = false;
    browserResult.failure = error.stack;
    process.exitCode = 1;
  } finally {
    results.browsers.push(browserResult);
    console.log(
      `${engine}: ${browserResult.passed ? "pass" : "fail"} (${browserResult.checks.length} cases)`,
    );
    await browser.close();
  }
}
await writeFile(
  fileURLToPath(new URL("results.json", import.meta.url)),
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    results.browsers.map(({ engine, version, passed, checks, failure }) => ({
      engine,
      version,
      passed,
      cases: checks.length,
      failure,
    })),
    null,
    2,
  ),
);
