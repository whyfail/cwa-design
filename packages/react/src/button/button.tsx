"use client";

import {
  type ButtonHTMLAttributes,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useState,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉变体。primary 为页面主操作。 */
  variant?: ButtonVariant;
  /** 尺寸；compact 密度由 CwaProvider 控制，不在 size 上重复表达。 */
  size?: ButtonSize;
  /** 加载中：按钮不可交互，保留宽度并声明 aria-busy。 */
  loading?: boolean;
  children?: ReactNode;
}

/**
 * Button：原生 <button> 语义，pointer-down 立即反馈，click 才提交动作。
 * Spike 版本（T02 兼容性验证用）；完整切片在 T07 交付。
 */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    type = "button",
    className,
    children,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onClick,
    ...rest
  } = props;
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled === true || loading;

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!isDisabled && event.isPrimary) setPressed(true);
      onPointerDown?.(event);
    },
    [isDisabled, onPointerDown],
  );
  const releasePress = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      setPressed(false);
      onPointerUp?.(event);
    },
    [onPointerUp],
  );

  const classNames = [
    "cwa-design-button",
    `cwa-design-button--${variant}`,
    `cwa-design-button--${size}`,
  ];
  if (className) classNames.push(className);

  return (
    <button
      {...rest}
      type={type}
      className={classNames.join(" ")}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      data-pressed={pressed ? "true" : undefined}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={releasePress}
      onPointerLeave={(event) => {
        setPressed(false);
        onPointerLeave?.(event);
      }}
      onPointerCancel={(event) => {
        setPressed(false);
        onPointerCancel?.(event);
      }}
      onClick={(event) => {
        if (loading) return;
        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}
