import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./segmented-control/segmented-control";
import { Slider } from "./slider/slider";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs/tabs";

describe("Slider", () => {
  it("键盘箭头调整数值，边界生效", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider
        defaultValue={40}
        min={0}
        max={100}
        step={10}
        onValueChange={onValueChange}
        aria-label="音量"
      />,
    );
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "40");
    slider.focus();
    await user.keyboard("[ArrowRight]");
    await user.keyboard("[ArrowRight]");
    expect(onValueChange).toHaveBeenLastCalledWith(60, expect.anything());
    await user.keyboard("[Home]");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
    await user.keyboard("[End]");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
  });
});

describe("Tabs", () => {
  it("点击切换面板；roving focus 焦点可达；隐藏面板不渲染内容", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="general">
        <TabsList aria-label="设置分区">
          <TabsTab value="general">通用</TabsTab>
          <TabsTab value="privacy">隐私</TabsTab>
        </TabsList>
        <TabsPanel value="general">
          <p>通用设置内容</p>
        </TabsPanel>
        <TabsPanel value="privacy">
          <p>隐私设置内容</p>
        </TabsPanel>
      </Tabs>,
    );
    expect(screen.getByText("通用设置内容")).toBeVisible();
    expect(screen.queryByText("隐私设置内容")).toBeNull();
    await user.click(screen.getByRole("tab", { name: "隐私" }));
    expect(screen.getByText("隐私设置内容")).toBeVisible();
    expect(screen.queryByText("通用设置内容")).toBeNull();
  });
});

describe("SegmentedControl", () => {
  it("radio 语义；选择同步；禁用项不可选", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="视图密度"
        defaultValue="comfortable"
        onValueChange={onValueChange}
        items={[
          { value: "compact", label: "紧凑" },
          { value: "comfortable", label: "舒适" },
          { value: "auto", label: "自动", disabled: true },
        ]}
      />,
    );
    const compact = screen.getByRole("radio", { name: "紧凑" });
    const comfortable = screen.getByRole("radio", { name: "舒适" });
    expect(comfortable).toBeChecked();
    await user.click(compact);
    expect(onValueChange).toHaveBeenCalledWith("compact");
    expect(compact).toBeChecked();
    expect(comfortable).not.toBeChecked();
    await user.click(screen.getByRole("radio", { name: "自动" }));
    expect(onValueChange).not.toHaveBeenCalledWith("auto");
  });
});
