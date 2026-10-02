"use client";

import type { TooltipRootProps } from "@base-ui/react/tooltip";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactNode } from "react";
import { OverlayPortalScope } from "../overlay/overlay-scope";
import { useCwaContext } from "../provider/provider";

export type CwaTooltipProps = TooltipRootProps & {
  /** 提示文本；纯文本即可，不放交互内容。 */
  content: ReactNode;
  children?: ReactNode;
};

/**
 * Tooltip：hover 与 focus 触发的说明（T21）。
 * Escape 关闭、延迟、定位避碰由 Base UI 提供。禁止放交互内容（用 Popover）。
 */
export function Tooltip({ content, children, ...rest }: CwaTooltipProps) {
  const { portalContainer } = useCwaContext();
  return (
    <BaseTooltip.Root {...rest}>
      <BaseTooltip.Trigger render={children as never} />
      <BaseTooltip.Portal container={portalContainer ?? undefined}>
        <OverlayPortalScope>
          <BaseTooltip.Positioner sideOffset={6} className="cwa-design-tooltip__positioner">
            <BaseTooltip.Popup className="cwa-design-tooltip">{content}</BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </OverlayPortalScope>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
