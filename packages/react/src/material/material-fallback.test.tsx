// F02：实色回退必须在材质元素上重定义填充变量——任何来自 Provider/Portal
// 的内联或类玻璃填充覆盖（继承值）都无法绕过。本测试从 material.css 源码
// 提取真实回退规则块，在 JSDOM 中以 Token 桩验证自定义属性 cascade 优先级：
// 元素自身规则击败继承的内联覆盖（这正是 Provider style 覆盖的传递路径）。
// jsdom 不解析标准属性中的 var() 引用（backgroundColor 保持原始表达式），
// 实际合成颜色由维护者页面验证覆盖；此处验证的是规则文本与优先级机制。
import { readFileSync } from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const materialCss = readFileSync(path.join(import.meta.dirname, "material.css"), "utf8");

function extractRule(selector: string): string {
  const anchor = materialCss.indexOf(selector);
  expect(anchor, `rule not found in material.css: ${selector}`).toBeGreaterThan(-1);
  const start = materialCss.indexOf("{", anchor);
  const end = materialCss.indexOf("}", start);
  return `${materialCss.slice(anchor, end + 1)}`;
}

const solidRule = extractRule('[data-cwa-material="solid"] .cwa-design-material');
const baseMaterialRule = extractRule(".cwa-design-material {");

const TOKEN_STUBS = `
  :root {
    --cwa-design-color-surface: #ffffff;
    --cwa-design-color-glass-regular-fill: rgba(255, 255, 255, 0.52);
  }
`;

function buildDom(
  providerInlineFill: string | null,
  solid: boolean,
): { window: JSDOM["window"]; material: HTMLElement } {
  const rules = `${TOKEN_STUBS} ${baseMaterialRule} ${solid ? solidRule : ""}`;
  const dom = new JSDOM(`<!doctype html><html><head><style>${rules}</style></head>
    <body>
      <div ${solid ? 'data-cwa-material="solid"' : ""} ${providerInlineFill ? `style="--cwa-design-color-glass-regular-fill: ${providerInlineFill}"` : ""}>
        <div class="cwa-design-material"></div>
      </div>
    </body></html>`);
  const material = dom.window.document.querySelector(".cwa-design-material") as HTMLElement;
  return { window: dom.window, material };
}

const fillOn = (window: JSDOM["window"], material: HTMLElement) =>
  window
    .getComputedStyle(material)
    .getPropertyValue("--cwa-design-color-glass-regular-fill")
    .trim();

describe("F02：实色回退优先于玻璃填充覆盖", () => {
  it("显式 solid 下，Provider 内联 67% 填充被 surface 实色取代", () => {
    const { window, material } = buildDom("rgba(255, 255, 255, 0.67)", true);
    // jsdom 不做 var() 链替换：断言材质元素上的填充变量已被回退规则改写为
    // surface 引用（胜过继承的内联 67%），并单独验证 surface 桩本身可解析。
    expect(fillOn(window, material)).toBe("var(--cwa-design-color-surface)");
    expect(
      window.getComputedStyle(material).getPropertyValue("--cwa-design-color-surface").trim(),
    ).toBe("#ffffff");
  });

  it("普通 auto 玻璃仍使用 Provider 的填充覆盖（回退不误伤正常状态）", () => {
    const { window, material } = buildDom("rgba(10, 20, 30, 0.67)", false);
    expect(fillOn(window, material)).toBe("rgba(10, 20, 30, 0.67)");
  });

  it("无内联覆盖时 solid 同样得到实色（默认路径）", () => {
    const { window, material } = buildDom(null, true);
    expect(fillOn(window, material)).toBe("var(--cwa-design-color-surface)");
    expect(
      window.getComputedStyle(material).getPropertyValue("--cwa-design-color-surface").trim(),
    ).toBe("#ffffff");
  });
});
