import type { CSSProperties, HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** 占位几何：圆角矩形默认；文本行高度随 rem 缩放。 */
  width?: number | string;
  height?: number | string;
  radius?: number | string;
}

/** Skeleton：固定占位几何，防布局跳动；aria-hidden（占位非内容）。reduce 关闭闪烁。 */
export function Skeleton({
  width,
  height = "1rem",
  radius,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const classNames = ["cwa-design-skeleton"];
  if (className) classNames.push(className);
  const styles: CSSProperties = { width, height, borderRadius: radius, ...style };
  return <div {...rest} aria-hidden="true" className={classNames.join(" ")} style={styles} />;
}
