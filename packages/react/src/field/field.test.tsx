import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "../input/input";
import { Textarea } from "../textarea/textarea";
import { Field } from "./field";

describe("Field + Input 关联", () => {
  it("label 通过 htmlFor 与控件关联；description/error 进入 aria-describedby", () => {
    render(
      <Field label="显示名称" description="用于个人资料" error="不能为空">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("显示名称");
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(describedBy).toContain("description");
    expect(describedBy).toContain("error");
    expect(screen.getByText("不能为空")).toHaveAttribute("role", "alert");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("两个 Field 的 id 不冲突且渲染间稳定（SSR 安全前提）", () => {
    const { rerender } = render(
      <>
        <Field label="A">
          <Input />
        </Field>
        <Field label="B">
          <Input />
        </Field>
      </>,
    );
    const a = screen.getByLabelText("A");
    const b = screen.getByLabelText("B");
    expect(a.id).not.toBe(b.id);
    const aId = a.id;
    rerender(
      <>
        <Field label="A">
          <Input />
        </Field>
        <Field label="B">
          <Input />
        </Field>
      </>,
    );
    expect(screen.getByLabelText("A").id).toBe(aId);
  });

  it("required 渲染视觉标记且不代替原生 required", () => {
    render(
      <Field label="邮箱" required>
        <Input type="email" name="email" />
      </Field>,
    );
    const input = screen.getByLabelText(/邮箱/);
    expect(input.closest(".cwa-design-field")).toBeTruthy();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("原生 FormData 提交取到 name/value（原生表单不被破坏）", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      expect(data.get("displayName")).toBe("CWA 开发者");
    });
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Field label="显示名称">
          <Input name="displayName" defaultValue="CWA 开发者" />
        </Field>
        <button type="submit">提交</button>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "提交" }));
    void container;
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("受控 value 外部更新同步；composition 事件不被拦截", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [value, setValue] = useState("初始");
      return (
        <Field label="名称">
          <Input value={value} onChange={(event) => setValue(event.target.value)} />
        </Field>
      );
    }
    const { rerender } = render(<Demo />);
    const input = screen.getByLabelText<HTMLInputElement>("名称");
    await user.type(input, "追加");
    expect(input.value).toBe("初始追加");
    // 树根变化会重建 Field 实例（新 id/新节点）；受控值以新节点为准。
    rerender(
      <Field label="名称">
        <Input value="外部值" onChange={() => {}} />
      </Field>,
    );
    const controlled = screen.getByLabelText<HTMLInputElement>("名称");
    expect(controlled.value).toBe("外部值");

    const compositionStart = new Event("compositionstart", { bubbles: true });
    const compositionEnd = new Event("compositionend", { bubbles: true });
    controlled.dispatchEvent(compositionStart);
    controlled.dispatchEvent(compositionEnd);
    expect(controlled.value).toBe("外部值");
  });

  it("Textarea 同样关联且可编辑", async () => {
    const user = userEvent.setup();
    render(
      <Field label="简介" description="最多 200 字">
        <Textarea name="bio" rows={3} />
      </Field>,
    );
    const textarea = screen.getByLabelText("简介");
    expect(textarea.getAttribute("aria-describedby") ?? "").toContain("description");
    await user.type(textarea, "你好");
    expect(textarea).toHaveValue("你好");
  });
});
