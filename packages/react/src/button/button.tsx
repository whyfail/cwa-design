"use client";

import {
  type ButtonHTMLAttributes,
  type PointerEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useState,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉变体。primary 为页面主操作。 */
  variant?: ButtonVariant;
  /** 尺寸；md 常规点击目标 44px 高，sm 用于紧凑/玻璃层场景。 */
  size?: ButtonSize;
  /** 加载中：不可交互、aria-busy、显示指示器；保留宽度。 */
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
  children?: ReactNode;
}

/**
 * Button：原生 <button> 语义（保留 type/submit/表单提交）。
 * pointer-down 立即反馈，click 提交动作；loading 期间不触发 onClick。
 * 键盘 Space/Enter 激活由原生控件提供，不做代理。
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
    ref,
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
      ref={ref}
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
      {loading ? (
        <svg
          className="cwa-design-button__spinner"
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="28 14"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
