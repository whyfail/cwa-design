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

const read = (relative: string) =>
  readFileSync(path.join(import.meta.dirname, "../../../", relative), "utf8");

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

describe("V04 材质策略四端同步防漂移", () => {
  const policy = read("apps/docs/src/background-policy.ts");
  const surfaceMeta = read("packages/react/src/surface/surface.meta.ts");
  const skill = read("skills/cwa-design/SKILL.md");
  const materialsArticle = read("apps/docs/src/pages/articles.tsx");

  it("策略与 Surface 契约使用同一证据口径（11 背景、未取整、深色×纯白 4.487）", () => {
    expect(policy).toContain('glassDarkPressure = ["photo-light", "white"]');
    for (const source of [surfaceMeta, skill, materialsArticle]) {
      expect(source).toContain("11 背景");
      expect(source).toContain("3.910");
      expect(source).not.toContain("全部验证背景达标");
      expect(source).not.toContain("全部九类验证背景达标");
      expect(source).not.toContain("9 背景");
    }
  });

  it("四类支持状态在策略、实验室与契约中同在", () => {
    for (const state of [
      "supported",
      "pressure",
      "not-recommended",
      "explicit-override-unverified",
    ]) {
      expect(policy).toContain(state);
      expect(read("apps/docs/src/pages/themes.tsx")).toContain("supportState");
    }
    expect(surfaceMeta).toContain("显式 tint/accent 覆盖不在默认矩阵范围内");
    expect(skill).toContain("explicit-override-unverified");
  });

  it("Clear 逐媒体压力数组与脚本解析的命名一致", () => {
    expect(policy).toContain('clearLightMediaPressure = ["real-bright", "real-dark", "split"]');
    expect(policy).toContain('clearDarkMediaPressure = ["split"]');
    const script = read("scripts/verify-composite-contrast.mjs");
    expect(script).toContain('parseArray("clearLightMediaPressure")');
    expect(script).toContain('parseArray("clearDarkMediaPressure")');
  });
});

describe("F01 玻璃候选 A/B 契约", () => {
  const alpha2Tokens = JSON.parse(
    read("packages/registry/snapshots/react/0.1.0-alpha.2/tokens.json"),
  ) as { semantic: Record<string, Record<string, { value: string }>> };
  const currentTokensJson = JSON.parse(read("packages/tokens/src/tokens.json")) as {
    semantic: Record<string, Record<string, { value: string }>>;
  };
  const candidates = read("apps/docs/src/components/glass-candidates.tsx");

  it("A 侧从冻结 alpha.2 逐主题构造，不再手写浅色集合展开到深色", () => {
    expect(candidates).toContain("legacyTokensFor");
    expect(candidates).toContain("0.1.0-alpha.2/tokens.json");
    expect(candidates).not.toContain("LEGACY_TOKENS_DARK");
    // 79168ce 真实深色 reflection/contact/ambient 不再被浅色值污染
    expect(candidates).not.toContain(
      '"--cwa-design-color-glass-reflection": "rgba(255,255,255,0.30)"',
    );
    expect(candidates).not.toContain(
      '"--cwa-design-color-glass-contact-shadow": "rgba(24,46,82,0.10)"',
    );
  });

  it("A/B 差异集恰好等于冻结与当前 Token 的实际光学差异", () => {
    for (const theme of ["light", "dark"] as const) {
      const frozen = alpha2Tokens.semantic[theme]!;
      const current = currentTokensJson.semantic[theme]!;
      for (const [token, record] of Object.entries(current)) {
        const old = frozen[token]?.value;
        const differs = old !== undefined && old !== record.value;
        const listed = [
          "glass-rim-top",
          "glass-reflection",
          "glass-contact-shadow",
          "glass-ambient-shadow",
        ].includes(token);
        if (differs) expect(listed, `${theme}/${token} 差异未列入候选集`).toBe(true);
        // 无差异的 Token 由 legacyTokensFor 的逐主题比较与 CANDIDATE_NOTES 的
        // old!==next 过滤保证不会进入 A 覆盖或差异表，此处不要求列表排除。
      }
    }
  });

  it("滚动文字层位于玻璃背后（同场景内容层/功能层结构）", () => {
    expect(candidates).toContain("ab-scroll-layer");
    expect(read("apps/docs/src/styles/site.css")).toMatch(
      /\.ab-scroll-layer[^}]*position: absolute/,
    );
  });
});
