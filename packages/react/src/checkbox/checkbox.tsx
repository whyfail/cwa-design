"use client";

import type { CheckboxRootProps } from "@base-ui/react/checkbox";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ReactNode } from "react";

export type CheckboxProps = CheckboxRootProps & {
  /** 标签文本（与勾选框一起渲染在 label 内）。 */
  children?: ReactNode;
  className?: string;
};

/**
 * Checkbox：Base UI 行为源（Space 切换、indeterminate、原生表单提交的隐藏 input）。
 * 受控 checked / 非受控 defaultChecked 与 onCheckedChange 直接透传。
 */
export function Checkbox({ children, className, ...rest }: CheckboxProps) {
  return (
    <label className="cwa-design-checkbox">
      <BaseCheckbox.Root
        {...rest}
        className={className ? `cwa-design-checkbox__box ${className}` : "cwa-design-checkbox__box"}
      >
        <BaseCheckbox.Indicator className="cwa-design-checkbox__indicator">
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
            focusable="false"
            className="cwa-design-checkbox__check"
          >
            <path
              d="M2.5 6.5L5 9l4.5-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              className="cwa-design-checkbox__indeterminate"
              x="2.5"
              y="5.1"
              width="7"
              height="1.8"
              rx="0.9"
              fill="currentColor"
            />
          </svg>
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      {children != null ? <span className="cwa-design-checkbox__label">{children}</span> : null}
    </label>
  );
}
