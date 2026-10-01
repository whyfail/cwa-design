import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Surface } from "./surface";

describe("Surface", () => {
  it("默认 solid，并带 data-cwa-surface hook", () => {
    const { container } = render(<Surface>内容</Surface>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-cwa-surface")).toBe("solid");
    expect(el.className).toContain("cwa-design-surface--solid");
  });

  it("支持 frosted/glass 材质并透传 className 与语义属性", () => {
    const { container } = render(
      <Surface material="glass" className="custom" aria-label="浮层">
        内容
      </Surface>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-cwa-surface")).toBe("glass");
    expect(el.className).toContain("custom");
    expect(el.getAttribute("aria-label")).toBe("浮层");
  });
});
