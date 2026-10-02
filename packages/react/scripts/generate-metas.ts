// 生成 packages/react/dist/metas.json：30 个组件的 registry 记录。
// Node 24 type-strip 直接运行（meta 为纯字面量 + import type）。由 build 流程调用。
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ComponentRecord } from "@cwa-design/registry";

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

const META_MODULES: Array<[dir: string, exportName: string]> = [
  ["provider", "providerMeta"],
  ["surface", "surfaceMeta"],
  ["button", "buttonMeta"],
  ["icon-button", "iconButtonMeta"],
  ["stack", "stackMeta"],
  ["text", "textMeta"],
  ["heading", "headingMeta"],
  ["field", "fieldMeta"],
  ["input", "inputMeta"],
  ["textarea", "textareaMeta"],
  ["separator", "separatorMeta"],
  ["badge", "badgeMeta"],
  ["avatar", "avatarMeta"],
  ["card", "cardMeta"],
  ["spinner", "spinnerMeta"],
  ["skeleton", "skeletonMeta"],
  ["checkbox", "checkboxMeta"],
  ["radio-group", "radioGroupMeta"],
  ["switch", "switchMeta"],
  ["select", "selectMeta"],
  ["slider", "sliderMeta"],
  ["tabs", "tabsMeta"],
  ["segmented-control", "segmentedControlMeta"],
  ["tooltip", "tooltipMeta"],
  ["popover", "popoverMeta"],
  ["dropdown-menu", "dropdownMenuMeta"],
  ["dialog", "dialogMeta"],
  ["sheet", "sheetMeta"],
  ["toast", "toastMeta"],
  ["alert", "alertMeta"],
];

function isComponentRecord(value: unknown): value is ComponentRecord {
  return (
    typeof value === "object" && value !== null && "id" in value && typeof value.id === "string"
  );
}

async function loadMeta(dir: string, exportName: string): Promise<ComponentRecord> {
  const mod = (await import(path.join(srcDir, dir, `${dir}.meta.ts`))) as Record<string, unknown>;
  const value = mod[exportName];
  if (!isComponentRecord(value)) {
    throw new Error(`${dir}.meta.ts: 导出 ${exportName} 不是有效的 ComponentRecord`);
  }
  return value;
}

const metas: Array<ComponentRecord> = [];
for (const [dir, exportName] of META_MODULES) {
  metas.push(await loadMeta(dir, exportName));
}

if (metas.length !== 30) {
  throw new Error(`应有 30 个 meta，实际 ${metas.length}`);
}
const ids = new Set(metas.map((m) => m.id));
if (ids.size !== 30) {
  throw new Error("meta id 存在重复");
}

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "metas.json"), `${JSON.stringify(metas, null, 2)}\n`);
console.log(`metas.json written: ${metas.length} components`);
