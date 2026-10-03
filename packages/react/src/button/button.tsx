"use client";

import {
  type ButtonHTMLAttributes,
  type FocusEvent,
  type KeyboardEvent,
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
 * pointer-down 与键盘按住（Space/Enter）都立即给 data-pressed 反馈，click 提交动作；
 * loading 期间不触发 onClick。键盘 Space/Enter 激活由原生控件提供，不做代理。
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
    onKeyDown,
    onKeyUp,
    onBlur,
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
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      // 键盘按住与鼠标按下等价：Space/Enter 按住期间保持按压视觉。
      if (!isDisabled && !event.repeat && (event.key === " " || event.key === "Enter")) {
        setPressed(true);
      }
      onKeyDown?.(event);
    },
    [isDisabled, onKeyDown],
  );
  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === " " || event.key === "Enter") setPressed(false);
      onKeyUp?.(event);
    },
    [onKeyUp],
  );
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLButtonElement>) => {
      setPressed(false);
      onBlur?.(event);
    },
    [onBlur],
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
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={handleBlur}
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
