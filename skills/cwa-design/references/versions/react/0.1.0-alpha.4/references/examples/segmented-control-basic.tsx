// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { SegmentedControl } from "@cwa-design/react";

export default function Example() {
  return (
    <SegmentedControl
      aria-label="时间范围"
      defaultValue="week"
      items={[
        { value: "day", label: "日" },
        { value: "week", label: "周" },
        { value: "month", label: "月" },
      ]}
    />
  );
}
