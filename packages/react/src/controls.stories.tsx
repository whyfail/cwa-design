import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox/checkbox";
import { RadioGroup, RadioItem } from "./radio-group/radio-group";
import { Stack } from "./stack/stack";
import { Switch } from "./switch/switch";

const meta: Meta = {
  title: "Components/Controls",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

export const Checkboxes: Story = {
  render: () => (
    <Stack gap={2}>
      <Checkbox defaultChecked name="a">
        接收产品通知
      </Checkbox>
      <Checkbox indeterminate name="b">
        部分选中（父级）
      </Checkbox>
      <Checkbox disabled name="c">
        不可用
      </Checkbox>
    </Stack>
  ),
};

export const Radio: Story = {
  render: () => (
    <RadioGroup defaultValue="std" aria-label="配送方式">
      <RadioItem value="std">标准配送（3–5 天）</RadioItem>
      <RadioItem value="exp">加急配送（次日）</RadioItem>
      <RadioItem value="same" disabled>
        当日达（暂不可用）
      </RadioItem>
    </RadioGroup>
  ),
};

export const Switches: Story = {
  render: () => (
    <Stack gap={2}>
      <Switch defaultChecked name="dark">
        深色模式
      </Switch>
      <Switch name="beta">加入 Beta 计划</Switch>
      <Switch disabled name="locked">
        受企业策略管理
      </Switch>
    </Stack>
  ),
};
