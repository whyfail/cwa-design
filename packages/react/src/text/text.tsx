import type { HTMLAttributes, ReactNode } from "react";

export type TextVariant = "body" | "caption";
export type TextTone = "default" | "muted";
export type TextElement = "span" | "p";

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** body=正文；caption=辅助文字（≥ 可读下限）。 */
  variant?: TextVariant;
  /** muted 传达次要信息；不单独用于错误/状态。 */
  tone?: TextTone;
  /** 语义元素；默认 span（行内），段落用 p。 */
  as?: TextElement;
  children?: ReactNode;
}

export function Text({
  variant = "body",
  tone = "default",
  as: Tag = "span",
  className,
  ...rest
}: TextProps) {
  const classNames = ["cwa-design-text", `cwa-design-text--${variant}`, `cwa-design-text--${tone}`];
  if (className) classNames.push(className);
  return <Tag {...rest} className={classNames.join(" ")} />;
}
