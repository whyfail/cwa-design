import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar/avatar";
import { Badge } from "./badge/badge";
import { Button } from "./button/button";
import { Card, CardActions, CardContent, CardDescription, CardTitle } from "./card/card";
import { Separator } from "./separator/separator";
import { Skeleton } from "./skeleton/skeleton";
import { Spinner } from "./spinner/spinner";

describe("Separator", () => {
  it("装饰性默认 hr 且对辅助技术隐藏；语义分隔暴露 role", () => {
    const { container, rerender } = render(<Separator />);
    expect(container.querySelector("hr")).toBeTruthy();
    rerender(<Separator decorative={false} />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
  });
});

describe("Badge", () => {
  it("tone 语义类 + 计数溢出上限", () => {
    const { rerender } = render(<Badge tone="success">已启用</Badge>);
    expect(screen.getByText("已启用").className).toContain("cwa-design-badge--success");
    rerender(
      <Badge tone="accent" max={99}>
        {120}
      </Badge>,
    );
    expect(screen.getByText("99+")).toBeTruthy();
  });
});

describe("Avatar", () => {
  it("无图片时渲染回退首字，几何固定", () => {
    render(<Avatar fallback="李" />);
    expect(screen.getByText("李")).toBeTruthy();
  });
  // jsdom 限制：Image 的 load/error 事件不触发，Base UI 回退时序无法验证。
  // 带图回退时序（300ms 防闪烁）由真实浏览器验证（T33），此处仅验证静态结构。
  it("带图头像渲染根元素且不抛错", () => {
    const { container } = render(
      <Avatar src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="李雷的头像" fallback="李" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("cwa-design-avatar--md");
  });
});

describe("Card", () => {
  it("默认 solid 材质并组合标题/正文/操作", () => {
    render(
      <Card>
        <CardTitle>通知</CardTitle>
        <CardDescription>管理推送偏好</CardDescription>
        <CardContent>正文内容</CardContent>
        <CardActions>
          <Button variant="secondary">取消</Button>
        </CardActions>
      </Card>,
    );
    const card = screen.getByText("通知").closest(".cwa-design-card") as HTMLElement;
    expect(card.getAttribute("data-cwa-surface")).toBe("solid");
    expect(screen.getByText("取消").tagName).toBe("BUTTON");
  });
});

describe("Spinner", () => {
  it("label 提供 role=status 与可访问名称；无 label 时仅装饰", () => {
    const { rerender } = render(<Spinner label="正在加载" />);
    expect(screen.getByRole("status")).toHaveTextContent("正在加载");
    rerender(<Spinner />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("Skeleton", () => {
  it("占位对辅助技术隐藏且几何可自定义", () => {
    const { container } = render(<Skeleton width={120} height="2rem" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.style.width).toBe("120px");
    expect(el.style.height).toBe("2rem");
  });
});
