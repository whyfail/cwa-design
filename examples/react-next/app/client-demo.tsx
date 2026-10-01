"use client";

import { Button } from "@cwa-design/react";
import { useState } from "react";

export function ClientButtonDemo() {
  const [saving, setSaving] = useState(false);

  return (
    <section style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <Button
        variant="primary"
        loading={saving}
        onClick={() => {
          setSaving(true);
          setTimeout(() => setSaving(false), 800);
        }}
      >
        保存设置
      </Button>
      <Button variant="ghost" onClick={() => setSaving(false)}>
        重置
      </Button>
      <span style={{ color: "#464a54", fontSize: "0.875rem" }}>{saving ? "提交中…" : "空闲"}</span>
    </section>
  );
}
