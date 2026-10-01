import type { CSSProperties, HTMLAttributes } from "react";

export type StackDirection = "row" | "column";
/** 对应 Token space 刻度（1=0.25rem … 8=3rem）。 */
export type StackGap = 1 | 2 | 3 | 4 | 5 | 6 | 8;

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  gap?: StackGap;
  wrap?: boolean;
  children?: React.ReactNode;
}

/** Stack：横/纵排列。gap 用 Token 刻度，逻辑属性友好（RTL 天然正确）。 */
export function Stack({
  direction = "column",
  gap = 4,
  wrap = false,
  className,
  style,
  ...rest
}: StackProps) {
  const classNames = ["cwa-design-stack"];
  if (className) classNames.push(className);
  const styles: CSSProperties = {
    ...style,
    flexDirection: direction,
    flexWrap: wrap ? "wrap" : "nowrap",
    gap: `calc(var(--cwa-design-space-1) * ${gap})`,
  };
  return (
    <div {...rest} className={classNames.join(" ")} data-direction={direction} style={styles} />
  );
}
