import type { CSSProperties } from "react";

/**
 * 主题实验室唯一覆盖来源：预览变量、TSX/CSS 代码与 JSON 导出共用同一份构建结果。
 * 基准 RGB 必须与 packages/tokens/src/tokens.json 的 color-glass-regular-fill 一致
 * （packages/react/test 有契约测试守护，改动 Token 时需同步此处）。
 */
export const GLASS_FILL_BASE_RGB = {
  light: "255,255,255",
  dark: "28,29,34",
} as const;

/** 主题默认遮蔽（对应 tokens.json 的 regular fill alpha），用于展示"主题默认"。 */
export const THEME_GLASS_TINT = {
  light: 52,
  dark: 68,
} as const;

/** 官网 CSS 作用域类名：导出 CSS 与示例 TSX 一起粘贴即可生效。 */
export const THEME_SCOPE_CLASS = "my-cwa-theme";

export interface ThemeOverrideSpec {
  /** 已解析主题（实验室当前主题），不是 "system"。 */
  theme: "light" | "dark";
  /** null 表示继承当前主题公开 Token；数字为显式遮蔽百分比（20–90）。 */
  tint: number | null;
  /** "" 表示继承主题主色；非空为显式品牌主色。 */
  accent: string;
}

export interface ThemeOverrideBuild {
  /** 预览用：内联 CSS 自定义属性（与导出 cssTokens 完全一致）。 */
  variables: CSSProperties;
  /** JSON 导出用：Token 名 → 值。 */
  cssTokens: Record<string, string>;
  /** CSS 代码行（不含缩进外壳）。 */
  cssRules: string[];
  /** 是否存在显式覆盖；无覆盖时导出注释掉的作用域壳。 */
  hasOverrides: boolean;
}

export function buildThemeOverrides(spec: ThemeOverrideSpec): ThemeOverrideBuild {
  const cssTokens: Record<string, string> = {};
  const cssRules: string[] = [];
  const variables: Record<string, string> = {};
  if (spec.accent) {
    cssTokens["--cwa-design-color-accent"] = spec.accent;
    cssTokens["--cwa-design-color-on-accent"] = "#ffffff";
    cssRules.push(
      `  --cwa-design-color-accent: ${spec.accent};`,
      "  --cwa-design-color-on-accent: #ffffff;",
    );
    variables["--cwa-design-color-accent"] = spec.accent;
    variables["--cwa-design-color-on-accent"] = "#ffffff";
  }
  if (spec.tint !== null) {
    const fill = `rgba(${GLASS_FILL_BASE_RGB[spec.theme]},${spec.tint / 100})`;
    cssTokens["--cwa-design-color-glass-regular-fill"] = fill;
    cssRules.push(`  --cwa-design-color-glass-regular-fill: ${fill};`);
    variables["--cwa-design-color-glass-regular-fill"] = fill;
  }
  return { variables, cssTokens, cssRules, hasOverrides: cssRules.length > 0 };
}

/** 供 TSX 代码块使用：有覆盖时 Provider 需挂上作用域类，CSS 才会生效。 */
export function providerClassNameAttribute(hasOverrides: boolean): string {
  return hasOverrides ? ` className="${THEME_SCOPE_CLASS}"` : "";
}

export function renderCssSnippet(build: ThemeOverrideBuild): string {
  return build.hasOverrides
    ? `.${THEME_SCOPE_CLASS} {\n${build.cssRules.join("\n")}\n}`
    : `.${THEME_SCOPE_CLASS} {\n  /* 无覆盖：继承当前主题默认 Token */\n}`;
}
