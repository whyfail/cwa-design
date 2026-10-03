"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from "motion/react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { OverlayPortalScope } from "../overlay/overlay-scope";
import { useCwaContext } from "../provider/provider";

export type SheetPlacement = "bottom" | "end";

interface SheetState {
  open: boolean;
  setOpen: (open: boolean) => void;
  placement: SheetPlacement;
}

const SheetContext = createContext<SheetState | null>(null);

export interface SheetProps {
  /** 受控 open；缺省走内部状态。 */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** bottom=移动端底部抽屉；end=桌面侧滑（逻辑属性，RTL 自动镜像）。 */
  placement?: SheetPlacement;
  children?: ReactNode;
}

/**
 * Sheet：移动 bottom sheet 与桌面侧滑（T12，Alpha 范围）。
 * 焦点/Escape/滚动锁由 Base UI 提供；拖拽用 Motion（单展开位 + 拖动关闭）。
 * 多 snap points 为后续 API（主计划 T12 允许 Alpha 先交付单展开位）。
 */
function SheetRoot({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placement = "bottom",
  children,
}: SheetProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = openProp ?? internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  return (
    <SheetContext.Provider value={{ open, setOpen, placement }}>
      <BaseDialog.Root open={open} onOpenChange={setOpen}>
        {children}
      </BaseDialog.Root>
    </SheetContext.Provider>
  );
}

function useSheetState(): SheetState {
  const value = useContext(SheetContext);
  if (!value) throw new Error("Sheet 的子部件必须在 <Sheet> 内使用");
  return value;
}

export interface SheetContentProps {
  children?: ReactNode;
  className?: string;
  material?: "glass-thick" | "solid";
  /** 触发关闭的拖动位移阈值（px）。 */
  dismissThreshold?: number;
}

function SheetContent({
  children,
  className,
  material = "glass-thick",
  dismissThreshold = 96,
}: SheetContentProps) {
  const { portalContainer, motion: motionPreference } = useCwaContext();
  const { open, setOpen, placement } = useSheetState();
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = systemReducedMotion || motionPreference === "reduced";
  const isBottom = placement === "bottom";
  // Motion transform moves the material and contents together; CSS translate handles entrance.
  const dragOffset = useMotionValue(0);
  const dragControls = useDragControls();
  const [rtl, setRtl] = useState(false);
  const setDragElement = useCallback((element: HTMLDivElement | null) => {
    if (element) setRtl(getComputedStyle(element).direction === "rtl");
  }, []);
  const dragged = useRef(false);
  const settled = useRef(open);
  useEffect(() => {
    if (open && !settled.current) {
      dragOffset.set(0);
    }
    settled.current = open;
  }, [open, dragOffset]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    dragged.current = false;
    dragOffset.stop();
    dragControls.start(event);
  };

  const handlePointerCancel = () => {
    dragControls.cancel();
    dragOffset.stop();
    dragOffset.set(0);
    // Ignore a stray synthesized click after cancellation; a new pointer-down resets this.
    dragged.current = true;
  };

  const handleDragEnd = (
    _event: unknown,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } },
  ) => {
    const offset = isBottom ? info.offset.y : info.offset.x;
    const velocity = isBottom ? info.velocity.y : info.velocity.x;
    const sign = !isBottom && rtl ? -1 : 1;
    const dismissalVelocity = velocity * sign;
    const towardDismiss =
      dismissalVelocity > 700 ||
      (offset * sign > Math.max(0, dismissThreshold) && dismissalVelocity >= -150);
    if (towardDismiss) {
      setOpen(false);
      return;
    }
    if (reducedMotion) {
      dragOffset.set(0);
    } else {
      // 速度衔接：从当前位置带回弹预设复位（design-rules §3 sheet 预设）。
      animate(dragOffset, 0, { type: "spring", bounce: 0.15, duration: 0.35, velocity });
    }
  };

  return (
    <BaseDialog.Portal container={portalContainer ?? undefined}>
      <OverlayPortalScope>
        <BaseDialog.Backdrop className="cwa-design-sheet-backdrop" />
        <BaseDialog.Popup
          ref={setDragElement}
          render={
            <motion.div
              style={isBottom ? { y: dragOffset } : { x: dragOffset }}
              drag={isBottom ? "y" : "x"}
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
              dragConstraints={isBottom ? { top: 0 } : rtl ? { right: 0 } : { left: 0 }}
              dragElastic={0.12}
              onDragStart={() => {
                dragged.current = true;
              }}
              onDragEnd={handleDragEnd}
            />
          }
          className={
            "cwa-design-sheet cwa-design-sheet--" +
            placement +
            " cwa-design-sheet--" +
            material +
            (material === "glass-thick" ? " cwa-design-material cwa-design-material--thick" : "") +
            (className ? ` ${className}` : "")
          }
        >
          <div className="cwa-design-sheet__drag">
            <button
              type="button"
              className="cwa-design-sheet__grip"
              aria-label="关闭面板；拖动也可关闭"
              onPointerDown={handlePointerDown}
              onPointerCancel={handlePointerCancel}
              onClick={(event) => {
                if (event.detail === 0 || !dragged.current) setOpen(false);
              }}
            >
              <span className="cwa-design-sheet__handle" aria-hidden="true" />
            </button>
            {children}
          </div>
        </BaseDialog.Popup>
      </OverlayPortalScope>
    </BaseDialog.Portal>
  );
}

// 标题/说明自动附加组件类，排版由组件 CSS 决定，不依赖宿主页面的 heading 样式。
function SheetTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      {...props}
      className={
        typeof className === "function"
          ? (state) => `cwa-design-sheet__title ${className(state) ?? ""}`
          : `cwa-design-sheet__title${className ? ` ${className}` : ""}`
      }
    />
  );
}

function SheetDescription({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      {...props}
      className={
        typeof className === "function"
          ? (state) => `cwa-design-sheet__description ${className(state) ?? ""}`
          : `cwa-design-sheet__description${className ? ` ${className}` : ""}`
      }
    />
  );
}

export const Sheet = Object.assign(SheetRoot, {
  Trigger: BaseDialog.Trigger,
  Content: SheetContent,
  Close: BaseDialog.Close,
  Title: SheetTitle,
  Description: SheetDescription,
});
