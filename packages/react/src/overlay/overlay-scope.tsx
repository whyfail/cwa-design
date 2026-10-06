"use client";

import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef } from "react";
import { useCwaContext } from "../provider/provider";

/**
 * OverlayPortalScope：portal 内容的主题作用域。
 * tokens 定义在 :root（全局可继承），但 data-cwa-theme / data-cwa-material 等
 * 属性作用域在 Provider 根元素上；portal 挂到 body 后必须复制这些属性，
 * 否则浮层读不到主题/密度/材质（主计划 §9.1）。
 *
 * Token 覆盖同步（ADR 0001）：Provider 根元素上通过 className/style 生效的
 * `--cwa-design-*` 覆盖不会自然传入 Portal。挂载时枚举 Provider 根的计算样式，
 * 与本作用域元素的自然解析值逐项比较，仅把差异写到作用域元素上；打开时一次 +
 * Provider 属性/Context 变化时重同步，不做每帧读取。
 */
function useTokenScopeSync(
  scopeRef: RefObject<HTMLElement | null>,
  providerElement: HTMLElement | null,
  resyncKeys: readonly unknown[],
) {
  const syncedNames = useRef<Set<string>>(new Set());
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope || !providerElement) return;
    const sync = () => {
      // 先清除上一轮同步的内联值，让比较基于自然解析结果。
      for (const name of syncedNames.current) scope.style.removeProperty(name);
      syncedNames.current.clear();
      const providerComputed = getComputedStyle(providerElement);
      const scopeComputed = getComputedStyle(scope);
      // 候选名：Provider 计算样式枚举（真实浏览器覆盖 class+inline）∪ 根元素
      // 内联样式名（jsdom 等不枚举自定义属性时的可靠来源）。
      const names = new Set<string>();
      for (let index = 0; index < providerComputed.length; index += 1) {
        const name = providerComputed[index]!;
        if (name.startsWith("--cwa-design-")) names.add(name);
      }
      for (let index = 0; index < providerElement.style.length; index += 1) {
        const name = providerElement.style[index]!;
        if (name.startsWith("--cwa-design-")) names.add(name);
      }
      for (const name of names) {
        const providerValue =
          providerElement.style.getPropertyValue(name).trim() ||
          providerComputed.getPropertyValue(name).trim();
        const scopeValue = scopeComputed.getPropertyValue(name).trim();
        if (providerValue && providerValue !== scopeValue) {
          scope.style.setProperty(name, providerValue);
          syncedNames.current.add(name);
        }
      }
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(providerElement, {
      attributes: true,
      attributeFilter: [
        "style",
        "class",
        "data-cwa-theme",
        "data-cwa-material",
        "data-cwa-motion",
        "data-cwa-density",
      ],
    });
    return () => {
      observer.disconnect();
      for (const name of syncedNames.current) scope.style.removeProperty(name);
      syncedNames.current.clear();
    };
    // resyncKeys：Context 主题/材质/密度/动效变化时重同步（展开依赖为刻意设计）。
  }, [scopeRef, providerElement, ...resyncKeys]);
}
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
  useTokenScopeSync(scopeRef, ctx.providerElement, [
    ctx.theme,
    ctx.resolvedTheme,
    ctx.material,
    ctx.motion,
    ctx.density,
  ]);
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
