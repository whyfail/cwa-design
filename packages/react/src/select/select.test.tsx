import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CwaProvider } from "../provider/provider";
import { Select, SelectContent, SelectItem } from "./select";

describe("Select", () => {
  function renderSelect(onValueChange?: (value: string) => void) {
    return render(
      <CwaProvider>
        <Select
          defaultValue="std"
          items={{ std: "标准配送", exp: "加急配送", same: "当日达" }}
          onValueChange={(value) => onValueChange?.(String(value))}
        >
          <Select.Trigger aria-label="配送方式">
            <Select.Value />
            <Select.Icon>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Select.Icon>
          </Select.Trigger>
          <SelectContent>
            <Select.List>
              <SelectItem value="std">标准配送</SelectItem>
              <SelectItem value="exp">加急配送</SelectItem>
              <SelectItem value="same" disabled>
                当日达
              </SelectItem>
            </Select.List>
          </SelectContent>
        </Select>
      </CwaProvider>,
    );
  }

  it("打开列表、选择项、关闭并更新显示", async () => {
    const user = userEvent.setup();
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "配送方式" });
    expect(trigger).toHaveTextContent("标准配送");
    trigger.focus();
    await user.keyboard("[Enter]");
    await user.click(screen.getByRole("option", { name: "加急配送" }));
    expect(trigger).toHaveTextContent("加急配送");
    expect(screen.queryByRole("option", { name: "加急配送" })).toBeNull();
  });

  it("onValueChange 回调与禁用项不可选", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect(onValueChange);
    const trigger = screen.getByRole("combobox", { name: "配送方式" });
    trigger.focus();
    await user.keyboard("[Enter]");
    const disabled = screen.getByRole("option", { name: "当日达" });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    await user.click(disabled);
    expect(onValueChange).not.toHaveBeenCalledWith("same");
  });

  it("键盘选择：方向键移动高亮，Enter 确认", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSelect(onValueChange);
    const trigger = screen.getByRole("combobox", { name: "配送方式" });
    trigger.focus();
    await user.keyboard("[Enter]");
    // 高亮从当前值 std 开始；一次向下到 exp（disabled 项会被跳过或不可确认）
    await user.keyboard("[ArrowDown]");
    await user.keyboard("[Enter]");
    expect(onValueChange).toHaveBeenCalledWith("exp");
    expect(trigger).toHaveTextContent("加急配送");
  });

  it("F04：默认触发器恰好一个展开指示图标", () => {
    render(
      <CwaProvider>
        <Select defaultValue="std" items={{ std: "标准配送" }}>
          <Select.Trigger aria-label="配送方式">
            <Select.Value />
          </Select.Trigger>
          <SelectContent>
            <SelectItem value="std">标准配送</SelectItem>
          </SelectContent>
        </Select>
      </CwaProvider>,
    );
    const trigger = screen.getByRole("combobox", { name: "配送方式" });
    expect(trigger.className).toContain("cwa-design-select__trigger");
    expect(trigger.querySelectorAll(".cwa-design-select__icon")).toHaveLength(1);
  });

  it("F04：自定义 Select.Icon 时不追加默认图标（避免重复）", () => {
    render(
      <CwaProvider>
        <Select defaultValue="std" items={{ std: "标准配送" }}>
          <Select.Trigger aria-label="配送方式">
            <Select.Value />
            <Select.Icon>
              <svg data-testid="custom-chevron" width="10" height="10" aria-hidden="true" />
            </Select.Icon>
          </Select.Trigger>
          <SelectContent>
            <SelectItem value="std">标准配送</SelectItem>
          </SelectContent>
        </Select>
      </CwaProvider>,
    );
    const trigger = screen.getByRole("combobox", { name: "配送方式" });
    // 自定义图标存在且默认 chevron 未注入（协议：自定义一个，不重复）。
    expect(trigger.querySelectorAll("[data-testid=custom-chevron]")).toHaveLength(1);
    expect(trigger.innerHTML).not.toContain("M2.5 4.5L6 8l3.5-3.5");
  });

  it("F04：render 接管时不注入默认图标，函数 className 合并", () => {
    render(
      <CwaProvider>
        <Select defaultValue="std" items={{ std: "标准配送" }}>
          <Select.Trigger
            aria-label="配送方式"
            className={(state) => (state.open ? "is-open" : "")}
            render={<button type="button" data-testid="custom-trigger" />}
          />
          <SelectContent>
            <SelectItem value="std">标准配送</SelectItem>
          </SelectContent>
        </Select>
      </CwaProvider>,
    );
    const trigger = document.querySelector("[data-testid=custom-trigger]")!;
    expect(trigger.className).toContain("cwa-design-select__trigger");
    expect(trigger.querySelectorAll(".cwa-design-select__icon")).toHaveLength(0);
  });
});
