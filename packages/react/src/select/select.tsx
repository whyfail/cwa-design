"use client";

import type { SelectRootProps } from "@base-ui/react/select";
import { Select as BaseSelect } from "@base-ui/react/select";
import type { ReactNode } from "react";
import { OverlayPortalScope } from "../overlay/overlay-scope";
import { useCwaContext } from "../provider/provider";

export type SelectRootPropsAlias<Value extends string = string> = SelectRootProps<Value>;

/**
 * Select：基础单选（T18）。
 * typeahead、方向键、焦点返回、长列表滚动定位、隐藏 input 原生提交由 Base UI 提供。
 * 未知值：受控 value 不在选项中时显示 value 本身（不静默清除）。
 */
export const Select = Object.assign(
  function SelectRoot<Value extends string>({
    children,
    ...rest
  }: SelectRootProps<Value> & { children?: ReactNode }) {
    return <BaseSelect.Root<Value> {...rest}>{children}</BaseSelect.Root>;
  },
  {
    Trigger: BaseSelect.Trigger,
    Value: BaseSelect.Value,
    Icon: BaseSelect.Icon,
    Portal: BaseSelect.Portal,
    Positioner: BaseSelect.Positioner,
    Popup: BaseSelect.Popup,
    List: BaseSelect.List,
    Item: BaseSelect.Item,
    ItemText: BaseSelect.ItemText,
    ItemIndicator: BaseSelect.ItemIndicator,
    Group: BaseSelect.Group,
    GroupLabel: BaseSelect.GroupLabel,
  },
);

export interface SelectContentProps {
  children?: ReactNode;
  className?: string;
}

/** SelectContent：Portal + Positioner + Popup 的 CWA 组合（主题化 portal、solid 材质）。 */
export function SelectContent({ children, className }: SelectContentProps) {
  const { portalContainer } = useCwaContext();
  return (
    <BaseSelect.Portal container={portalContainer ?? undefined}>
      <OverlayPortalScope>
        <BaseSelect.Positioner sideOffset={6} className="cwa-design-select__positioner">
          <BaseSelect.Popup
            className={
              className ? `cwa-design-select__popup ${className}` : "cwa-design-select__popup"
            }
          >
            {children}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </OverlayPortalScope>
    </BaseSelect.Portal>
  );
}

export interface SelectItemProps {
  value: string;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SelectItem({ value, children, disabled, className }: SelectItemProps) {
  return (
    <BaseSelect.Item
      value={value}
      disabled={disabled}
      className={className ?? "cwa-design-select__item"}
    >
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="cwa-design-select__item-indicator">
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false" width="10" height="10">
          <path
            d="M2.5 6.5L5 9l4.5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}
