// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { RadioGroup, RadioItem } from "@cwa-design/react";

export default function Example() {
  return (
    <RadioGroup name="plan" defaultValue="team" aria-label="选择计划">
      <RadioItem value="personal">个人</RadioItem>
      <RadioItem value="team">团队</RadioItem>
      <RadioItem value="enterprise" disabled>
        企业（暂未开放）
      </RadioItem>
    </RadioGroup>
  );
}
