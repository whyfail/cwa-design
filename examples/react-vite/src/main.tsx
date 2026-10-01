import { Button } from "@cwa-design/react";
import { createRoot } from "react-dom/client";
import "@cwa-design/react/styles.css";

function App() {
  return (
    <main
      style={{ display: "grid", gap: "1rem", padding: "2rem", maxWidth: "32rem", margin: "0 auto" }}
    >
      <h1 style={{ fontSize: "1.25rem" }}>Vite 消费示例</h1>
      <p style={{ color: "#464a54" }}>来自 @cwa-design/react tarball/workspace 的 Button。</p>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Button variant="primary" onClick={() => console.log("primary clicked")}>
          保存设置
        </Button>
        <Button variant="secondary">取消</Button>
        <Button variant="ghost">了解更多</Button>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Button variant="primary" loading>
          提交中
        </Button>
        <Button variant="danger" disabled>
          删除
        </Button>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
