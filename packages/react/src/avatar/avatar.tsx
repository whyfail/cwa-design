"use client";

import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import type { ReactNode } from "react";

export interface AvatarProps {
  /** 图片地址；加载失败或缺失时回退。 */
  src?: string;
  /** 图片 alt；缺失 alt 时标记为装饰性。 */
  alt?: string;
  /** 回退内容（通常是姓名首字）。 */
  fallback?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Avatar：图片失败/缺失回退不跳布局（固定几何 + Base UI 回退时序）。 */
export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const classNames = ["cwa-design-avatar", `cwa-design-avatar--${size}`];
  if (className) classNames.push(className);
  return (
    <BaseAvatar.Root className={classNames.join(" ")}>
      {src ? <BaseAvatar.Image src={src} alt={alt} /> : null}
      <BaseAvatar.Fallback className="cwa-design-avatar__fallback" delay={alt ? 300 : 0}>
        {src && alt ? <span className="cwa-design-visually-hidden">{alt}</span> : fallback}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
