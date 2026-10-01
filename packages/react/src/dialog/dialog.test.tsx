import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../button/button";
import { CwaProvider } from "../provider/provider";
import { Dialog } from "./dialog";

function renderDialog(onOpenChange?: (open: boolean) => void) {
  return render(
    <CwaProvider theme="light">
      <Dialog open={undefined} onOpenChange={onOpenChange}>
        <Dialog.Trigger>打开设置</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>显示设置</Dialog.Title>
          <Dialog.Description>调整界面外观与动效。</Dialog.Description>
          <Dialog.Close>关闭</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    </CwaProvider>,
  );
}

describe("Dialog", () => {
  it("打开后渲染 title/description，关闭后移除", async () => {
    const user = userEvent.setup();
    const { queryByRole } = renderDialog();
    expect(queryByRole("dialog")).toBeNull();
    await user.click(screen.getByText("打开设置"));
    expect(screen.getByRole("dialog", { name: "显示设置" })).toBeTruthy();
    expect(screen.getByText("调整界面外观与动效。")).toBeTruthy();
    await user.click(screen.getByText("关闭"));
    expect(queryByRole("dialog")).toBeNull();
  });

  it("Escape 关闭并回调 onOpenChange(false)", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);
    await user.click(screen.getByText("打开设置"));
    await user.keyboard("[Escape]");
    expect(onOpenChange.mock.calls.some((c) => c[0] === false)).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("关闭后焦点恢复到触发器", async () => {
    const user = userEvent.setup();
    renderDialog();
    const trigger = screen.getByText("打开设置");
    await user.click(trigger);
    await user.click(screen.getByText("关闭"));
    expect(document.activeElement).toBe(trigger);
  });

  it("关闭途中重新打开不卡死（可中断性冒烟）", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);
    const trigger = screen.getByText("打开设置");
    await user.click(trigger);
    await user.keyboard("[Escape]");
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "显示设置" })).toBeTruthy();
    await user.keyboard("[Escape]");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("compound 内可使用 CWA Button 作为 Close", async () => {
    const user = userEvent.setup();
    render(
      <CwaProvider>
        <Dialog>
          <Dialog.Trigger render={<Button variant="primary">确认操作</Button>} />
          <Dialog.Content>
            <Dialog.Title>确认</Dialog.Title>
            <Dialog.Close render={<Button variant="secondary">取消</Button>} />
          </Dialog.Content>
        </Dialog>
      </CwaProvider>,
    );
    await user.click(screen.getByRole("button", { name: "确认操作" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
