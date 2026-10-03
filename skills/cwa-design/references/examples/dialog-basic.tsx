// 应用入口引入 @cwa-design/react/styles.css，并将此示例置于 CwaProvider 内。
import { Dialog, Button, Stack } from "@cwa-design/react";

export default function Example() {
  return (
    <Dialog><Dialog.Trigger render={<Button>新建工作区</Button>} /><Dialog.Content><Dialog.Title>新建工作区</Dialog.Title><Dialog.Description>确认后会在当前应用中创建团队空间。</Dialog.Description><Stack direction="row" gap={2}><Dialog.Close render={<Button variant="secondary">取消</Button>} /><Dialog.Close render={<Button>确认</Button>} /></Stack></Dialog.Content></Dialog>
  );
}
