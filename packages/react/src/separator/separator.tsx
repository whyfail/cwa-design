import type { HTMLAttributes } from "react";

export type SeparatorOrientation = "horizontal" | "vertical";

export interface SeparatorProps extends HTMLAttributes<HTMLHRElement | HTMLDivElement> {
  /** 纯装饰（默认）：hr，无 role；语义分隔（如分区）设为 false 以暴露 separator role。 */
  decorative?: boolean;
  orientation?: SeparatorOrientation;
}

/** Separator：默认 hr 装饰线；语义分隔暴露 role=separator + aria-orientation。 */
export function Separator({
  decorative = true,
  orientation = "horizontal",
  className,
  ...rest
}: SeparatorProps) {
  const classNames = ["cwa-design-separator", `cwa-design-separator--${orientation}`];
  if (className) classNames.push(className);
  if (decorative) {
    return <hr className={classNames.join(" ")} aria-hidden="true" {...rest} />;
  }
  return (
    <div
      {...rest}
      role="separator"
      aria-orientation={orientation}
      className={classNames.join(" ")}
    />
  );
}
