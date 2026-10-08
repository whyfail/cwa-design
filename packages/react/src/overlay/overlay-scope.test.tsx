import { render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { describe, expect, it } from "vitest";
import { CwaProvider } from "../provider/provider";
import { FocusGuardScope, OverlayPortalScope } from "./overlay-scope";

// Base UI sets these attributes after mounting when its WebKit/VoiceOver branch runs.
function makeWebkitGuard(element: HTMLElement) {
  element.setAttribute("role", "button");
  element.setAttribute("tabindex", "0");
}

describe("OverlayPortalScope focus guard names", () => {
  it.each([OverlayPortalScope, FocusGuardScope])(
    "names late WebKit button guards within its own scope and preserves existing names (%#)",
    async (Scope) => {
      render(
        <>
          <CwaProvider locale="zh-CN">
            <Scope>
              <span data-testid="guard" data-base-ui-focus-guard="" />
              <span data-testid="named" data-base-ui-focus-guard="" />
            </Scope>
          </CwaProvider>
          <span data-testid="outside" data-base-ui-focus-guard="" />
        </>,
      );
      const guard = screen.getByTestId("guard");
      expect(guard).not.toHaveAttribute("aria-label");
      makeWebkitGuard(guard);
      makeWebkitGuard(screen.getByTestId("named"));
      screen.getByTestId("named").setAttribute("aria-label", "应用提供的边界");
      makeWebkitGuard(screen.getByTestId("outside"));
      await waitFor(() => expect(guard).toHaveAccessibleName("继续浏览浮层内容"));
      expect(guard).toHaveAttribute("role", "button");
      expect(guard).toHaveAttribute("tabindex", "0");
      expect(screen.getByTestId("named")).toHaveAccessibleName("应用提供的边界");
      expect(screen.getByTestId("outside")).not.toHaveAttribute("aria-label");
    },
  );

  it("updates its own fallback names when Provider locale changes", async () => {
    function Demo({ locale }: { locale: string }) {
      return (
        <CwaProvider locale={locale}>
          <OverlayPortalScope>
            <span data-testid="guard" data-base-ui-focus-guard="" />
          </OverlayPortalScope>
        </CwaProvider>
      );
    }
    const { rerender } = render(<Demo locale="en-US" />);
    makeWebkitGuard(screen.getByTestId("guard"));
    await waitFor(() =>
      expect(screen.getByTestId("guard")).toHaveAccessibleName("Continue browsing popup content"),
    );
    rerender(<Demo locale="zh-CN" />);
    await waitFor(() =>
      expect(screen.getByTestId("guard")).toHaveAccessibleName("继续浏览浮层内容"),
    );
  });
});

describe("OverlayPortalScope token override sync (ADR 0001)", () => {
  // 真实 Portal 的作用域挂在 body 层级（Provider DOM 之外，无自然继承），
  // 用 createPortal 复现该结构；React Context 仍经 React 树传递。
  function PortalHost({ children }: { children: React.ReactNode }) {
    const [host] = useState(() => {
      const node = document.createElement("div");
      document.body.appendChild(node);
      return node;
    });
    useEffect(() => () => host.remove(), [host]);
    return createPortal(children, host);
  }

  it("copies Provider-root --cwa-design-* overrides onto a body-level portal scope", async () => {
    // F02：PortalHost 在 rerender 之间保持挂载——"移除覆盖"必须作用在
    // 同一个已打开的 scope 上，而不是卸载后读取旧引用。
    function Demo({ fill }: { fill: string }) {
      return (
        <CwaProvider
          theme="dark"
          style={{ "--cwa-design-color-glass-regular-fill": fill } as React.CSSProperties}
        >
          <PortalHost>
            <OverlayPortalScope>
              <span data-testid="popup" />
            </OverlayPortalScope>
          </PortalHost>
        </CwaProvider>
      );
    }
    const { rerender } = render(<Demo fill="rgba(28,29,34,0.67)" />);
    const popup = screen.getByTestId("popup");
    const scope = popup.parentElement!;
    await waitFor(() =>
      expect(scope.style.getPropertyValue("--cwa-design-color-glass-regular-fill")).toBe(
        "rgba(28,29,34,0.67)",
      ),
    );
    expect(scope.isConnected).toBe(true);
    // 动态更新：Provider style 变化（attribute mutation）在打开期间重同步。
    rerender(<Demo fill="rgba(28,29,34,0.8)" />);
    await waitFor(() =>
      expect(scope.style.getPropertyValue("--cwa-design-color-glass-regular-fill")).toBe(
        "rgba(28,29,34,0.8)",
      ),
    );
    expect(scope.isConnected).toBe(true);
    // 移除覆盖后恢复自然解析（不留陈旧内联值），且 scope 仍连接同一 DOM。
    rerender(<Demo fill="" />);
    await waitFor(() =>
      expect(scope.style.getPropertyValue("--cwa-design-color-glass-regular-fill")).toBe(""),
    );
    expect(scope.isConnected).toBe(true);
    expect(scope.contains(popup)).toBe(true);
  });

  it("F02：同步 Provider 上实际生效的 computed 值，而非原始内联字符串", async () => {
    // class !important 在 Provider 根上击败内联——jsdom 会解析该 cascade：
    // computed = #087a6a；旧实现搬运内联 #005fbe，新实现必须搬运 computed。
    const styleHandle = document.createElement("style");
    styleHandle.textContent = ".themed-accent { --cwa-design-color-accent: #087a6a !important; }";
    document.head.appendChild(styleHandle);
    try {
      render(
        <CwaProvider
          theme="dark"
          className="themed-accent"
          style={{ "--cwa-design-color-accent": "#005fbe" } as React.CSSProperties}
        >
          <PortalHost>
            <OverlayPortalScope>
              <span data-testid="important-popup" />
            </OverlayPortalScope>
          </PortalHost>
        </CwaProvider>,
      );
      const scope = screen.getByTestId("important-popup").parentElement!;
      await waitFor(() =>
        expect(scope.style.getPropertyValue("--cwa-design-color-accent")).toBe("#087a6a"),
      );
    } finally {
      styleHandle.remove();
    }
  });

  it("F02：var() 链以 Provider computed 值为同步源（未解析字符串不放大）", async () => {
    // --app-brand 定义在 Provider 自身：jsdom 的 computed 不解析 var() 引用
    // （返回原始 var 字符串），但同步契约是"搬运 computed 值"——无论引擎
    // 是否解析，scope 收到的必须与 Provider computed 逐字相同；真实解析
    // 行为由浏览器页面验证覆盖。
    render(
      <CwaProvider
        theme="dark"
        style={
          {
            "--app-brand": "#123456",
            "--cwa-design-color-accent": "var(--app-brand)",
          } as React.CSSProperties
        }
      >
        <PortalHost>
          <OverlayPortalScope>
            <span data-testid="var-popup" />
          </OverlayPortalScope>
        </PortalHost>
      </CwaProvider>,
    );
    const scope = screen.getByTestId("var-popup").parentElement!;
    const provider = scope.ownerDocument.querySelector(".cwa-design-provider")!;
    await waitFor(() => {
      const providerComputed = getComputedStyle(provider)
        .getPropertyValue("--cwa-design-color-accent")
        .trim();
      expect(scope.style.getPropertyValue("--cwa-design-color-accent")).toBe(providerComputed);
    });
  });

  it("uses the nearest nested Provider as sync source", async () => {
    render(
      <CwaProvider theme="light">
        <CwaProvider
          theme="dark"
          style={{ "--cwa-design-color-accent": "#087a6a" } as React.CSSProperties}
        >
          <PortalHost>
            <OverlayPortalScope>
              <span data-testid="nested-popup" />
            </OverlayPortalScope>
          </PortalHost>
        </CwaProvider>
      </CwaProvider>,
    );
    const scope = screen.getByTestId("nested-popup").parentElement!;
    await waitFor(() =>
      expect(scope.style.getPropertyValue("--cwa-design-color-accent")).toBe("#087a6a"),
    );
    expect(scope.getAttribute("data-cwa-theme")).toBe("dark");
  });
});
