import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../button/button";
import { CwaProvider } from "../provider/provider";
import { Sheet } from "./sheet";

describe("Sheet", () => {
  it("bottom sheet 打开/关闭，Escape 关闭并回调 false", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <CwaProvider>
        <Sheet onOpenChange={onOpenChange}>
          <Sheet.Trigger>打开抽屉</Sheet.Trigger>
          <Sheet.Content>
            <Sheet.Title>显示设置</Sheet.Title>
            <Sheet.Close render={<Button variant="secondary">关闭</Button>} />
          </Sheet.Content>
        </Sheet>
      </CwaProvider>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByText("打开抽屉"));
    expect(screen.getByRole("dialog", { name: "显示设置" })).toBeTruthy();
    await user.keyboard("[Escape]");
    expect(onOpenChange.mock.calls.some((c) => c[0] === false)).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("受控 open 外部管理", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <CwaProvider>
          <Sheet open={open} onOpenChange={setOpen} placement="end">
            <Sheet.Trigger>打开</Sheet.Trigger>
            <Sheet.Content>
              <Sheet.Title>侧栏</Sheet.Title>
              <Sheet.Close render={<Button variant="secondary">收起</Button>} />
            </Sheet.Content>
          </Sheet>
          <span>{open ? "开" : "关"}</span>
        </CwaProvider>
      );
    }
    render(<Demo />);
    await user.click(screen.getByText("打开"));
    expect(screen.getByText("开")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "收起" }));
    expect(screen.getByText("关")).toBeTruthy();
  });

  it("unmount 清理：关闭后 portal 内容移除", async () => {
    const user = userEvent.setup();
    render(
      <CwaProvider>
        <Sheet>
          <Sheet.Trigger>打开</Sheet.Trigger>
          <Sheet.Content>
            <p>内容</p>
          </Sheet.Content>
        </Sheet>
      </CwaProvider>,
    );
    await user.click(screen.getByText("打开"));
    expect(screen.getByText("内容")).toBeTruthy();
    await user.keyboard("[Escape]");
    expect(screen.queryByText("内容")).toBeNull();
  });

  it("拖动手柄提供键盘关闭替代并恢复触发器焦点", async () => {
    const user = userEvent.setup();
    render(
      <CwaProvider>
        <Sheet>
          <Sheet.Trigger>打开</Sheet.Trigger>
          <Sheet.Content>
            <Sheet.Title>键盘面板</Sheet.Title>
          </Sheet.Content>
        </Sheet>
      </CwaProvider>,
    );
    const trigger = screen.getByRole("button", { name: "打开" });
    await user.click(trigger);
    const grip = await screen.findByRole("button", { name: "关闭面板；拖动也可关闭" });
    grip.focus();
    await user.keyboard("[Enter]");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("Title/Description 自动附加组件类，排版不依赖宿主页面标题样式", async () => {
    const user = userEvent.setup();
    render(
      <CwaProvider>
        <Sheet>
          <Sheet.Trigger>打开</Sheet.Trigger>
          <Sheet.Content>
            <Sheet.Title className="host-title">排版隔离</Sheet.Title>
            <Sheet.Description>说明文字</Sheet.Description>
          </Sheet.Content>
        </Sheet>
      </CwaProvider>,
    );
    await user.click(screen.getByText("打开"));
    const title = screen.getByText("排版隔离");
    expect(title).toHaveClass("cwa-design-sheet__title");
    expect(title).toHaveClass("host-title");
    expect(screen.getByText("说明文字")).toHaveClass("cwa-design-sheet__description");
  });
});
