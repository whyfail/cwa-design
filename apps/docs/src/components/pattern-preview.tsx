import { AccountPanelRecipe, AiWorkspaceRecipe, SettingsRecipe } from "@cwa-design/react";

export default function PatternPreview({
  id,
  onStatus,
}: {
  id: string;
  onStatus: (message: string) => void;
}) {
  return id === "settings" ? (
    <SettingsRecipe onSave={(values) => onStatus(`已在本次演示保存：${values.displayName}`)} />
  ) : id === "account-panel" ? (
    <AccountPanelRecipe onSignOut={() => onStatus("本次演示已退出；没有真实登录会话")} />
  ) : (
    <AiWorkspaceRecipe />
  );
}
