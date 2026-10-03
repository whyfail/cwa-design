// 可编译示例：button-basic。examples:check 以 tsc 编译验证（T24 回填 digest）。
import { Button } from "@cwa-design/react";

export function ButtonBasic() {
  return (
    <Button
      variant="primary"
      onClick={() => {
        // 业务动作
      }}
    >
      保存设置
    </Button>
  );
}
