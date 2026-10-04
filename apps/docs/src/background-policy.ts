/**
 * 背景可读性压力矩阵（N03）。
 * 来源：2026-10-04 实测筛查（2 主题 × 背景 × 4 材质，阈值 4.5:1），
 * 复现命令见 reports/optimization/composite-contrast-results.json。
 * 以下数组列出 regular 玻璃在"完整实验室面板（含副文字样本）"中低于 4.5:1
 * 的背景；这些组合在实验室中明确标识为压力负例，不能通过换有利底图或
 * 删样本来隐藏。verify-composite-contrast.mjs 按同名数组断言受支持场景。
 * frosted / solid 在全部场景达标（筛查最低 6.303:1），是可复制的安全替代。
 */
export const glassLightPressure = ["photo-dark", "split", "black"];

export const glassDarkPressure = ["photo-light", "white"];

export function pressureReason(
  theme: "light" | "dark",
  material: string,
  background: string,
): string | null {
  if (material === "glass-clear") {
    return "压力负例：Clear 的透射很高，完整表单面板上的副文字低于 4.5:1。Clear 只适合媒体上的轻量工具栏（浅色配亮调媒体、深色配暗调媒体，少量大号短标签）。";
  }
  const pressure = theme === "dark" ? glassDarkPressure : glassLightPressure;
  if (material === "glass" && pressure.includes(background)) {
    if (background === "photo-dark" || background === "photo-light" || background === "split") {
      return "压力负例：跨亮度媒体/分区背景上，regular 的副文字可能低于 4.5:1（实测最低约 3.6:1）。正文与控件标签仍达标。";
    }
    return "压力负例：反向极端背景上，regular 的副文字可能低于 4.5:1（实测最低约 3.6:1）。正文与控件标签仍达标。";
  }
  return null;
}

export const SAFE_ALTERNATIVE_HINT =
  "通过方案：改用 Thick Frosted 或 Solid（全部背景达标），或给控件局部实色底面。";
