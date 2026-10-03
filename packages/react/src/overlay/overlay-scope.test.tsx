import { render, screen, waitFor } from "@testing-library/react";
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
