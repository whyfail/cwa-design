"use client";

import { useRef, useState } from "react";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { Card, CardContent } from "../card/card";
import { Field } from "../field/field";
import { Popover, PopoverContent } from "../popover/popover";
import { Sheet } from "../sheet/sheet";
import { Stack } from "../stack/stack";
import { Tabs, TabsList, TabsPanel, TabsTab } from "../tabs/tabs";
import { Text } from "../text/text";
import { Textarea } from "../textarea/textarea";
import { RecipeScope as CwaProvider } from "./recipe-scope";

export interface AiWorkspaceRecipeProps {
  /** 静态消息 fixture；不连任何模型 API，无模型 key。 */
  messages?: Array<{
    id: string;
    role: "user" | "assistant" | "tool";
    text: string;
    status?: "ok" | "running" | "error";
  }>;
  /** 提交给宿主应用；缺省只将消息保存在当前演示页面。 */
  onSend?: (text: string) => void;
  /** 本地文件选择回调；组件本身不上传文件。 */
  onAttach?: (files: File[]) => void;
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
export function AiWorkspaceRecipe({
  messages = defaultMessages,
  onSend,
  onAttach,
}: AiWorkspaceRecipeProps) {
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<
    NonNullable<AiWorkspaceRecipeProps["messages"]>
  >([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [feedback, setFeedback] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const messageSequence = useRef(0);
  return (
    <CwaProvider>
      <div style={{ width: "30rem", maxWidth: "100%", minWidth: 0 }}>
        <Card>
          <CardContent>
            <Stack gap={4}>
              <Stack
                direction="row"
                gap={3}
                style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}
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
                        初始消息是演示数据。输入与附件保存在当前页面；模型连接由宿主应用提供。
                      </Text>
                    </PopoverContent>
                  </Popover>
                  <Sheet>
                    <Sheet.Trigger render={<Button variant="secondary">会话详情</Button>} />
                    <Sheet.Content>
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
              {[...messages, ...localMessages].map((message) => (
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
                      overflowWrap: "anywhere",
                    }}
                  >
                    <Text>{message.text}</Text>
                  </div>
                  {message.status ? <StatusBadge status={message.status} /> : null}
                </Stack>
              ))}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const text = draft.trim();
                  if (!text) return;
                  onSend?.(text);
                  messageSequence.current += 1;
                  setLocalMessages((previous) => [
                    ...previous,
                    { id: `local-${messageSequence.current}`, role: "user", text },
                  ]);
                  setDraft("");
                  setFeedback(
                    onSend ? "消息已提交给应用。" : "消息已保存在本地演示中，未调用模型。",
                  );
                }}
              >
                <Stack gap={3}>
                  <Field label="消息" description="发送后追加到当前会话；演示不会生成模型回复。">
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={3}
                      placeholder="输入消息…"
                    />
                  </Field>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    className="cwa-design-visually-hidden"
                    tabIndex={-1}
                    aria-label="选择本地附件"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      setAttachments(files);
                      onAttach?.(files);
                      setFeedback(
                        files.length ? `已选择 ${files.length} 个本地附件。` : "已清除附件。",
                      );
                    }}
                  />
                  {attachments.length ? (
                    <Text variant="caption" tone="muted" style={{ overflowWrap: "anywhere" }}>
                      本地附件：{attachments.map((file) => file.name).join("、")}
                    </Text>
                  ) : null}
                  <Stack
                    direction="row"
                    gap={2}
                    style={{ justifyContent: "flex-end", flexWrap: "wrap" }}
                  >
                    <Button variant="ghost" onClick={() => fileInput.current?.click()}>
                      附件
                    </Button>
                    {attachments.length ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setAttachments([]);
                          if (fileInput.current) fileInput.current.value = "";
                          onAttach?.([]);
                          setFeedback("已清除附件。");
                        }}
                      >
                        清除附件
                      </Button>
                    ) : null}
                    <Button variant="primary" type="submit" disabled={!draft.trim()}>
                      发送
                    </Button>
                  </Stack>
                  <Text variant="caption" tone="muted" role="status">
                    {feedback}
                  </Text>
                </Stack>
              </form>
            </Stack>
          </CardContent>
        </Card>
      </div>
    </CwaProvider>
  );
}
