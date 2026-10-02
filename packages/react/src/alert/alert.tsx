import type { HTMLAttributes, ReactNode } from "react";

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** 语义色调；状态由图标+文本共同传达，不只靠颜色。 */
  tone?: AlertTone;
  /** 标题行（必读信息）。 */
  title?: ReactNode;
  /** 补充说明。 */
  children?: ReactNode;
  /** 行内动作（真实按钮，非整块可点击）。 */
  action?: ReactNode;
}

const toneLabels: Record<AlertTone, string> = {
  info: "提示",
  success: "成功",
  warning: "警告",
  danger: "错误",
};

/** Alert：inline 状态块（T23）。warning/error 由文本与图标传达，role=alert 即时播报。 */
export function Alert({ tone = "info", title, children, action, className, ...rest }: AlertProps) {
  const classNames = ["cwa-design-alert", `cwa-design-alert--${tone}`];
  if (className) classNames.push(className);
  return (
    <div {...rest} role="alert" className={classNames.join(" ")}>
      <span className="cwa-design-alert__icon" aria-hidden="true">
        {tone === "success" ? "✓" : tone === "warning" ? "!" : tone === "danger" ? "✕" : "i"}
      </span>
      <span className="cwa-design-visually-hidden">{toneLabels[tone]}：</span>
      <div className="cwa-design-alert__body">
        {title ? <div className="cwa-design-alert__title">{title}</div> : null}
        {children ? <div className="cwa-design-alert__content">{children}</div> : null}
      </div>
      {action ? <div className="cwa-design-alert__action">{action}</div> : null}
    </div>
  );
}
