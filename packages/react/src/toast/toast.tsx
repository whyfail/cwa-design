"use client";

import type { ToastProviderProps } from "@base-ui/react/toast";
import { Toast as BaseToast } from "@base-ui/react/toast";
import type { ReactNode } from "react";
import { OverlayPortalScope } from "../overlay/overlay-scope";
import { useCwaContext } from "../provider/provider";

export type ToastProviderPropsAlias = ToastProviderProps;

function ToastViewportRenderer({ container }: { container: HTMLElement | null }) {
  const { toasts } = BaseToast.useToastManager();
  return (
    <BaseToast.Portal container={container ?? undefined}>
      <OverlayPortalScope>
        <BaseToast.Viewport className="cwa-design-toast-viewport">
          {toasts.map((toast) => (
            <BaseToast.Root key={toast.id} toast={toast} className="cwa-design-toast">
              <BaseToast.Content className="cwa-design-toast__content">
                <BaseToast.Title className="cwa-design-toast__title" />
                <BaseToast.Description className="cwa-design-toast__description" />
              </BaseToast.Content>
              {toast.actionProps ? <BaseToast.Action {...toast.actionProps} /> : null}
              <BaseToast.Close aria-label="关闭通知" className="cwa-design-toast__close">
                ×
              </BaseToast.Close>
            </BaseToast.Root>
          ))}
        </BaseToast.Viewport>
      </OverlayPortalScope>
    </BaseToast.Portal>
  );
}

/**
 * ToastProvider：队列、limit、timeout/pause（hover/focus 窗口暂停）由 Base UI 提供（T23）。
 * live region 语义由 Base UI 管理，避免重复朗读。业务侧经 createToastManager() 持有 manager
 * 并通过 toastManager prop 注入，用 manager.add() 触发通知。
 */
export function ToastProvider({
  children,
  ...rest
}: ToastProviderProps & { children?: ReactNode }) {
  const { portalContainer } = useCwaContext();
  return (
    <BaseToast.Provider {...rest}>
      {children}
      <ToastViewportRenderer container={portalContainer} />
    </BaseToast.Provider>
  );
}

export type ToastManager = ReturnType<typeof BaseToast.createToastManager>;

export const createToastManager = BaseToast.createToastManager;
export function useToastManager() {
  return BaseToast.useToastManager();
}
