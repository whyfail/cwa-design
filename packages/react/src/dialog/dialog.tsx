"use client";

import type { DialogRootProps as BaseDialogRootProps } from "@base-ui/react/dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { OverlayPortalScope } from "../overlay/overlay-scope";
import { useCwaContext } from "../provider/provider";

export interface DialogRootProps extends BaseDialogRootProps {
  children?: ReactNode;
}

export interface DialogContentProps {
  children?: ReactNode;
  className?: string;
  /** 覆盖默认（glass-thick）材质：浮层叠在玻璃层之上时应使用 solid。 */
  material?: "glass-thick" | "solid";
}

/**
 * Dialog：模态对话框（compound API）。
 * 焦点陷阱、Escape、滚动锁、焦点恢复、嵌套栈由 Base UI 提供（单一行为源，T10）。
 * 本层只负责：CWA 材质样式、主题化 portal、可中断进出动效（transform/opacity）。
 */
function DialogRoot({ children, ...rest }: DialogRootProps) {
  return <BaseDialog.Root {...rest}>{children}</BaseDialog.Root>;
}

function DialogContent({ children, className, material = "glass-thick" }: DialogContentProps) {
  const { portalContainer } = useCwaContext();
  return (
    <BaseDialog.Portal container={portalContainer ?? undefined}>
      <OverlayPortalScope>
        <BaseDialog.Backdrop className="cwa-design-dialog-backdrop" />
        <BaseDialog.Popup
          className={
            "cwa-design-dialog cwa-design-dialog--" + material + (className ? " " + className : "")
          }
        >
          {children}
        </BaseDialog.Popup>
      </OverlayPortalScope>
    </BaseDialog.Portal>
  );
}

function DialogTitle(props: React.ComponentProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title {...props} />;
}

function DialogDescription(props: React.ComponentProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description {...props} />;
}

function DialogClose(props: React.ComponentProps<typeof BaseDialog.Close>) {
  return <BaseDialog.Close {...props} />;
}

export const Dialog = Object.assign(DialogRoot, {
  Trigger: BaseDialog.Trigger,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
});
