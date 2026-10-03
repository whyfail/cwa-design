// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { useState } from "react";
import { Card, CardTitle, CardDescription, CardContent, CardActions, Text, Button } from "@cwa-design/react";

export default function Example() {
  const [saved, setSaved] = useState(false);
  return (
    <Card><CardTitle>设计资源</CardTitle><CardDescription>内容层保持清晰的实色表面。</CardDescription><CardContent><Text>组件、主题与可访问性约定。</Text></CardContent><CardActions><Button variant="secondary" onClick={() => setSaved(!saved)}>{saved ? "已收藏" : "收藏资源"}</Button></CardActions></Card>
  );
}
