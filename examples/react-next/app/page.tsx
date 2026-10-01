import { Button } from "@cwa-design/react";
import { ClientButtonDemo } from "./client-demo";

// Server Component：静态使用 Button（不带事件处理器），
// 交互用法进入 client-demo.tsx 的 "use client" 边界。
export default function Page() {
  return (
    <main
      style={{
        display: "grid",
        gap: "1.5rem",
        padding: "2rem",
        maxWidth: "36rem",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.25rem" }}>Next 消费示例（RSC）</h1>
      <section style={{ display: "flex", gap: "0.75rem" }}>
        <Button variant="primary">静态主按钮</Button>
        <Button variant="secondary">静态次按钮</Button>
      </section>
      <ClientButtonDemo />
    </main>
  );
}
