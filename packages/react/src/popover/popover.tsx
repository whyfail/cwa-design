"use client";

import type { PopoverRootProps as BasePopoverRootProps } from "@base-ui/react/popover";
import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ReactNode } from "react";
import { OverlayPortalScope } from "../overlay/overlay-scope";
import { useCwaContext } from "../provider/provider";

export type PopoverRootProps = BasePopoverRootProps & { children?: ReactNode };

/**
 * Popover：非模态浮层（T21）。锚定、避碰、外部点击关闭、焦点返回由 Base UI 提供。
 * 材质固定 solid（浮层不叠玻璃，design-rules §2）。
 */
export const Popover = Object.assign(
  function PopoverRoot({ children, ...rest }: PopoverRootProps) {
    return <BasePopover.Root {...rest}>{children}</BasePopover.Root>;
  },
  {
    Trigger: BasePopover.Trigger,
    Close: BasePopover.Close,
    Title: BasePopover.Title,
    Description: BasePopover.Description,
  },
);

export interface PopoverContentProps {
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function PopoverContent({ children, className, ...rest }: PopoverContentProps) {
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
            className={className ? `cwa-design-popover ${className}` : "cwa-design-popover"}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </OverlayPortalScope>
    </BasePopover.Portal>
  );
}
