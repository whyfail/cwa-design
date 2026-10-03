import { useState } from "react";
import { Icon } from "./icons";
export function CodeBlock({ code, label = "TSX" }: { code: string; label?: string }) {
  const [status, setStatus] = useState("");
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code).then(
              () => setStatus("已复制"),
              () => setStatus("请选择源码后复制"),
            );
          }}
        >
          <Icon name={status === "已复制" ? "check" : "copy"} size={15} />
          {status || "复制"}
        </button>
      </div>
      <pre tabIndex={0} role="group" aria-label={`${label} 代码，使用方向键滚动查看`}>
        <code>{code}</code>
      </pre>
      <span className="site-sr-only" role="status">
        {status}
      </span>
    </div>
  );
}
