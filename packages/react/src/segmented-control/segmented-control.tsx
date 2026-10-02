"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";

export interface SegmentedControlItem {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps {
  /** 互斥选项（小规模，2–5 个）。 */
  items: SegmentedControlItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 无可见组标签时的可访问名称。 */
  "aria-label"?: string;
  className?: string;
}

/**
 * SegmentedControl：小规模互斥设置，radio-group 语义（T20，主计划决策）。
 * 切换内容面板请用 Tabs；方向键移动与隐藏 input 提交由 Base UI 提供。
 */
export function SegmentedControl({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  ...rest
}: SegmentedControlProps) {
  return (
    <BaseRadioGroup
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(String(next))}
      className={className ? `cwa-design-segmented ${className}` : "cwa-design-segmented"}
      {...rest}
    >
      {items.map((item) => (
        <label key={item.value} className="cwa-design-segmented__item">
          <BaseRadio.Root
            value={item.value}
            disabled={item.disabled}
            className="cwa-design-segmented__input"
          />
          <span className="cwa-design-segmented__label">{item.label}</span>
        </label>
      ))}
    </BaseRadioGroup>
  );
}
