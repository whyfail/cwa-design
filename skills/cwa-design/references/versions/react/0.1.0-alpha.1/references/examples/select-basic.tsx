// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Select, SelectContent, SelectItem } from "@cwa-design/react";

export default function Example() {
  return (
    <Select defaultValue="design" name="workspace" items={{ design: "设计团队", engineering: "研发团队" }}><Select.Trigger aria-label="工作区"><Select.Value /></Select.Trigger><SelectContent><SelectItem value="design">设计团队</SelectItem><SelectItem value="engineering">研发团队</SelectItem></SelectContent></Select>
  );
}
