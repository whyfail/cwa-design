import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
});
