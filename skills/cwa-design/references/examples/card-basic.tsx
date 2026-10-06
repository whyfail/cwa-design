// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardTitle,
  Text,
} from "@cwa-design/react";
import { useState } from "react";

export default function Example() {
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <CardTitle>设计资源</CardTitle>
      <CardDescription>内容层保持清晰的实色表面。</CardDescription>
      <CardContent>
        <Text>组件、主题与可访问性约定。</Text>
      </CardContent>
      <CardActions>
        <Button variant="secondary" onClick={() => setSaved(!saved)}>
          {saved ? "已收藏" : "收藏资源"}
        </Button>
      </CardActions>
    </Card>
  );
}
