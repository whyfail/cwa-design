"use client";

import type { SwitchRootProps } from "@base-ui/react/switch";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import type { ReactNode } from "react";

export type SwitchProps = SwitchRootProps & {
  /** 标签文本（与开关一起渲染在 label 内）。 */
  children?: ReactNode;
  className?: string;
};

/** Switch：二态开关。Base UI 行为源（键盘、aria-checked、隐藏 input 提交）。 */
export function Switch({ children, className, ...rest }: SwitchProps) {
  return (
    <label className="cwa-design-switch">
      <BaseSwitch.Root
        {...rest}
        className={className ? `cwa-design-switch__root ${className}` : "cwa-design-switch__root"}
      >
        <BaseSwitch.Thumb className="cwa-design-switch__thumb" />
      </BaseSwitch.Root>
      {children != null ? <span className="cwa-design-switch__label">{children}</span> : null}
    </label>
  );
}
