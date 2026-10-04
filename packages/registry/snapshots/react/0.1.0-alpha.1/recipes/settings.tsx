"use client";

import { useState } from "react";
import { Button } from "@cwa-design/react";
import { Card, CardActions, CardContent, CardDescription, CardTitle } from "@cwa-design/react";
import { Dialog } from "@cwa-design/react";
import { Field } from "@cwa-design/react";
import { Input } from "@cwa-design/react";
import { Stack } from "@cwa-design/react";
import { Switch } from "@cwa-design/react";
import { createToastManager, ToastProvider } from "@cwa-design/react";
import { RecipeScope as CwaProvider } from "./recipe-scope";

/** Settings recipe 的可见状态（业务侧持有；此处为组件内演示状态）。 */
export interface SettingsValues {
  displayName: string;
  workspace: string;
  notifications: boolean;
}

export interface SettingsRecipeProps {
  initialValues?: Partial<SettingsValues>;
  onSave?: (values: SettingsValues) => void;
}

/**
 * Settings recipe（T31）：Field/Input/Select 语义用 Input+原生 select 替代前，
 * 用 Field+Input+Switch+Button+Dialog+Toast 的真实组合。
 * 原生 <form> 提交；Toast 由 createToastManager 驱动，不连任何模型 API。
 */
export function SettingsRecipe({ initialValues, onSave }: SettingsRecipeProps) {
  const [manager] = useState(() => createToastManager());
  const [values, setValues] = useState<SettingsValues>({
    displayName: initialValues?.displayName ?? "CWA Developer",
    workspace: initialValues?.workspace ?? "默认工作区",
    notifications: initialValues?.notifications ?? true,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <CwaProvider>
      <ToastProvider toastManager={manager}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave?.(values);
            manager.add({
              title: "已保存设置",
              description: onSave ? "已提交给应用" : "已保存在当前演示中",
            });
          }}
          style={{ maxWidth: "32rem" }}
        >
          <Card>
            <CardTitle>个人设置</CardTitle>
            <CardDescription>编辑显示名称与通知偏好；保存操作可由应用接入。</CardDescription>
            <CardContent>
              <Stack gap={4}>
                <Field label="显示名称" description="用于工作台中的个人资料">
                  <Input
                    name="displayName"
                    value={values.displayName}
                    onChange={(e) => setValues((v) => ({ ...v, displayName: e.target.value }))}
                  />
                </Field>
                <Field label="工作区名称">
                  <Input
                    name="workspace"
                    value={values.workspace}
                    onChange={(e) => setValues((v) => ({ ...v, workspace: e.target.value }))}
                  />
                </Field>
                <Switch
                  name="notifications"
                  checked={values.notifications}
                  onCheckedChange={(checked) =>
                    setValues((v) => ({ ...v, notifications: checked === true }))
                  }
                >
                  接收产品通知
                </Switch>
              </Stack>
            </CardContent>
            <CardActions>
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <Dialog.Trigger render={<Button variant="secondary">重置…</Button>} />
                <Dialog.Content material="solid">
                  <Dialog.Title>重置为默认值？</Dialog.Title>
                  <Dialog.Description>
                    未保存的修改将丢失。此操作可在保存前撤销。
                  </Dialog.Description>
                  <Dialog.Close
                    render={
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setValues({
                            displayName: "CWA Developer",
                            workspace: "默认工作区",
                            notifications: true,
                          })
                        }
                      >
                        确认重置
                      </Button>
                    }
                  />
                </Dialog.Content>
              </Dialog>
              <Button variant="primary" type="submit">
                保存设置
              </Button>
            </CardActions>
          </Card>
        </form>
      </ToastProvider>
    </CwaProvider>
  );
}
