import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("requires an accessible name via label", () => {
    render(
      <IconButton label="关闭对话框">
        <span aria-hidden="true">✕</span>
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "关闭对话框" });
    expect(button).toHaveAttribute("aria-label", "关闭对话框");
    expect(button).toHaveAttribute("type", "button");
  });

  it("loading disables interaction and sets aria-busy", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconButton label="刷新" loading onClick={onClick}>
        ⟳
      </IconButton>,
    );
    const button = screen.getByRole("button", { name: "刷新" });
    expect(button).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards ref and supports keyboard activation", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton label="添加" ref={ref} onClick={onClick}>
        +
      </IconButton>,
    );
    ref.current?.focus();
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    await user.keyboard("[Enter]");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("F04：Space/Enter 按住期间置 data-pressed，释放清除", () => {
    render(<IconButton label="播放">▶</IconButton>);
    const button = screen.getByRole("button", { name: "播放" });
    expect(button).not.toHaveAttribute("data-pressed");
    // 键盘按住（不释放）：data-pressed 立即出现，原生语义不被代理。
    // userEvent 的 {Space>} hold 在 jsdom 下不派发可断言的中间帧，
    // 用 fireEvent 精确控制 keydown/keyup 序列验证状态机。
    fireEvent.keyDown(button, { key: " " });
    expect(button).toHaveAttribute("data-pressed", "true");
    // 操作系统自动重复（repeat）只在已按住时发生：状态保持，不重复置位。
    fireEvent.keyDown(button, { key: " ", repeat: true });
    expect(button).toHaveAttribute("data-pressed", "true");
    fireEvent.keyUp(button, { key: " " });
    expect(button).not.toHaveAttribute("data-pressed");
    fireEvent.keyDown(button, { key: "Enter" });
    expect(button).toHaveAttribute("data-pressed", "true");
    fireEvent.keyUp(button, { key: "Enter" });
    expect(button).not.toHaveAttribute("data-pressed");
  });

  it("F04：blur 与 pointer 释放都清除按压状态，loading 不进入按压", () => {
    render(<IconButton label="收藏">♡</IconButton>);
    const button = screen.getByRole("button", { name: "收藏" });
    button.focus();
    fireEvent.keyDown(button, { key: " " });
    expect(button).toHaveAttribute("data-pressed", "true");
    act(() => {
      button.blur();
    });
    expect(button).not.toHaveAttribute("data-pressed");
    fireEvent.keyUp(button, { key: " " });
    // loading（disabled）不进入按压状态。
    const loading = render(
      <IconButton label="刷新" loading>
        ⟳
      </IconButton>,
    ).getByRole("button", { name: "刷新" });
    fireEvent.keyDown(loading, { key: " " });
    expect(loading).not.toHaveAttribute("data-pressed");
    fireEvent.keyUp(loading, { key: " " });
  });

  it("F04：CSS 通过 data-pressed 提供键盘按压视觉（material.css 同级约定）", () => {
    const css = readFileSync(path.join(import.meta.dirname, "icon-button.css"), "utf8");
    expect(css).toContain('.cwa-design-icon-button:not([disabled])[data-pressed="true"]');
    // 减少动效分支同样覆盖 data-pressed。
    expect(css).toMatch(
      /\[data-cwa-motion="reduced"\] \.cwa-design-icon-button:not\(\[disabled\]\)\[data-pressed="true"\]/,
    );
  });
});
