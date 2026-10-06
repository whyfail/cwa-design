// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Skeleton, Stack } from "@cwa-design/react";

export default function Example() {
  return (
    <Stack gap={3} style={{ width: "16rem" }}><Skeleton width="60%" height="1.25rem" /><Skeleton width="100%" /><Skeleton width="80%" /></Stack>
  );
}
