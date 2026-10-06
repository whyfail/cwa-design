"use client";

import type {
  ButtonHTMLAttributes,
  FocusEvent,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
  Ref,
} from "react";
import { useCallback, useState } from "react";

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
 * pointer-down 与键盘按住（Space/Enter）都立即给 data-pressed 反馈；键盘激活
 * 保持原生语义（Enter keydown / Space keyup 各触发一次原生 click，不代理）。
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
      // Space/Enter 按住期间保持按压视觉；repeat 不重复置位。
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
      data-pressed={pressed ? "true" : undefined}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={label}
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
      {children}
    </button>
  );
}
