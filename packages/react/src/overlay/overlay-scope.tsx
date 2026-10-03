"use client";

import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { useCwaContext } from "../provider/provider";

/**
 * OverlayPortalScope：portal 内容的主题作用域。
 * tokens 定义在 :root（全局可继承），但 data-cwa-theme / data-cwa-material 等
 * 属性作用域在 Provider 根元素上；portal 挂到 body 后必须复制这些属性，
 * 否则浮层读不到主题/密度/材质（主计划 §9.1）。
 */
function useFocusGuardNames(scopeRef: RefObject<HTMLElement | null>, locale: string | undefined) {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const chinese = (locale || scope.ownerDocument.documentElement.lang || "en")
      .toLowerCase()
      .startsWith("zh");
    const label = chinese ? "继续浏览浮层内容" : "Continue browsing popup content";
    const ownedLabels = new Map<Element, string>();
    const labelGuards = () => {
      for (const guard of scope.querySelectorAll('[data-base-ui-focus-guard][role="button"]')) {
        const labelledBy = guard
          .getAttribute("aria-labelledby")
          ?.split(/\s+/)
          .some((id) => scope.ownerDocument.getElementById(id)?.textContent?.trim());
        if (
          guard.getAttribute("aria-label")?.trim() ||
          labelledBy ||
          guard.getAttribute("title")?.trim() ||
          guard.textContent?.trim()
        )
          continue;
        guard.setAttribute("aria-label", label);
        ownedLabels.set(guard, label);
      }
    };
    // Base UI 1.8.0 uses role=button on WebKit guards so VoiceOver's cursor
    // participates in the focus trap. Popup/Portal expose no guard-label prop.
    // Keep its role/focus handling, and name only unnamed guards in this scope.
    const observer = new MutationObserver(labelGuards);
    observer.observe(scope, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["role", "aria-label", "aria-labelledby", "title"],
    });
    labelGuards();
    return () => {
      observer.disconnect();
      for (const [guard, value] of ownedLabels) {
        if (scope.contains(guard) && guard.getAttribute("aria-label") === value)
          guard.removeAttribute("aria-label");
      }
    };
  }, [locale, scopeRef]);
}

/** Non-modal Base UI triggers also emit VoiceOver guards outside the portal. */
export function FocusGuardScope({ children }: { children: ReactNode }) {
  const ctx = useCwaContext();
  const scopeRef = useRef<HTMLSpanElement>(null);
  useFocusGuardNames(scopeRef, ctx.locale);
  return (
    <span ref={scopeRef} className="cwa-design-focus-scope">
      {children}
    </span>
  );
}

export function OverlayPortalScope({ children }: { children: ReactNode }) {
  const ctx = useCwaContext();
  const scopeRef = useRef<HTMLDivElement>(null);
  useFocusGuardNames(scopeRef, ctx.locale);
  const attributes: Record<string, string> = {};
  const theme = ctx.theme === "system" ? ctx.resolvedTheme : ctx.theme;
  if (theme) attributes["data-cwa-theme"] = theme;
  if (ctx.material === "solid") attributes["data-cwa-material"] = "solid";
  if (ctx.motion !== "system") attributes["data-cwa-motion"] = ctx.motion;
  if (ctx.density !== "comfortable") attributes["data-cwa-density"] = ctx.density;

  return (
    <div ref={scopeRef} className="cwa-design-portal-scope" {...attributes}>
      {children}
    </div>
  );
}
