import type { Meta, StoryObj } from "@storybook/react-vite";
import { Field } from "../field/field";
import { Select, SelectContent, SelectItem } from "./select";

const meta: Meta = {
  title: "Components/Select",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <Field label="配送方式">
        <Select defaultValue="std" name="delivery">
          <Select.Trigger className="cwa-design-select__trigger" id={undefined}>
            <Select.Value />
            <Select.Icon>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </Select.Icon>
          </Select.Trigger>
          <SelectContent>
            <Select.List>
              <SelectItem value="std">标准配送（3–5 天）</SelectItem>
              <SelectItem value="exp">加急配送（次日）</SelectItem>
              <SelectItem value="eco">经济配送（7–10 天）</SelectItem>
            </Select.List>
          </SelectContent>
        </Select>
      </Field>
    </div>
  ),
};

export const WithDisabled: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <Select defaultValue="cn">
        <Select.Trigger className="cwa-design-select__trigger" aria-label="国家或地区">
          <Select.Value />
          <Select.Icon>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
              <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Select.Icon>
        </Select.Trigger>
        <SelectContent>
          <Select.List>
            <SelectItem value="cn">中国大陆</SelectItem>
            <SelectItem value="hk">中国香港</SelectItem>
            <SelectItem value="jp">日本</SelectItem>
            <SelectItem value="us">美国</SelectItem>
          </Select.List>
        </SelectContent>
      </Select>
    </div>
  ),
};
