import type { HTMLAttributes } from "react";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** 状态名称（visually-hidden 播报）；缺省仅作 busy 装饰。 */
  label?: string;
  size?: "sm" | "md" | "lg";
}

/** Spinner：进行中反馈。role=status + 可选名称；reduced-motion 下降速仍表示进行中。 */
export function Spinner({ label, size = "md", className, ...rest }: SpinnerProps) {
  const classNames = ["cwa-design-spinner", `cwa-design-spinner--${size}`];
  if (className) classNames.push(className);
  return (
    <span {...rest} role={label ? "status" : undefined} className={classNames.join(" ")}>
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        focusable="false"
        className="cwa-design-spinner__svg"
      >
        <circle
          cx="10"
          cy="10"
          r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="38 16"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="cwa-design-visually-hidden">{label}</span> : null}
    </span>
  );
}
