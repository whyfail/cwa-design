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
    function Demo({ fill }: { fill?: string }) {
      return (
        <CwaProvider
          theme="dark"
          style={
            fill ? ({ "--cwa-design-color-glass-regular-fill": fill } as React.CSSProperties) : {}
          }
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
    // 动态更新：Provider style 变化（attribute mutation）在打开期间重同步。
    rerender(<Demo fill="rgba(28,29,34,0.8)" />);
    await waitFor(() =>
      expect(scope.style.getPropertyValue("--cwa-design-color-glass-regular-fill")).toBe(
        "rgba(28,29,34,0.8)",
      ),
    );
    // 移除覆盖后恢复自然解析（不留陈旧内联值）。
    rerender(
      <CwaProvider theme="dark">
        <PortalHost>
          <OverlayPortalScope>
            <span data-testid="popup" />
          </OverlayPortalScope>
        </PortalHost>
      </CwaProvider>,
    );
    await waitFor(() =>
      expect(scope.style.getPropertyValue("--cwa-design-color-glass-regular-fill")).toBe(""),
    );
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
