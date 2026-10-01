import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
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
});
