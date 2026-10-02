"use client";

import type { Ref, TextareaHTMLAttributes } from "react";
import { useFieldControl } from "../field/field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

/** Textarea：多行输入。resize 默认 vertical；长内容随滚动增长不破坏布局。 */
export function Textarea({ id, invalid, className, ref, ...rest }: TextareaProps) {
  const field = useFieldControl();
  const textareaId = id ?? field?.inputId;
  const describedBy =
    [field?.descriptionId, field?.errorId, rest["aria-describedby"]].filter(Boolean).join(" ") ||
    undefined;
  const isInvalid = invalid ?? field?.errorId !== undefined;

  const classNames = ["cwa-design-textarea"];
  if (className) classNames.push(className);

  return (
    <textarea
      {...rest}
      ref={ref}
      id={textareaId}
      className={classNames.join(" ")}
      aria-invalid={isInvalid || undefined}
      aria-describedby={describedBy}
    />
  );
}
