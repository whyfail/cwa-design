import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CwaProvider } from "./provider/provider";
import { AccountPanelRecipe } from "./recipes/account-panel";
import { AiWorkspaceRecipe } from "./recipes/ai-workspace";
import { SettingsRecipe } from "./recipes/settings";

describe("SettingsRecipe", () => {
  it("编辑后提交触发 onSave 与 Toast", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SettingsRecipe onSave={onSave} />);
    const input = screen.getByLabelText<HTMLInputElement>("显示名称");
    await user.clear(input);
    await user.type(input, "新名称");
    await user.click(screen.getByRole("button", { name: "保存设置" }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ displayName: "新名称" }));
    expect(await screen.findByText("已保存设置")).toBeVisible();
  });

  it("重置经确认 Dialog", async () => {
    const user = userEvent.setup();
    render(<SettingsRecipe initialValues={{ displayName: "自定义" }} />);
    const input = screen.getByLabelText<HTMLInputElement>("显示名称");
    expect(input.value).toBe("自定义");
    await user.click(screen.getByRole("button", { name: "重置…" }));
    await user.click(await screen.findByRole("button", { name: "确认重置" }));
    expect(input.value).toBe("CWA Developer");
  });
});

describe("AccountPanelRecipe", () => {
  it("渲染用户/计划与活动 fixture；loading 时显示骨架", () => {
    const { container, rerender } = render(<AccountPanelRecipe name="王梅" plan="Team" />);
    expect(screen.getByText("王梅")).toBeVisible();
    expect(screen.getByText("Team")).toBeVisible();
    expect(screen.getByText("更新了 API 密钥")).toBeVisible();
    rerender(<AccountPanelRecipe loading />);
    expect(container.querySelectorAll(".cwa-design-skeleton").length).toBeGreaterThan(0);
    expect(screen.queryByText("更新了 API 密钥")).toBeNull();
  });

  it("Tabs 切换到账单面板", async () => {
    const user = userEvent.setup();
    render(<AccountPanelRecipe />);
    await user.click(screen.getByRole("tab", { name: "账单" }));
    expect(screen.getByText(/下一期账单/)).toBeVisible();
  });

  it("账户动作调用宿主并显示反馈；未接入的动作有本地反馈", async () => {
    const user = userEvent.setup();
    const onManageSubscription = vi.fn();
    render(<AccountPanelRecipe onManageSubscription={onManageSubscription} />);
    await user.click(screen.getByRole("button", { name: "管理订阅" }));
    expect(onManageSubscription).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("已请求管理订阅");
    await user.click(screen.getByRole("button", { name: "账户操作" }));
    await user.click(await screen.findByRole("menuitem", { name: "账户设置" }));
    expect(screen.getByRole("status")).toHaveTextContent("账户设置演示");
  });
});

describe("AiWorkspaceRecipe", () => {
  it("渲染消息 fixture 与工具状态徽标；打开会话详情 Sheet", async () => {
    const user = userEvent.setup();
    render(<AiWorkspaceRecipe />);
    expect(screen.getByText(/5 条验收标准/)).toBeVisible();
    expect(screen.getByText("工具 已完成")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "会话详情" }));
    expect(await screen.findByRole("dialog", { name: "会话详情" })).toBeVisible();
    await user.click(await screen.findByRole("button", { name: "关闭" }));
  });

  it("发送非空消息，追加本地会话并清空输入，不伪造模型回复", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<AiWorkspaceRecipe messages={[]} onSend={onSend} />);
    const send = screen.getByRole("button", { name: "发送" });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText("消息"), "  新消息  ");
    await user.click(send);
    expect(onSend).toHaveBeenCalledWith("新消息");
    expect(screen.getByText("新消息")).toBeVisible();
    expect(screen.getByLabelText("消息")).toHaveValue("");
    expect(send).toBeDisabled();
    expect(screen.queryByText("助手")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("消息已提交给应用");
  });

  it("附件选择与清除调用宿主并显示文件名", async () => {
    const user = userEvent.setup();
    const onAttach = vi.fn();
    render(<AiWorkspaceRecipe onAttach={onAttach} />);
    const file = new File(["sample"], "需求.txt", { type: "text/plain" });
    await user.upload(screen.getByLabelText("选择本地附件"), file);
    expect(onAttach).toHaveBeenLastCalledWith([file]);
    expect(screen.getByText(/本地附件：需求.txt/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "清除附件" }));
    expect(onAttach).toHaveBeenLastCalledWith([]);
    expect(screen.queryByText(/本地附件：/)).toBeNull();
  });
});

describe("Recipe scope", () => {
  it("已有Provider时继承dark/solid，包括Portal中的对话框", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CwaProvider theme="dark" material="solid">
        <SettingsRecipe />
      </CwaProvider>,
    );
    expect(container.querySelectorAll(".cwa-design-provider")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "重置…" }));
    const dialog = await screen.findByRole("dialog", { name: "重置为默认值？" });
    const scope = dialog.closest(".cwa-design-portal-scope");
    expect(scope).toHaveAttribute("data-cwa-theme", "dark");
    expect(scope).toHaveAttribute("data-cwa-material", "solid");
    await user.click(within(dialog).getByRole("button", { name: "确认重置" }));
  });

  it("其他recipes继承已有Provider且保持独立可用", () => {
    const { container } = render(
      <CwaProvider theme="dark">
        <AccountPanelRecipe />
        <AiWorkspaceRecipe />
      </CwaProvider>,
    );
    expect(container.querySelectorAll(".cwa-design-provider")).toHaveLength(1);
  });
});
