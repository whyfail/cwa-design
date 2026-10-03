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
    expect(css).toContain(
      '[data-cwa-material="solid"], [data-cwa-material="solid"] [data-cwa-theme] {',
    );
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (prefers-reduced-transparency: reduce)");
    expect(css).toContain("@media (prefers-contrast: more)");
    expect(css).toContain(
      "@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))",
    );
  });

  it("玻璃填充在 solid 下回退到 surface 色，blur 清零", () => {
    const css = generateCss(tokens);
    const solidBlock = css
      .split('[data-cwa-material="solid"], [data-cwa-material="solid"] [data-cwa-theme] {')[1]!
      .split("}")[0]!;
    expect(solidBlock).toContain(
      "--cwa-design-color-glass-regular-fill: var(--cwa-design-color-surface)",
    );
    expect(solidBlock).toContain("--cwa-design-blur-glass-regular: 0px;");
  });

  it("正常态声明焦点和motion变量，不能只在减少动态中声明", () => {
    const normal = generateCss(tokens).split("@supports")[0]!;
    expect(normal).toContain("--cwa-design-focus-width: 2px;");
    expect(normal).toContain("--cwa-design-focus-offset: 3px;");
    expect(normal).toContain("--cwa-design-motion-control: 100ms;");
  });

  it("减少透明与增强对比覆盖嵌套主题的所有三档材质", () => {
    const css = generateCss(tokens);
    for (const feature of ["prefers-reduced-transparency: reduce", "prefers-contrast: more"]) {
      const block = css.split(`@media (${feature}) {`)[1]!.split("}\n}")[0]!;
      expect(block).toContain(":root, [data-cwa-theme]");
      for (const material of ["regular", "thick", "clear"]) {
        expect(block).toContain(
          `--cwa-design-color-glass-${material}-fill: var(--cwa-design-color-surface);`,
        );
        expect(block).toContain(`--cwa-design-blur-glass-${material}: 0px;`);
      }
    }
  });

  it("显式浅色作用域能恢复dark父层覆盖的语义Token", () => {
    const lightBlock = generateCss(tokens)
      .split(':root, [data-cwa-theme="light"] {')[1]!
      .split("}")[0]!;
    expect(lightBlock).toContain(
      `--cwa-design-color-text: ${tokens.semantic.light["color-text"]!.value};`,
    );
    expect(lightBlock).toContain(
      `--cwa-design-color-glass-clear-fill: ${tokens.semantic.light["glass-clear-fill"]!.value};`,
    );
  });

  it("拒绝尺寸值与单位不一致的Token", () => {
    const invalid: unknown = {
      ...tokens,
      primitive: {
        ...tokens.primitive,
        focus: {
          width: { value: "2rem", unit: "px", type: "dimension", description: "bad unit" },
        },
      },
    };
    expect(tokensSchema.safeParse(invalid).success).toBe(false);
  });

  it("层级 Token 必须是安全整数，拒绝小数和携带单位的值", () => {
    const withLayer = (value: string, unit = "integer") => ({
      ...tokens,
      primitive: {
        ...tokens.primitive,
        z: { test: { value, unit, type: "number", description: "overlay layer" } },
      },
    });
    for (const value of ["1.5", "1000px", "Infinity", "9007199254740992"]) {
      expect(tokensSchema.safeParse(withLayer(value)).success, value).toBe(false);
    }
    expect(tokensSchema.safeParse(withLayer("1000", "px")).success).toBe(false);
    const parsed = tokensSchema.parse(withLayer("1000"));
    expect(generateCss(parsed)).toContain("--cwa-design-z-test: 1000;");
    expect(tokensSchema.safeParse(withLayer("-1")).success).toBe(true);
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
