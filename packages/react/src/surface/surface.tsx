import type { HTMLAttributes, ReactNode } from "react";

export type SurfaceMaterial = "solid" | "frosted" | "glass" | "glass-clear";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** solid=实色内容层；frosted=厚磨砂（内容层）；glass=regular 玻璃（浮动层）；glass-clear 仅媒体控件且显式 opt-in。 */
  material?: SurfaceMaterial;
  children?: ReactNode;
}

/**
 * Surface：语义表面容器。材质选择遵循 design-rules §2：
 * 正文/表单默认 solid|frosted；regular glass 只给浮动功能层；禁止 glass-on-glass。
 */
export function Surface({ material = "solid", className, children, ...rest }: SurfaceProps) {
  const classNames = ["cwa-design-surface", `cwa-design-surface--${material}`];
  if (className) classNames.push(className);
  return (
    <div {...rest} className={classNames.join(" ")} data-cwa-surface={material}>
      {children}
    </div>
  );
}
