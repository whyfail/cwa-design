// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Tabs, TabsList, TabsTab, TabsPanel, Text } from "@cwa-design/react";

export default function Example() {
  return (
    <Tabs defaultValue="overview"><TabsList aria-label="项目分区"><TabsTab value="overview">概览</TabsTab><TabsTab value="activity">活动</TabsTab></TabsList><TabsPanel value="overview"><Text>项目概览与成员信息。</Text></TabsPanel><TabsPanel value="activity"><Text>最近活动与更新记录。</Text></TabsPanel></Tabs>
  );
}
