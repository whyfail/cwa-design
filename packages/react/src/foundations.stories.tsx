import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./avatar/avatar";
import { Badge } from "./badge/badge";
import { Button } from "./button/button";
import { Card, CardActions, CardContent, CardDescription, CardTitle } from "./card/card";
import { Separator } from "./separator/separator";
import { Skeleton } from "./skeleton/skeleton";
import { Spinner } from "./spinner/spinner";
import { Stack } from "./stack/stack";
import { Text } from "./text/text";

const meta: Meta = {
  title: "Components/Foundations",
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj;

export const Badges: Story = {
  render: () => (
    <Stack direction="row" gap={3}>
      <Badge>默认</Badge>
      <Badge tone="accent">Beta</Badge>
      <Badge tone="success">已启用</Badge>
      <Badge tone="warning">实验性</Badge>
      <Badge tone="danger">已到期</Badge>
      <Badge tone="accent" max={99}>
        {120}
      </Badge>
    </Stack>
  ),
};

export const Avatars: Story = {
  render: () => (
    <Stack direction="row" gap={3} wrap>
      <Avatar fallback="李" size="sm" />
      <Avatar fallback="王" />
      <Avatar fallback="陈" size="lg" />
      <Avatar src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="示例头像" />
    </Stack>
  ),
};

export const NotifyingCard: Story = {
  render: () => (
    <div style={{ width: 340 }}>
      <Card>
        <CardTitle>通知</CardTitle>
        <CardDescription>管理工作台推送与摘要频率</CardDescription>
        <CardContent>
          <Text as="p" tone="muted">
            内容层默认实色材质，正文保持稳定可读。
          </Text>
        </CardContent>
        <CardActions>
          <Button variant="secondary">稍后</Button>
          <Button variant="primary">去设置</Button>
        </CardActions>
      </Card>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <Stack direction="row" gap={4} style={{ alignItems: "center" }}>
      <Spinner label="正在加载" size="sm" />
      <Spinner label="正在加载" />
      <Spinner label="正在加载" size="lg" />
      <Separator decorative={false} orientation="vertical" />
      <Stack gap={2}>
        <Skeleton width={220} height="1rem" />
        <Skeleton width={160} height="1rem" />
        <Skeleton width={200} height="1rem" radius={8} />
      </Stack>
    </Stack>
  ),
};
