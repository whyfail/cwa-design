import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox/checkbox";
import { RadioGroup, RadioItem } from "./radio-group/radio-group";
import { Switch } from "./switch/switch";

describe("Checkbox", () => {
  it("点击与 Space 切换；受控 onCheckedChange", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox name="notify" onCheckedChange={onCheckedChange}>
        接收通知
      </Checkbox>,
    );
    const box = screen.getByRole("checkbox", { name: "接收通知" });
    await user.click(box);
    await user.keyboard("[Space]");
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
    expect(box).not.toBeChecked();
  });

  it("indeterminate 状态由 data-indeterminate 标记", () => {
    render(
      <Checkbox indeterminate checked={false} name="parent">
        全选
      </Checkbox>,
    );
    expect(screen.getByRole("checkbox", { name: "全选" })).toHaveAttribute("data-indeterminate");
  });

  it("原生表单提交取到 name/value", async () => {
    const user = userEvent.setup();
    const state: { submitted: FormData | null } = { submitted: null };
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          state.submitted = new FormData(event.currentTarget);
        }}
      >
        <Checkbox name="subscribe" value="yes" defaultChecked>
          订阅
        </Checkbox>
        <button type="submit">提交</button>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "提交" }));
    expect(state.submitted?.get("subscribe")).toBe("yes");
  });
});

describe("RadioGroup", () => {
  it("选择后 aria-checked 同步；禁用项不可选", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup defaultValue="a" aria-label="配送方式">
        <RadioItem value="a">标准</RadioItem>
        <RadioItem value="b">加急</RadioItem>
        <RadioItem value="c" disabled>
          次日达
        </RadioItem>
      </RadioGroup>,
    );
    const standard = screen.getByRole("radio", { name: "标准" });
    const express = screen.getByRole("radio", { name: "加急" });
    expect(standard).toBeChecked();
    await user.click(express);
    expect(express).toBeChecked();
    expect(standard).not.toBeChecked();
    await user.click(screen.getByRole("radio", { name: "次日达" }));
    expect(express).toBeChecked();
  });

  it("方向键在组内移动选择", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup defaultValue="a" aria-label="尺寸">
        <RadioItem value="a">小</RadioItem>
        <RadioItem value="b">中</RadioItem>
      </RadioGroup>,
    );
    screen.getByRole("radio", { name: "小" }).focus();
    await user.keyboard("[ArrowDown]");
    expect(screen.getByRole("radio", { name: "中" })).toBeChecked();
  });
});

describe("Switch", () => {
  it("点击切换 aria-checked；受控状态外部同步", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [on, setOn] = useState(false);
      return (
        <Switch checked={on} onCheckedChange={setOn} name="dark">
          深色模式
        </Switch>
      );
    }
    render(<Demo />);
    const sw = screen.getByRole("switch", { name: "深色模式" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
    await user.keyboard("[Space]");
    expect(sw).toHaveAttribute("aria-checked", "false");
  });
});
