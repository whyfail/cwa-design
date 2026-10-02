import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** 语义色调；状态必须由文本同时传达（不只靠颜色）。 */
  tone?: BadgeTone;
  /** 计数上限：超出显示 `${max}+`。 */
  max?: number;
  children?: ReactNode;
}

/** Badge：计数/状态标签。max 用于计数溢出；状态文本始终可读。 */
export function Badge({ tone = "neutral", max, className, children, ...rest }: BadgeProps) {
  const classNames = ["cwa-design-badge", `cwa-design-badge--${tone}`];
  if (className) classNames.push(className);
  const content =
    typeof children === "number" && typeof max === "number" && children > max
      ? `${max}+`
      : children;
  return (
    <span {...rest} className={classNames.join(" ")}>
      {content}
    </span>
  );
}
