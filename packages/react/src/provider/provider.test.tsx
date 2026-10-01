import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CwaProvider, useCwaContext } from "./provider";

function Probe() {
  const ctx = useCwaContext();
  return (
    <span data-testid="probe" data-locale={ctx.locale ?? ""}>
      {ctx.resolvedTheme ?? "unresolved"}
    </span>
  );
}

describe("CwaProvider", () => {
  it("显式主题直接渲染 data-cwa-theme", () => {
    const { container } = render(
      <CwaProvider theme="dark" material="solid" density="compact">
        <Probe />
      </CwaProvider>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-cwa-theme")).toBe("dark");
    expect(root.getAttribute("data-cwa-material")).toBe("solid");
    expect(root.getAttribute("data-cwa-density")).toBe("compact");
  });

  it("system 主题 SSR/首帧不设属性，客户端解析后设置（无水合不匹配）", () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("matchMedia", matchMedia);
    const { container } = render(
      <CwaProvider theme="system">
        <Probe />
      </CwaProvider>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.hasAttribute("data-cwa-theme")).toBe(true);
    expect(root.getAttribute("data-cwa-theme")).toBe("dark");
    vi.unstubAllGlobals();
  });

  it("motion=full 不发出降级属性，reduced 发出", () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("matchMedia", matchMedia);
    const { container, rerender } = render(<CwaProvider motion="full">x</CwaProvider>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute("data-cwa-motion")).toBe("full");
    rerender(<CwaProvider motion="reduced">x</CwaProvider>);
    expect(root.getAttribute("data-cwa-motion")).toBe("reduced");
    vi.unstubAllGlobals();
  });

  it("Provider 外使用 useCwaContext 抛出明确错误", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/CwaProvider/);
    consoleError.mockRestore();
  });
});
