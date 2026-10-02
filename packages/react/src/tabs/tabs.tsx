"use client";

import type { TabsRootProps } from "@base-ui/react/tabs";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

export type CwaTabsProps = TabsRootProps & { children?: ReactNode };

/**
 * Tabs：内容面板切换（T20）。
 * roving focus、manual/auto 激活（activationMode）、panel 关联由 Base UI 提供。
 * 不可见面板不抢焦点：隐藏 Panel 默认 inert（Base UI 行为）。
 */
export const Tabs = Object.assign(
  function TabsRoot({ children, ...rest }: CwaTabsProps) {
    return <BaseTabs.Root {...rest}>{children}</BaseTabs.Root>;
  },
  {
    List: BaseTabs.List,
    Tab: BaseTabs.Tab,
    Panel: BaseTabs.Panel,
    Indicator: BaseTabs.Indicator,
  },
);

export interface TabsListProps {
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function TabsList({ children, className, ...rest }: TabsListProps) {
  return (
    <BaseTabs.List
      {...rest}
      className={className ? `cwa-design-tabs__list ${className}` : "cwa-design-tabs__list"}
    >
      {children}
    </BaseTabs.List>
  );
}

export interface TabsTabProps {
  value: string;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function TabsTab({ value, children, disabled, className }: TabsTabProps) {
  return (
    <BaseTabs.Tab
      value={value}
      disabled={disabled}
      className={className ? `cwa-design-tabs__tab ${className}` : "cwa-design-tabs__tab"}
    >
      {children}
    </BaseTabs.Tab>
  );
}

export interface TabsPanelProps {
  value: string;
  children?: ReactNode;
  className?: string;
}

export function TabsPanel({ value, children, className }: TabsPanelProps) {
  return (
    <BaseTabs.Panel
      value={value}
      className={className ? `cwa-design-tabs__panel ${className}` : "cwa-design-tabs__panel"}
    >
      {children}
    </BaseTabs.Panel>
  );
}
