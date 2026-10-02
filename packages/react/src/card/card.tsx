import type { HTMLAttributes, ReactNode } from "react";
import { Surface, type SurfaceMaterial } from "../surface/surface";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 默认 solid（内容层）；frosted 需要轻分离时使用；禁止 glass-on-glass。 */
  material?: Extract<SurfaceMaterial, "solid" | "frosted">;
  children?: ReactNode;
}

export function Card({ material = "solid", className, children, ...rest }: CardProps) {
  return (
    <Surface
      material={material}
      className={className ? `cwa-design-card ${className}` : "cwa-design-card"}
      {...rest}
    >
      {children}
    </Surface>
  );
}

export interface CardSectionProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function CardTitle({ className, children, ...rest }: CardSectionProps) {
  return (
    <div
      {...rest}
      className={className ? `cwa-design-card__title ${className}` : "cwa-design-card__title"}
    >
      {children}
    </div>
  );
}

export function CardDescription({ className, children, ...rest }: CardSectionProps) {
  return (
    <div
      {...rest}
      className={
        className ? `cwa-design-card__description ${className}` : "cwa-design-card__description"
      }
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...rest }: CardSectionProps) {
  return (
    <div
      {...rest}
      className={className ? `cwa-design-card__content ${className}` : "cwa-design-card__content"}
    >
      {children}
    </div>
  );
}

export function CardActions({ className, children, ...rest }: CardSectionProps) {
  return (
    <div
      {...rest}
      className={className ? `cwa-design-card__actions ${className}` : "cwa-design-card__actions"}
    >
      {children}
    </div>
  );
}
