// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  Stack,
  Text,
} from "@cwa-design/react";
import { useState } from "react";

export default function Example() {
  const [action, setAction] = useState("请选择项目操作。");
  return (
    <Stack gap={3}>
      <DropdownMenu>
        <DropdownMenu.Trigger render={<Button variant="secondary">项目操作</Button>} />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setAction("已复制链接")}>复制链接</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAction("已归档项目")}>归档项目</DropdownMenuItem>
          <DropdownMenuItem disabled>删除（无权限）</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Text role="status" variant="caption">
        {action}
      </Text>
    </Stack>
  );
}
