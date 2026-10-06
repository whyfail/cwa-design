"use client";

import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type MaterialPreference = "auto" | "solid";
export type MotionPreference = "system" | "reduced" | "full";
export type Density = "comfortable" | "compact";

export interface CwaContextValue {
  theme: ThemePreference;
  /** 'system' 在客户端解析后的实际主题；SSR/首帧为 null。 */
  resolvedTheme: "light" | "dark" | null;
  material: MaterialPreference;
  motion: MotionPreference;
  density: Density;
  locale: string | undefined;
  /** overlay portal 挂载容器；null 表示尚未在客户端就绪。 */
  portalContainer: HTMLElement | null;
  /** Provider 根元素（ADR 0001）：Portal 作用域从它同步实际生效的 Token 覆盖。 */
  providerElement: HTMLElement | null;
}

const CwaContext = createContext<CwaContextValue | null>(null);

/** Optional context for compositions that can inherit a scope or provide their own. */
export function useOptionalCwaContext(): CwaContextValue | null {
  return useContext(CwaContext);
}

export function useCwaContext(): CwaContextValue {
  const value = useContext(CwaContext);
  if (!value) {
    throw new Error("CWA Design 组件必须置于 <CwaProvider> 内（useCwaContext）");
  }
  return value;
}

export interface CwaProviderProps {
  theme?: ThemePreference;
  /** 'solid' 强制全部表面实色（可访问性/无 blur 降级之外的显式选择）。 */
  material?: MaterialPreference;
  /** 'full' 不会覆盖系统 reduced-motion（design-rules §2）。 */
  motion?: MotionPreference;
  density?: Density;
  locale?: string;
  /** 自定义 portal 容器；默认 body，仅在客户端创建。 */
  portalContainer?: HTMLElement | null;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * CwaProvider：主题/材质/动效/密度/locale 的根，承载 token 属性作用域。
 * SSR 首屏策略：显式 theme 直接渲染属性；'system' 在 hydration 后解析，
 * 避免水合不匹配。无闪烁深色需消费方在 <html> 上预置 data-cwa-theme（文档说明）。
 */
export function CwaProvider({
  theme = "system",
  material = "auto",
  motion = "system",
  density = "comfortable",
  locale,
  portalContainer = null,
  className,
  style,
  children,
}: CwaProviderProps) {
  const [resolvedSystemTheme, setResolvedSystemTheme] = useState<"light" | "dark" | null>(null);
  const [providerElement, setProviderElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (theme !== "system") {
      setResolvedSystemTheme(null);
      return;
    }
    // 非浏览器环境（无 matchMedia）按 light 处理，等价于系统未声明偏好。
    if (typeof window.matchMedia !== "function") {
      setResolvedSystemTheme("light");
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setResolvedSystemTheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);

  const value = useMemo<CwaContextValue>(
    () => ({
      theme,
      resolvedTheme: resolvedSystemTheme,
      material,
      motion,
      density,
      locale,
      portalContainer,
      providerElement,
    }),
    [
      theme,
      resolvedSystemTheme,
      material,
      motion,
      density,
      locale,
      portalContainer,
      providerElement,
    ],
  );

  const attributes: Record<string, string> = {};
  const effectiveTheme = theme === "system" ? resolvedSystemTheme : theme;
  if (effectiveTheme) attributes["data-cwa-theme"] = effectiveTheme;
  if (material === "solid") attributes["data-cwa-material"] = "solid";
  if (motion !== "system") attributes["data-cwa-motion"] = motion;
  if (density !== "comfortable") attributes["data-cwa-density"] = density;

  const classNames = ["cwa-design-provider"];
  if (className) classNames.push(className);

  return (
    <CwaContext.Provider value={value}>
      <div ref={setProviderElement} className={classNames.join(" ")} style={style} {...attributes}>
        {children}
      </div>
    </CwaContext.Provider>
  );
}
