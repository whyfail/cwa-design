// 构建统一 CSS 入口：递归解析 @import（相对路径 + @cwa-design/tokens 内联），
// 产物 dist/styles.css 无任何 @import，消费者零解析负担。
// 其余组件 CSS 仍按相对结构拷贝（供按需引用与调试）。
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(pkgRoot, "src");
const dist = path.join(pkgRoot, "dist");

const importPattern = /^@import\s+(?:url\()?["']([^"']+)["'](?:\))?;/;

async function resolveCss(file, seen) {
  const resolved = path.resolve(file);
  if (seen.has(resolved)) return "";
  seen.add(resolved);
  const source = await readFile(resolved, "utf8");
  const lines = [];
  for (const line of source.split("\n")) {
    const match = line.match(importPattern);
    if (!match) {
      lines.push(line);
      continue;
    }
    const spec = match[1];
    if (spec.startsWith(".") || spec.startsWith("/")) {
      lines.push(await resolveCss(path.resolve(path.dirname(resolved), spec), seen));
    } else if (spec === "@cwa-design/tokens/styles.css") {
      const tokensCss = await readFile(
        path.join(pkgRoot, "node_modules", "@cwa-design/tokens", "dist", "styles.css"),
        "utf8",
      );
      lines.push(`/* inlined @cwa-design/tokens styles.css */\n${tokensCss}`);
    } else {
      throw new Error(`copy-styles: 不支持的 CSS @import 目标 "${spec}"（${file}）`);
    }
  }
  return lines.join("\n");
}

const cssFiles = [
  "material/material.css",
  "button/button.css",
  "icon-button/icon-button.css",
  "provider/provider.css",
  "surface/surface.css",
  "stack/stack.css",
  "text/text.css",
  "heading/heading.css",
  "field/field.css",
  "heading/heading.css",
  "input/input.css",
  "overlay/overlay.css",
  "dialog/dialog.css",
  "sheet/sheet.css",
  "base.css",
  "separator/separator.css",
  "badge/badge.css",
  "avatar/avatar.css",
  "card/card.css",
  "spinner/spinner.css",
  "skeleton/skeleton.css",
  "checkbox/checkbox.css",
  "radio-group/radio-group.css",
  "switch/switch.css",
  "select/select.css",
  "slider/slider.css",
  "tabs/tabs.css",
  "segmented-control/segmented-control.css",
  "tooltip/tooltip.css",
  "popover/popover.css",
  "dropdown-menu/dropdown-menu.css",
  "toast/toast.css",
  "alert/alert.css",
];

await mkdir(dist, { recursive: true });
for (const file of cssFiles) {
  const dest = path.join(dist, file);
  await mkdir(path.dirname(dest), { recursive: true });
  await cp(path.join(srcDir, file), dest);
}

const bundled = await resolveCss(path.join(srcDir, "styles.css"), new Set());
const flattened = bundled.replace(/\n{3,}/g, "\n\n");
await writeFile(path.join(dist, "styles.css"), flattened);
const leftoverImports = flattened.split("\n").filter((l) => l.trimStart().startsWith("@import"));
if (leftoverImports.length > 0) {
  throw new Error(`styles.css 仍有未解析的 @import：${leftoverImports.join("; ")}`);
}
console.log(`styles built: dist/styles.css (${cssFiles.length} 组件文件拷贝，@import 全部内联)`);
