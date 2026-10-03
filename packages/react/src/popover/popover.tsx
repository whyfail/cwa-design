"use client";

import type { PopoverRootProps as BasePopoverRootProps } from "@base-ui/react/popover";
import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps, ReactNode } from "react";
import { FocusGuardScope, OverlayPortalScope } from "../overlay/overlay-scope";
import { useCwaContext } from "../provider/provider";

export type PopoverRootProps = BasePopoverRootProps & { children?: ReactNode };

/**
 * Popover：非模态浮层（T21）。锚定、避碰、外部点击关闭、焦点返回由 Base UI 提供。
 * 默认 regular 玻璃；复杂背景或实际采样重叠时可选择 solid。
 */
export const Popover = Object.assign(
  function PopoverRoot({ children, ...rest }: PopoverRootProps) {
    return (
      <BasePopover.Root {...rest}>
        <FocusGuardScope>{children}</FocusGuardScope>
      </BasePopover.Root>
    );
  },
  {
    Trigger: BasePopover.Trigger,
    Close: BasePopover.Close,
    Title: function PopoverTitle({
      className,
      ...props
    }: ComponentProps<typeof BasePopover.Title>) {
      return (
        <BasePopover.Title
          {...props}
          className={
            typeof className === "function"
              ? (state) => `cwa-design-popover__title ${className(state) ?? ""}`
              : `cwa-design-popover__title${className ? ` ${className}` : ""}`
          }
        />
      );
    },
    Description: function PopoverDescription({
      className,
      ...props
    }: ComponentProps<typeof BasePopover.Description>) {
      return (
        <BasePopover.Description
          {...props}
          className={
            typeof className === "function"
              ? (state) => `cwa-design-popover__description ${className(state) ?? ""}`
              : `cwa-design-popover__description${className ? ` ${className}` : ""}`
          }
        />
      );
    },
  },
);

export interface PopoverContentProps {
  children?: ReactNode;
  className?: string;
  /** 默认 regular 玻璃；solid 用于需要稳定底色的内容。 */
  material?: "glass" | "solid";
  "aria-label"?: string;
}

export function PopoverContent({
  children,
  className,
  material = "glass",
  ...rest
}: PopoverContentProps) {
  const { portalContainer } = useCwaContext();
  return (
    <BasePopover.Portal container={portalContainer ?? undefined}>
      <OverlayPortalScope>
        <BasePopover.Positioner
          sideOffset={6}
          align="start"
          className="cwa-design-popover__positioner"
        >
          <BasePopover.Popup
            {...rest}
            className={`cwa-design-popover cwa-design-popover--${material}${material === "glass" ? " cwa-design-material" : ""}${className ? ` ${className}` : ""}`}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </OverlayPortalScope>
    </BasePopover.Portal>
  );
}
