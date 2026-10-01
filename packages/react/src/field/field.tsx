import { createContext, type ReactNode, useContext, useId } from "react";

export interface FieldControlAssociation {
  inputId: string | undefined;
  descriptionId: string | undefined;
  errorId: string | undefined;
}

const FieldContext = createContext<FieldControlAssociation | null>(null);

/** 控件（Input/Textarea/自定义）读取 Field 的关联 ID；无 Field 时为 null。 */
export function useFieldControl(): FieldControlAssociation | null {
  return useContext(FieldContext);
}

export interface FieldProps {
  /** 可见标签（必填；纯 placeholder 不能替代 label）。 */
  label: string;
  /** 辅助说明，与控件 aria-describedby 关联。 */
  description?: string;
  /** 错误信息；出现即标记 aria-invalid 并以 role=alert 播报。 */
  error?: string;
  /** 必填标记（视觉 * + 原生 required 由控件自身属性决定）。 */
  required?: boolean;
  /** 显式控件 id；缺省由 useId 生成（SSR 前后稳定）。 */
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Field：label/description/error 与控件的稳定关联。
 * 关联 ID 通过 context 传给内部控件，不要求 children 手动接线。
 */
export function Field({
  label,
  description,
  error,
  required = false,
  id,
  className,
  children,
}: FieldProps) {
  const uid = useId();
  const inputId = id ?? uid;
  const descriptionId = description ? `${uid}-description` : undefined;
  const errorId = error ? `${uid}-error` : undefined;

  const classNames = ["cwa-design-field"];
  if (className) classNames.push(className);

  return (
    <FieldContext.Provider value={{ inputId, descriptionId, errorId }}>
      <div className={classNames.join(" ")}>
        <label className="cwa-design-field__label" htmlFor={inputId}>
          {label}
          {required ? (
            <span className="cwa-design-field__required" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {description ? <p className="cwa-design-field__description">{description}</p> : null}
        {children}
        {error ? (
          <p className="cwa-design-field__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
