"use client";

import type { InputHTMLAttributes, Ref } from "react";
import { useFieldControl } from "../field/field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 显式标记无效（缺省时由所在 Field 的 error 推导）。 */
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Input：原生 <input>。受控/非受控由 value/defaultValue 决定，不混用、不代理输入；
 * IME composition 完全交给原生行为（不拦截 Enter、不过滤）。
 * 位于 Field 内时自动关联 id/description/error。
 */
export function Input({ id, invalid, className, ref, ...rest }: InputProps) {
  const field = useFieldControl();
  const inputId = id ?? field?.inputId;
  const describedBy =
    [field?.descriptionId, field?.errorId, rest["aria-describedby"]].filter(Boolean).join(" ") ||
    undefined;
  const isInvalid = invalid ?? field?.errorId !== undefined;

  const classNames = ["cwa-design-input"];
  if (className) classNames.push(className);

  return (
    <input
      {...rest}
      ref={ref}
      id={inputId}
      className={classNames.join(" ")}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
    />
  );
}
