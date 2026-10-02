"use client";

import { useState } from "react";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { Card, CardContent } from "../card/card";
import { Popover, PopoverContent } from "../popover/popover";
import { CwaProvider } from "../provider/provider";
import { Sheet } from "../sheet/sheet";
import { Stack } from "../stack/stack";
import { Tabs, TabsList, TabsPanel, TabsTab } from "../tabs/tabs";
import { Text } from "../text/text";

export interface AiWorkspaceRecipeProps {
  /** 静态消息 fixture；不连任何模型 API，无模型 key。 */
  messages?: Array<{
    id: string;
    role: "user" | "assistant" | "tool";
    text: string;
    status?: "ok" | "running" | "error";
  }>;
}

const defaultMessages: NonNullable<AiWorkspaceRecipeProps["messages"]> = [
  { id: "m1", role: "user", text: "帮我总结这份规格文档的验收标准。" },
  {
    id: "m2",
    role: "tool",
    text: "retrieve(spec.pdf) → 12 段命中",
    status: "ok",
  },
  {
    id: "m3",
    role: "assistant",
    text: "规格文档共列出 5 条验收标准：安装链路、焦点管理、中断动效、材质对比度、tarball 消费。",
  },
];

function StatusBadge({ status }: { status?: "ok" | "running" | "error" }) {
  if (!status) return null;
  const tone = status === "ok" ? "success" : status === "running" ? "warning" : "danger";
  const label = status === "ok" ? "已完成" : status === "running" ? "进行中" : "失败";
  return <Badge tone={tone}>{`工具 ${label}`}</Badge>;
}

/** AIWorkspace recipe（T31）：Sheet/Popover/Tabs/Text/Button 组合；消息为静态 fixture，无模型 key。 */
export function AiWorkspaceRecipe({ messages = defaultMessages }: AiWorkspaceRecipeProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  return (
    <CwaProvider>
      <div style={{ width: "30rem" }}>
        <Card>
          <CardContent>
            <Stack gap={4}>
              <Stack
                direction="row"
                gap={3}
                style={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Text style={{ fontWeight: 590 }}>AI 工作台</Text>
                <Stack direction="row" gap={2}>
                  <Popover>
                    <Popover.Trigger
                      render={
                        <Button variant="ghost" aria-label="会话信息">
                          ⓘ
                        </Button>
                      }
                    />
                    <PopoverContent aria-label="会话信息">
                      <Text variant="caption" tone="muted">
                        本示例为静态 fixture，不连接模型服务，也不包含任何 API key。
                      </Text>
                    </PopoverContent>
                  </Popover>
                  <Sheet>
                    <Sheet.Trigger render={<Button variant="secondary">会话详情</Button>} />
                    <Sheet.Content>
                      <div className="cwa-design-sheet__handle" aria-hidden="true" />
                      <Sheet.Title className="cwa-design-sheet__title">会话详情</Sheet.Title>
                      <Sheet.Description>工具调用与消息元数据（fixture 数据）。</Sheet.Description>
                      <Tabs defaultValue="meta">
                        <TabsList aria-label="会话详情分区">
                          <TabsTab value="meta">元数据</TabsTab>
                          <TabsTab value="tools">工具</TabsTab>
                        </TabsList>
                        <TabsPanel value="meta">
                          <Text variant="caption" tone="muted">
                            会话 ID：fixture-0001 · 模型：无（静态演示）
                          </Text>
                        </TabsPanel>
                        <TabsPanel value="tools">
                          <Text variant="caption" tone="muted">
                            retrieve(spec.pdf)：已完成 · 12 段命中
                          </Text>
                        </TabsPanel>
                      </Tabs>
                      <Sheet.Close render={<Button variant="secondary">关闭</Button>} />
                    </Sheet.Content>
                  </Sheet>
                </Stack>
              </Stack>
              {messages.map((message) => (
                <Stack
                  key={message.id}
                  gap={1}
                  style={{
                    alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                  }}
                >
                  <Text variant="caption" tone="muted">
                    {message.role === "user" ? "你" : message.role === "tool" ? "工具" : "助手"}
                  </Text>
                  <div
                    style={{
                      padding: "var(--cwa-design-space-3)",
                      borderRadius: "var(--cwa-design-radius-control)",
                      background:
                        message.role === "user"
                          ? "color-mix(in srgb, var(--cwa-design-color-accent) 12%, transparent)"
                          : "var(--cwa-design-color-surface)",
                      border: "1px solid var(--cwa-design-color-border-subtle)",
                    }}
                  >
                    <Text>{message.text}</Text>
                  </div>
                  {message.status ? <StatusBadge status={message.status} /> : null}
                </Stack>
              ))}
              <Stack direction="row" gap={2} style={{ justifyContent: "flex-end" }}>
                <Button
                  variant="ghost"
                  onClick={() => setInfoOpen(true)}
                  aria-expanded={infoOpen ? true : undefined}
                >
                  附件
                </Button>
                <Button variant="primary" onClick={() => {}}>
                  发送
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </div>
    </CwaProvider>
  );
}
