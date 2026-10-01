import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generateCss, tokensSchema } from "../scripts/generate.js";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokens = tokensSchema.parse(
  JSON.parse(readFileSync(path.join(pkgRoot, "src", "tokens.json"), "utf8")),
);

describe("tokens", () => {
  it("light 与 dark 主题键集合一致", () => {
    expect(Object.keys(tokens.semantic.light).sort()).toEqual(
      Object.keys(tokens.semantic.dark).sort(),
    );
  });

  it("生成 CSS 包含 :root、dark 主题、solid 材质与 reduce 降级", () => {
    const css = generateCss(tokens);
    expect(css).toContain(":root {");
    expect(css).toContain('[data-cwa-theme="dark"] {');
    expect(css).toContain('[data-cwa-material="solid"] {');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (prefers-reduced-transparency: reduce)");
    expect(css).toContain("@media (prefers-contrast: more)");
    expect(css).toContain("@supports not (backdrop-filter: blur(1px))");
  });

  it("玻璃填充在 solid 下回退到 surface 色，blur 清零", () => {
    const css = generateCss(tokens);
    const solidBlock = css.split('[data-cwa-material="solid"] {')[1]!;
    expect(solidBlock).toContain(
      `--cwa-design-color-glass-regular-fill: ${tokens.semantic.light["color-surface"]!.value}`,
    );
    expect(solidBlock).toContain("--cwa-design-blur-glass-regular: 0px;");
  });

  it("所有颜色值可被解析格式接受", () => {
    for (const theme of ["light", "dark"] as const) {
      for (const [key, entry] of Object.entries(tokens.semantic[theme])) {
        expect(entry.value, `${theme}/${key}`).toMatch(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))$/);
      }
    }
  });

  it("Spring 预设 bounce ≤ 0.15 且 overlay/move 无回弹", () => {
    expect(tokens.motion.move).toMatchObject({ bounce: 0 });
    expect(tokens.motion.overlay).toMatchObject({ bounce: 0 });
    expect(
      tokens.motion.sheet?.type === "spring" ? tokens.motion.sheet.bounce : 1,
    ).toBeLessThanOrEqual(0.2);
  });
});
