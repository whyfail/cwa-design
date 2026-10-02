import type { Meta, StoryObj } from "@storybook/react-vite";
import { SegmentedControl } from "./segmented-control/segmented-control";
import { Slider } from "./slider/slider";
import { Stack } from "./stack/stack";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs/tabs";
import { Text } from "./text/text";

const meta: Meta = {
  title: "Components/Navigation",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

export const TabsStory: Story = {
  name: "Tabs（内容面板切换）",
  render: () => (
    <div style={{ width: 420 }}>
      <Tabs defaultValue="general">
        <TabsList aria-label="设置分区">
          <TabsTab value="general">通用</TabsTab>
          <TabsTab value="appearance">外观</TabsTab>
          <TabsTab value="privacy">隐私</TabsTab>
        </TabsList>
        <TabsPanel value="general">
          <Text as="p">通用设置：启动页、默认工作区、语言。</Text>
        </TabsPanel>
        <TabsPanel value="appearance">
          <Text as="p">外观设置：主题、材质、动效偏好。</Text>
        </TabsPanel>
        <TabsPanel value="privacy">
          <Text as="p">隐私设置：遥测与数据共享。</Text>
        </TabsPanel>
      </Tabs>
    </div>
  ),
};

export const Segmented: Story = {
  name: "SegmentedControl（radio 语义）",
  render: () => (
    <Stack gap={4}>
      <SegmentedControl
        aria-label="视图密度"
        defaultValue="comfortable"
        items={[
          { value: "compact", label: "紧凑" },
          { value: "comfortable", label: "舒适" },
          { value: "spacious", label: "宽松" },
        ]}
      />
    </Stack>
  ),
};

export const SliderStory: Story = {
  name: "Slider（单值）",
  render: () => (
    <div style={{ width: 320 }}>
      <Slider defaultValue={60} min={0} max={100} step={5} aria-label="提示音音量" />
    </div>
  ),
};
