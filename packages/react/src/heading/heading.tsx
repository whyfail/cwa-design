import type { HTMLAttributes, ReactNode } from "react";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingVisualSize = "display" | "title" | "body";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** 实际 h1–h6 语义级别（文档大纲）。 */
  level: HeadingLevel;
  /** 视觉尺寸，可与 level 分别设定（语义与视觉解耦）。 */
  visualSize?: HeadingVisualSize;
  children?: ReactNode;
}

export function Heading({ level, visualSize, className, ...rest }: HeadingProps) {
  const size = visualSize ?? (level <= 2 ? "display" : "title");
  const classNames = ["cwa-design-heading", `cwa-design-heading--${size}`];
  if (className) classNames.push(className);
  const Tag = `h${level}` as const;
  return <Tag {...rest} className={classNames.join(" ")} />;
}
