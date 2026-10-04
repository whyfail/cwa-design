// 主题实验室的覆盖构建常量必须与公共 Token 一致：预览、导出代码与 tokens.json
// 漂移时此测试失败（N01 回归：滑块显式覆盖用了旧蓝灰 RGB，导出却是新石墨色）。
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const tokens = JSON.parse(
  readFileSync(path.join(import.meta.dirname, "../../../packages/tokens/src/tokens.json"), "utf8"),
) as {
  semantic: Record<"light" | "dark", Record<"glass-regular-fill", { value: string }>>;
};

const overridesSource = readFileSync(
  path.join(import.meta.dirname, "../../../apps/docs/src/theme-overrides.ts"),
  "utf8",
);

function parseRgba(value: string): { rgb: string; alpha: string } {
  const match = /rgba\((\d+,\s*\d+,\s*\d+),\s*([\d.]+)\)/.exec(value);
  expect(match, `token value must be rgba: ${value}`).toBeTruthy();
  return { rgb: match![1]!.replace(/\s/g, ""), alpha: match![2]! };
}

describe("docs 主题实验室覆盖常量契约", () => {
  it("GLASS_FILL_BASE_RGB 与 tokens.json 的 glass-regular-fill 底色一致", () => {
    for (const theme of ["light", "dark"] as const) {
      const { rgb } = parseRgba(tokens.semantic[theme]["glass-regular-fill"].value);
      expect(overridesSource).toContain(`${theme}: "${rgb}"`);
    }
    // 旧蓝灰配方（24,31,45）不允许再出现在预览或导出中。
    expect(overridesSource).not.toContain("24,31,45");
  });

  it("THEME_GLASS_TINT 与 tokens.json 的 regular fill alpha 一致", () => {
    for (const theme of ["light", "dark"] as const) {
      const { alpha } = parseRgba(tokens.semantic[theme]["glass-regular-fill"].value);
      const percent = Math.round(Number(alpha) * 100);
      expect(overridesSource).toContain(`${theme}: ${percent}`);
    }
  });

  it("预览变量、CSS 代码与 JSON 导出使用同一构建函数（防再次分支出两份 RGB）", () => {
    expect(overridesSource).toContain("export function buildThemeOverrides");
    for (const consumer of [
      "apps/docs/src/pages/themes.tsx",
      "apps/docs/src/components/glass-playground.tsx",
    ]) {
      const source = readFileSync(path.join(import.meta.dirname, "../../../", consumer), "utf8");
      expect(source, consumer).toContain("buildThemeOverrides");
      // 消费方不得再内联手写玻璃填充 RGB。
      expect(source, consumer).not.toMatch(/rgba\(\$\{[^}]*\}[,)]/);
      expect(source, consumer).not.toContain('"24,31,45"');
      expect(source, consumer).not.toContain('"28,29,34"');
    }
  });
});
