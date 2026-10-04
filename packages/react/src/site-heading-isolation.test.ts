// 官网文档标题/正文排版只允许以零特异性（:where）作用于官网内容层；
// 组件标题与文本（浮层 Title、Heading、Text 等）由组件自身 CSS 决定，
// 在任意宿主页面保持一致。
// 回归背景：玻璃视觉审查 2026-10-04 第 4 项（Toast/Sheet 标题吃到官网 h2 样式），
// 以及第二轮复核 N02（demo 内 Heading/Text 仍被官网后代选择器覆盖）。
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const siteCssPath = path.join(import.meta.dirname, "../../../apps/docs/src/styles/site.css");

describe("docs 站点排版样式作用域", () => {
  const css = readFileSync(siteCssPath, "utf8");

  it("h1/h2/h3 排版规则全部使用 :where 零特异性并限定在站点容器内", () => {
    const scoped = css.match(/:where\(\.site-doc-main[^{]*\)\s*:where\(h1, h2, h3\)/);
    expect(scoped).toBeTruthy();
    // 不允许出现作用于全局的裸标题排版规则。
    expect(css).not.toMatch(/^h1\s*\{/m);
    expect(css).not.toMatch(/^h2\s*\{/m);
    expect(css).not.toMatch(/^h3\s*\{/m);
    expect(css).not.toMatch(/^h1, h2, h3\s*\{/m);
    // 零特异性边界内不允许再用 :is（:is 会恢复特异性，重新压过组件类）。
    for (const match of css.matchAll(
      /:is\([^)]*\)\s*:is\(h1, h2, h3\)|:is\(\.site-doc-main[^{]*\)\s*:is\(h[123]/g,
    )) {
      expect.fail(`站点标题规则必须用 :where 零特异性：${match[0]}`);
    }
  });

  it("站点正文段/列表/表格规则零特异性，组件文本类选择器始终优先", () => {
    expect(css).toContain(':where(.site-doc-main section p:not([class*="cwa-design-"])');
    expect(css).not.toMatch(/^\.site-doc-main section p/m);
    expect(css).not.toMatch(/^table\s*\{/m);
    expect(css).toContain(":where(.site-doc-main) table");
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

  it("Heading 的 title/body 视觉档显式声明正常字距，宿主标题 tracking 不得漏入", () => {
    // 回归背景：第二轮复核 N02——官网 h1 的负字距会泄漏到 demo 内的
    // Heading--title/--body（display 档显式声明 tracking，不受影响）。
    const source = readFileSync(path.join(import.meta.dirname, "heading/heading.css"), "utf8");
    for (const marker of ["cwa-design-heading--title", "cwa-design-heading--body"]) {
      const start = source.indexOf(marker);
      const rule = source.slice(start, source.indexOf("}", start));
      expect(rule, marker).toContain("letter-spacing: normal");
    }
  });
});
