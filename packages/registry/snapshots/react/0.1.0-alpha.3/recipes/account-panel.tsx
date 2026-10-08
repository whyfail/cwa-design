"use client";

import { useState } from "react";
import { Avatar } from "@cwa-design/react";
import { Badge } from "@cwa-design/react";
import { Button } from "@cwa-design/react";
import { Card, CardActions, CardContent, CardDescription, CardTitle } from "@cwa-design/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@cwa-design/react";
import { Skeleton } from "@cwa-design/react";
import { Stack } from "@cwa-design/react";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@cwa-design/react";
import { Text } from "@cwa-design/react";
import { RecipeScope as CwaProvider } from "./recipe-scope";

export interface AccountPanelRecipeProps {
  /** 静态 fixture；真实业务接入时由调用方传入。 */
  name?: string;
  plan?: "Pro" | "Team" | "Free";
  loading?: boolean;
  onSignOut?: () => void;
  onAccountSettings?: () => void;
  onWorkspaceChange?: () => void;
  onManageSubscription?: () => void;
}

const mockActivity: Array<{ label: string; time: string }> = [
  { label: "更新了 API 密钥", time: "2 小时前" },
  { label: "邀请新成员", time: "昨天" },
  { label: "升级到 Pro 计划", time: "上周" },
];

/** AccountPanel recipe（T31）：Avatar/Badge/Card/Tabs/DropdownMenu/Skeleton/Alert 组合，静态 fixture。 */
export function AccountPanelRecipe({
  name = "李雷",
  plan = "Pro",
  loading = false,
  onSignOut,
  onAccountSettings,
  onWorkspaceChange,
  onManageSubscription,
}: AccountPanelRecipeProps) {
  const [feedback, setFeedback] = useState("");
  const requestAction = (label: string, callback?: () => void) => {
    callback?.();
    setFeedback(callback ? `已请求${label}。` : `${label}演示：由宿主应用接入此操作。`);
  };
  return (
    <CwaProvider>
      <div style={{ width: "24rem", maxWidth: "100%", minWidth: 0 }}>
        <Card>
          <CardTitle>
            <Stack direction="row" gap={3} style={{ alignItems: "center" }}>
              {loading ? (
                <Skeleton width={40} height={40} radius={9999} />
              ) : (
                <Avatar fallback={name.slice(0, 1)} />
              )}
              <Stack gap={1}>
                <Text>{name}</Text>
                <Badge tone="accent">{plan}</Badge>
              </Stack>
              <span style={{ marginInlineStart: "auto" }}>
                <DropdownMenu>
                  <DropdownMenu.Trigger
                    render={
                      <Button variant="ghost" aria-label="账户操作">
                        ⋯
                      </Button>
                    }
                  />
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => requestAction("账户设置", onAccountSettings)}>
                      账户设置
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => requestAction("切换工作区", onWorkspaceChange)}
                    >
                      切换工作区
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      destructive
                      onClick={() => requestAction("退出登录", onSignOut)}
                    >
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </span>
            </Stack>
          </CardTitle>
          <Tabs defaultValue="activity">
            <TabsList aria-label="账户信息">
              <TabsTab value="activity">最近活动</TabsTab>
              <TabsTab value="billing">账单</TabsTab>
            </TabsList>
            <TabsPanel value="activity">
              <Stack gap={3}>
                {loading
                  ? mockActivity.map((item) => (
                      <Skeleton key={item.label} width="100%" height="1.25rem" />
                    ))
                  : mockActivity.map((item) => (
                      <Stack
                        key={item.label}
                        direction="row"
                        gap={3}
                        style={{ justifyContent: "space-between", flexWrap: "wrap" }}
                      >
                        <Text>{item.label}</Text>
                        <Text variant="caption" tone="muted">
                          {item.time}
                        </Text>
                      </Stack>
                    ))}
              </Stack>
            </TabsPanel>
            <TabsPanel value="billing">
              {loading ? (
                <Skeleton width="100%" height="4rem" />
              ) : (
                <Text variant="caption" tone="muted">
                  下一期账单：2026-11-01 · ¥128/月
                </Text>
              )}
            </TabsPanel>
          </Tabs>
          <CardActions>
            <Button
              variant="secondary"
              onClick={() => requestAction("管理订阅", onManageSubscription)}
            >
              管理订阅
            </Button>
          </CardActions>
          <CardContent>
            <Text variant="caption" tone="muted" role="status">
              {feedback}
            </Text>
          </CardContent>
        </Card>
      </div>
    </CwaProvider>
  );
}

export function AccountSkeletonRecipe() {
  return (
    <Card>
      <CardTitle>加载中…</CardTitle>
      <CardContent>
        <Stack gap={3}>
          <Skeleton width="60%" height="1.25rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="80%" height="1rem" />
        </Stack>
      </CardContent>
      <CardDescription>减少动态偏好下闪烁自动关闭，占位几何保持不变。</CardDescription>
    </Card>
  );
}
