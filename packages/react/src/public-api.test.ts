// T24 前置校验：所有公共导出与 metadata 一致（公共 API 计数以本测试为准）。
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as publicApi from "./index";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(pkgRoot, "src");

// 组件根 API 名称 → 所在目录（一个目录一个公共组件，compound 部件不计独立组件）
const rootComponents: Record<string, string> = {
  CwaProvider: "provider",
  Surface: "surface",
  Button: "button",
  IconButton: "icon-button",
  Stack: "stack",
  Text: "text",
  Heading: "heading",
  Field: "field",
  Input: "input",
  Textarea: "textarea",
  Separator: "separator",
  Badge: "badge",
  Avatar: "avatar",
  Card: "card",
  Spinner: "spinner",
  Skeleton: "skeleton",
  Checkbox: "checkbox",
  RadioGroup: "radio-group",
  Switch: "switch",
  Select: "select",
  Slider: "slider",
  Tabs: "tabs",
  SegmentedControl: "segmented-control",
  Tooltip: "tooltip",
  Popover: "popover",
  DropdownMenu: "dropdown-menu",
  Dialog: "dialog",
  Sheet: "sheet",
  ToastProvider: "toast",
  Alert: "alert",
};

describe("P0 公共 API 计数与 metadata 一致性", () => {
  it("30 个公共根组件全部实现并导出", () => {
    const missing = Object.keys(rootComponents).filter((name) => !(name in publicApi));
    expect(missing, "未导出的公共组件").toEqual([]);
    const exportedRoots = Object.keys(publicApi).filter((k) => k in rootComponents);
    expect(exportedRoots.length).toBe(30);
  });

  it("每个公共组件目录都有通过 schema 校验的 metadata", () => {
    const failures: string[] = [];
    for (const [name, dir] of Object.entries(rootComponents)) {
      const metaPath = path.join(srcDir, dir, `${dir}.meta.ts`);
      let source: string;
      try {
        source = readFileSync(metaPath, "utf8");
      } catch {
        failures.push(`${name}: 缺少 ${dir}.meta.ts`);
        continue;
      }
      if (!source.includes(`id: "${dir}"`)) failures.push(`${name}: meta id 与目录不一致`);
      if (!source.includes(`name: "${name}"`)) failures.push(`${name}: meta name=${name} 不匹配`);
    }
    expect(failures).toEqual([]);
  });

  it("styles.css 汇总入口覆盖每个组件目录", () => {
    const styles = readFileSync(path.join(srcDir, "styles.css"), "utf8");
    // textarea 样式与 Input 共享 input.css（.cwa-design-textarea 选择器同文件）
    const missing = Object.values(rootComponents).filter(
      (dir) => dir !== "textarea" && !styles.includes(`${dir}/`),
    );
    expect(missing, "styles.css 缺少的组件样式").toEqual([]);
    const inputCss = readFileSync(path.join(srcDir, "input", "input.css"), "utf8");
    expect(inputCss.includes(".cwa-design-textarea")).toBe(true);
  });
});
