"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import type { RadioGroupProps as BaseRadioGroupProps } from "@base-ui/react/radio-group";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";

export type CwaRadioGroupProps = BaseRadioGroupProps & { children?: ReactNode };

/** RadioGroup：单选组。方向键移动、组标签、隐藏 input 原生提交由 Base UI 提供。 */
export function RadioGroup({ className, ...rest }: CwaRadioGroupProps) {
  return <BaseRadioGroup {...rest} className={className ?? "cwa-design-radio-group"} />;
}

export interface RadioItemProps {
  value: string;
  /** 选项文本（label 内渲染）。 */
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function RadioItem({ value, children, disabled, className }: RadioItemProps) {
  return (
    <label className="cwa-design-radio">
      <BaseRadio.Root
        value={value}
        disabled={disabled}
        className={className ? `cwa-design-radio__circle ${className}` : "cwa-design-radio__circle"}
      >
        <BaseRadio.Indicator className="cwa-design-radio__indicator" />
      </BaseRadio.Root>
      {children != null ? <span className="cwa-design-radio__label">{children}</span> : null}
    </label>
  );
}
