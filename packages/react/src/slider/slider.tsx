"use client";

import type { SliderRootProps } from "@base-ui/react/slider";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import type { ReactNode } from "react";

export type CwaSliderProps = SliderRootProps & { children?: ReactNode };

/**
 * Slider：单值滑块（T19）。
 * 箭头/Home/End、aria-valuenow、拖动中断、触摸滚动协调由 Base UI 提供。
 * 数值语义：aria-valuetext 由调用方按 locale 提供（数值显示与数据分离）。
 */
export function Slider({ children, className, ...rest }: CwaSliderProps) {
  return (
    <BaseSlider.Root {...rest}>
      <BaseSlider.Control className={className ?? "cwa-design-slider__control"}>
        <BaseSlider.Track className="cwa-design-slider__track">
          <BaseSlider.Indicator className="cwa-design-slider__indicator" />
          <BaseSlider.Thumb className="cwa-design-slider__thumb" />
        </BaseSlider.Track>
      </BaseSlider.Control>
      {children}
    </BaseSlider.Root>
  );
}
