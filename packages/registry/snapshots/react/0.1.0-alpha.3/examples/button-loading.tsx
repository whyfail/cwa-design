import { Button } from "@cwa-design/react";
import { useState } from "react";

// 可编译示例：loading 期间禁止重复提交，结束后恢复。
export function ButtonLoading() {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      variant="primary"
      loading={saving}
      onClick={() => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1500);
      }}
    >
      {saving ? "保存中…" : "保存设置"}
    </Button>
  );
}
