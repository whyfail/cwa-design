import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders a native button with accessible text", () => {
    render(<Button>保存设置</Button>);
    const button = screen.getByRole("button", { name: "保存设置" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it("fires onClick on click and does not fire when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>保存</Button>);
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button onClick={onClick} disabled>
        保存
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("loading keeps the button non-interactive and declares aria-busy", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        提交中
      </Button>,
    );
    const button = screen.getByRole("button", { name: "提交中" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("sets data-pressed on pointerdown and clears on pointerup", async () => {
    const user = userEvent.setup();
    render(<Button>按压</Button>);
    const button = screen.getByRole("button", { name: "按压" });
    await user.pointer({ target: button, keys: "[MouseLeft>]" });
    expect(button).toHaveAttribute("data-pressed", "true");
    await user.pointer({ target: button, keys: "[/MouseLeft]" });
    expect(button).not.toHaveAttribute("data-pressed");
  });
});
