"use client";

import type { MenuRootProps } from "@base-ui/react/menu";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ReactNode } from "react";
import { FocusGuardScope, OverlayPortalScope } from "../overlay/overlay-scope";
import { useCwaContext } from "../provider/provider";

export type DropdownMenuRootProps = MenuRootProps & { children?: ReactNode };

/**
 * DropdownMenu：动作菜单（T22）。
 * 箭头/typeahead/禁用项/方向键导航/Escape 由 Base UI 提供。
 * 与 Select 的边界：Select 表达"选择值"，Menu 表达"触发动作"。
 * 默认 regular 玻璃；复杂背景或实际采样重叠时可选择 solid。
 */
export const DropdownMenu = Object.assign(
  function DropdownMenuRoot({ children, ...rest }: DropdownMenuRootProps) {
    return (
      <BaseMenu.Root {...rest}>
        <FocusGuardScope>{children}</FocusGuardScope>
      </BaseMenu.Root>
    );
  },
  {
    Trigger: BaseMenu.Trigger,
    Group: BaseMenu.Group,
    GroupLabel: BaseMenu.GroupLabel,
    SubmenuRoot: BaseMenu.SubmenuRoot,
    SubmenuTrigger: BaseMenu.SubmenuTrigger,
    Separator: BaseMenu.Separator,
    CheckboxItem: BaseMenu.CheckboxItem,
    RadioGroup: BaseMenu.RadioGroup,
    RadioItem: BaseMenu.RadioItem,
  },
);

export interface DropdownMenuContentProps {
  children?: ReactNode;
  className?: string;
  /** 默认 regular 玻璃。 */
  material?: "glass" | "solid";
}

export function DropdownMenuContent({
  children,
  className,
  material = "glass",
}: DropdownMenuContentProps) {
  const { portalContainer } = useCwaContext();
  return (
    <BaseMenu.Portal container={portalContainer ?? undefined}>
      <OverlayPortalScope>
        <BaseMenu.Positioner sideOffset={6} align="start" className="cwa-design-menu__positioner">
          <BaseMenu.Popup
            className={`cwa-design-menu cwa-design-menu--${material}${material === "glass" ? " cwa-design-material" : ""}${className ? ` ${className}` : ""}`}
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </OverlayPortalScope>
    </BaseMenu.Portal>
  );
}

export interface DropdownMenuItemProps {
  children?: ReactNode;
  disabled?: boolean;
  /** 快捷键提示（仅展示，不注册全局快捷键）。 */
  shortcut?: string;
  destructive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function DropdownMenuItem({
  children,
  disabled,
  shortcut,
  destructive,
  onClick,
  className,
}: DropdownMenuItemProps) {
  return (
    <BaseMenu.Item
      disabled={disabled}
      onClick={onClick}
      className={
        "cwa-design-menu__item" +
        (destructive ? " cwa-design-menu__item--destructive" : "") +
        (className ? ` ${className}` : "")
      }
    >
      <span className="cwa-design-menu__item-label">{children}</span>
      {shortcut ? <span className="cwa-design-menu__shortcut">{shortcut}</span> : null}
    </BaseMenu.Item>
  );
}
