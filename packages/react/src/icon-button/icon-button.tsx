"use client";

import { type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";

export type IconButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 必填的 accessible name（渲染为 aria-label）；无文本按钮必须有名称。 */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
  children?: ReactNode;
}

/**
 * IconButton：图标按钮。label 必填（无文本时必须有 accessible name），
 * 形状为圆形；常驻于 regular glass 浮层时使用 secondary/ghost（不叠玻璃）。
 */
export function IconButton(props: IconButtonProps) {
  const {
    label,
    variant = "secondary",
    size = "md",
    loading = false,
    disabled,
    className,
    children,
    ref,
    ...rest
  } = props;
  const isDisabled = disabled === true || loading;

  const classNames = [
    "cwa-design-icon-button",
    `cwa-design-icon-button--${variant}`,
    `cwa-design-icon-button--${size}`,
  ];
  if (className) classNames.push(className);

  return (
    <button
      {...rest}
      ref={ref}
      type={rest.type ?? "button"}
      className={classNames.join(" ")}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={label}
    >
      {children}
    </button>
  );
}
