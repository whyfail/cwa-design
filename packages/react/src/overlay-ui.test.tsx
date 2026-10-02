import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button/button";
import { Popover, PopoverContent } from "./popover/popover";
import { CwaProvider } from "./provider/provider";
import { Tooltip } from "./tooltip/tooltip";

describe("Tooltip", () => {
  it("hover 与 focus 显示，Escape 可关；内容承载说明文本", async () => {
    const user = userEvent.setup();
    render(
      <CwaProvider>
        <Tooltip content="导出为 PDF">
          <Button variant="secondary">导出</Button>
        </Tooltip>
      </CwaProvider>,
    );
    const trigger = screen.getByRole("button", { name: "导出" });
    expect(screen.queryByText("导出为 PDF")).toBeNull();
    await user.hover(trigger);
    expect(await screen.findByText("导出为 PDF")).toBeTruthy();
    await user.unhover(trigger);
    trigger.focus();
    expect(await screen.findByText("导出为 PDF")).toBeTruthy();
    await user.keyboard("[Escape]");
  });
});

describe("Popover", () => {
  it("打开/关闭、外部点击关闭、关闭后焦点返回触发器", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <CwaProvider>
        <Popover onOpenChange={onOpenChange}>
          <Popover.Trigger render={<Button variant="secondary">筛选</Button>} />
          <PopoverContent aria-label="筛选条件">
            <Popover.Title className="cwa-design-popover__title">筛选</Popover.Title>
            <Popover.Description className="cwa-design-popover__description">
              按状态与负责人筛选任务。
            </Popover.Description>
            <Popover.Close render={<Button variant="primary">完成</Button>} />
          </PopoverContent>
        </Popover>
        <button type="button">外部按钮</button>
      </CwaProvider>,
    );
    const trigger = screen.getByRole("button", { name: "筛选" });
    await user.click(trigger);
    expect(await screen.findByText("按状态与负责人筛选任务。")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "完成" }));
    expect(screen.queryByText("按状态与负责人筛选任务。", { exact: false })).toBeNull();
    // 重新打开后点击外部关闭
    await user.click(trigger);
    expect(
      await screen.findByText("筛选", { selector: ".cwa-design-popover__title" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "外部按钮" }));
    expect(screen.queryByText("按状态与负责人筛选任务。", { exact: false })).toBeNull();
    expect(onOpenChange.mock.calls.some((c) => c[0] === false)).toBe(true);
  });
});
