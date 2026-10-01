"use client";

import type { ReactNode } from "react";
import { useCwaContext } from "../provider/provider";

/**
 * OverlayPortalScope：portal 内容的主题作用域。
 * tokens 定义在 :root（全局可继承），但 data-cwa-theme / data-cwa-material 等
 * 属性作用域在 Provider 根元素上；portal 挂到 body 后必须复制这些属性，
 * 否则浮层读不到主题/密度/材质（主计划 §9.1）。
 */
export function OverlayPortalScope({ children }: { children: ReactNode }) {
  const ctx = useCwaContext();
  const attributes: Record<string, string> = {};
  const theme = ctx.theme === "system" ? ctx.resolvedTheme : ctx.theme;
  if (theme) attributes["data-cwa-theme"] = theme;
  if (ctx.material === "solid") attributes["data-cwa-material"] = "solid";
  if (ctx.motion !== "system") attributes["data-cwa-motion"] = ctx.motion;
  if (ctx.density !== "comfortable") attributes["data-cwa-density"] = ctx.density;

  return (
    <div className="cwa-design-portal-scope" {...attributes}>
      {children}
    </div>
  );
}
