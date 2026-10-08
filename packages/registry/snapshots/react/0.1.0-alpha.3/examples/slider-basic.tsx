// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Slider } from "@cwa-design/react";

export default function Example() {
  return <Slider aria-label="缩放比例" defaultValue={50} min={0} max={100} step={5} />;
}
