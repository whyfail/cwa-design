// 官网文档标题排版只允许作用于官网内容层；组件标题（浮层 Title 等）的
// 字号/行高/字距/边距由组件自身 CSS 决定，在任意宿主页面保持一致。
// 回归背景：玻璃视觉审查 2026-10-04 第 4 项（Toast/Sheet 标题吃到官网 h2 样式）。
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const siteCssPath = path.join(import.meta.dirname, "../../../apps/docs/src/styles/site.css");

describe("docs 站点标题样式作用域", () => {
  const css = readFileSync(siteCssPath, "utf8");

  it("h1/h2/h3 排版规则全部限定在站点容器选择器内", () => {
    const scoped = css.match(/:is\(\.site-doc-main[^{]*\)\s*:is\(h1, h2, h3\)/);
    expect(scoped).toBeTruthy();
    // 不允许出现作用于全局的裸标题排版规则。
    expect(css).not.toMatch(/^h1\s*\{/m);
    expect(css).not.toMatch(/^h2\s*\{/m);
    expect(css).not.toMatch(/^h3\s*\{/m);
    expect(css).not.toMatch(/^h1, h2, h3\s*\{/m);
  });

  it("浮层标题的组件 CSS 显式定义字号与字距，不依赖宿主", () => {
    const reactDir = path.join(import.meta.dirname);
    for (const [file, marker] of [
      ["dialog/dialog.css", "cwa-design-dialog__title"],
      ["popover/popover.css", "cwa-design-popover__title"],
      ["sheet/sheet.css", "cwa-design-sheet__title"],
      ["toast/toast.css", "cwa-design-toast__title"],
    ] as const) {
      const source = readFileSync(path.join(reactDir, file), "utf8");
      const start = source.indexOf(marker);
      const rule = source.slice(start, source.indexOf("}", start));
      expect(rule, file).toContain("font-size:");
      expect(rule, file).toContain("letter-spacing: normal");
    }
  });
});
