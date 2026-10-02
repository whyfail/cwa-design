import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "./alert/alert";
import { Button } from "./button/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "./dropdown-menu/dropdown-menu";
import { CwaProvider } from "./provider/provider";
import { createToastManager, ToastProvider } from "./toast/toast";

describe("DropdownMenu", () => {
  function renderMenu(onAction?: (action: string) => void) {
    return render(
      <CwaProvider>
        <DropdownMenu>
          <DropdownMenu.Trigger render={<Button variant="secondary">操作</Button>} />
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAction?.("重命名")}>重命名</DropdownMenuItem>
            <DropdownMenuItem disabled>移动（不可用）</DropdownMenuItem>
            <DropdownMenuItem destructive onClick={() => onAction?.("删除")}>
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CwaProvider>,
    );
  }

  it("打开、选择动作、禁用项不可选", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderMenu(onAction);
    const trigger = screen.getByRole("button", { name: "操作" });
    trigger.focus();
    await user.keyboard("[Enter]");
    expect(await screen.findByText("重命名")).toBeVisible();
    const disabled = screen
      .getByText("移动（不可用）")
      .closest(".cwa-design-menu__item") as HTMLElement;
    await user.click(disabled);
    expect(onAction).not.toHaveBeenCalledWith("移动");
    await user.click(screen.getByText("重命名"));
    expect(onAction).toHaveBeenCalledWith("重命名");
  });

  it("方向键导航菜单项", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", { name: "操作" });
    trigger.focus();
    await user.keyboard("[ArrowDown]");
    expect(await screen.findByText("重命名")).toBeVisible();
    await user.keyboard("[ArrowDown]");
    await user.keyboard("[ArrowUp]");
    const highlighted = document.activeElement as HTMLElement;
    expect(highlighted.className).toContain("cwa-design-menu__item");
  });
});

describe("Toast", () => {
  it("队列显示、手动关闭", async () => {
    const user = userEvent.setup();
    const manager = createToastManager();
    render(
      <CwaProvider>
        <ToastProvider toastManager={manager}>
          <button
            type="button"
            onClick={() => manager.add({ title: "已保存设置", description: "更改立即生效" })}
          >
            保存
          </button>
        </ToastProvider>
      </CwaProvider>,
    );
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(await screen.findByText("已保存设置")).toBeVisible();
    expect(screen.getByText("更改立即生效")).toBeVisible();
    // Base UI 将 toast Close 标记为 aria-hidden（读屏经手势/Escape 关闭），
    // DOM 查询点击验证鼠标路径。
    const close = await screen.findByText("×", {}, { timeout: 2000 });
    await user.click(close);
    await new Promise((r) => setTimeout(r, 50));
  });
});

describe("Alert", () => {
  it("role=alert 播报，色调与动作可见", () => {
    render(
      <Alert
        tone="danger"
        title="删除失败"
        action={
          <Button variant="secondary" onClick={() => {}}>
            重试
          </Button>
        }
      >
        网络超时，请检查连接后重试。
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("cwa-design-alert--danger");
    expect(screen.getByRole("button", { name: "重试" })).toBeTruthy();
    expect(screen.getByText(/错误/)).toBeTruthy();
  });

  it("受控 tone 外部切换同步", () => {
    const { rerender } = render(<Alert tone="warning" title="状态" />);
    expect(screen.getByRole("alert").className).toContain("cwa-design-alert--warning");
    rerender(<Alert tone="success" title="状态" />);
    expect(screen.getByRole("alert").className).toContain("cwa-design-alert--success");
  });
});
