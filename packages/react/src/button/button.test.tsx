import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
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

  it("forwards ref to the native button element (React 19 ref prop)", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>引用</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe("引用");
  });

  it("type=submit submits the surrounding native form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">提交表单</Button>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "提交表单" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("activates via keyboard Enter/Space like a native button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>键盘激活</Button>);
    const button = screen.getByRole("button", { name: "键盘激活" });
    button.focus();
    await user.keyboard("[Enter]");
    await user.keyboard("[Space]");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("external controlled loading update disables the button", () => {
    const { rerender } = render(<Button>开始</Button>);
    rerender(<Button loading>开始</Button>);
    expect(screen.getByRole("button", { name: "开始" })).toBeDisabled();
  });
});
