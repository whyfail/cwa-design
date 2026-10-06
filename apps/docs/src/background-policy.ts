/**
 * V04：材质支持状态与压力矩阵（单一来源）。
 *
 * 证据边界：2026-10-04/05 实测筛查，2 主题 × 11 背景 × 4 材质，Chromium
 * 1440×1000、devicePixelRatio 1、未取整 4.5:1、逐文字包围框采样（隐藏字形）。
 * 状态分四类，不得互相概括：
 * - supported：默认 Token 下实测全部样本 ≥4.5:1；
 * - pressure：默认 Token 下实测存在 <4.5:1 样本（保留全部历史压力组合）；
 * - not-recommended：该用途本身不推荐（如 Clear 用于完整表单），不等于每个
 *   背景都低对比——同向极端背景（浅色×纯白、深色×纯黑）实测可达标；
 * - explicit-override-unverified：用户设置显式 tint/accent 覆盖后，默认矩阵
 *   的结论不适用，需在实际页面复查（20% 遮蔽不能继承默认 52/68% 的判断）。
 *
 * verify-composite-contrast.mjs 解析下列数组做受支持场景断言；
 * 改动数组必须与实测报告同步（reports/optimization/composite-contrast-results.json）。
 */
export const glassLightPressure = ["photo-dark", "split", "black"];

/** 深色×纯白为默认已测压力：regular 正文样本实测最低 3.910:1（未取整 <4.5）。 */
export const glassDarkPressure = ["photo-light", "white"];

/**
 * Clear 轻工具栏逐媒体状态（V03 重测）：自绘样张不能代表真实媒体。
 * 浅色主题的真实照片（含混合亮暗区域）实测失败；深色主题的照片场景通过。
 * 键与 Surface 页 ClearMediaStage 的 data-clear-media-stage 对应
 * （self-drawn = Registry 自绘示例，恒为 supported）。
 */
export const clearLightMediaPressure = ["real-bright", "real-dark", "split"];

export const clearDarkMediaPressure = ["split"];

export const clearMediaPressure: Record<"light" | "dark", string[]> = {
  light: clearLightMediaPressure,
  dark: clearDarkMediaPressure,
};

export type MaterialSupportState =
  | "supported"
  | "pressure"
  | "not-recommended"
  | "explicit-override-unverified";

export interface SupportQuery {
  /** 已解析主题（不是 "system"）。 */
  theme: "light" | "dark";
  material: string;
  background: string;
  /** 显式遮蔽覆盖（%）；null/undefined = 主题默认。 */
  tint?: number | null;
  /** 显式主色覆盖；"" = 主题默认。 */
  accent?: string;
}

export interface SupportStateResult {
  state: MaterialSupportState;
  message: string | null;
}

const PRESSURE_REASONS: Record<string, string> = {
  "photo-dark":
    "压力（默认已测失败）：浅色主题×暗图媒体上，regular 的副文字低于 4.5:1（实测最低约 3.6:1）。",
  "photo-light":
    "压力（默认已测失败）：深色主题×亮图媒体上，regular 的副文字低于 4.5:1（实测最低约 3.6:1）。",
  split:
    "压力（默认已测失败）：明暗分区背景上，regular 的副文字在暗半侧低于 4.5:1（浅色主题实测 4.469:1）。",
  black:
    "压力（默认已测失败）：浅色主题×纯黑上，regular 的副文字低于 4.5:1（实测最低约 3.591:1）。",
  white:
    "压力（默认已测失败）：深色主题×纯白上，regular 正文样本实测最低 3.910:1（<4.5，含音乐条标题等 3 个样本）。",
};

export function supportState(query: SupportQuery): SupportStateResult {
  if ((query.tint !== null && query.tint !== undefined) || query.accent) {
    return {
      state: "explicit-override-unverified",
      message:
        "显式覆盖未验证：当前遮蔽/主色不是主题默认 Token，本页与导出矩阵的通过结论不适用；请在实际背景上复查文字、焦点与控件边界。",
    };
  }
  if (query.material === "glass-clear") {
    return {
      state: "not-recommended",
      message:
        "不推荐此用途：Clear 透射很高，完整表单面板的副文字在多数背景低于 4.5:1（同向极端背景如浅色×纯白、深色×纯黑实测可达标）。Clear 只适合媒体上的轻工具栏。",
    };
  }
  const pressure = query.theme === "dark" ? glassDarkPressure : glassLightPressure;
  if (query.material === "glass" && pressure.includes(query.background)) {
    return {
      state: "pressure",
      message:
        PRESSURE_REASONS[query.background] ?? "压力（默认已测失败）：该背景存在 <4.5:1 样本。",
    };
  }
  return { state: "supported", message: null };
}

export function clearMediaState(theme: "light" | "dark", media: string): SupportStateResult {
  if (clearMediaPressure[theme].includes(media)) {
    return {
      state: "pressure",
      message:
        theme === "light"
          ? "压力（默认已测失败）：浅色主题的 Clear 在真实照片的混合亮暗区域低于 4.5:1（亮照片实测最低 1.134、暗照片 1.642、分区 2.519）。请改用 Regular/Thick 或深色主题。"
          : "压力（默认已测失败）：深色主题的 Clear 在明暗分区背景低于 4.5:1（实测 3.644）；真实亮/暗照片场景实测通过。",
    };
  }
  return { state: "supported", message: null };
}

export const SAFE_ALTERNATIVE_HINT =
  "通过方案：改用 Thick Frosted 或 Solid（默认矩阵全部背景实测达标），或给控件局部实色底面。";
