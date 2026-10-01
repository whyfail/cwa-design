// 将组件 CSS 按源码相对结构拷贝到 dist，保持 styles.css 的 @import 相对路径可解析。
// Alpha 只承诺统一入口 dist/styles.css；per-component CSS 在独立任务验证后再公开。
import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(pkgRoot, "dist");

await mkdir(path.join(dist, "button"), { recursive: true });
await cp(path.join(pkgRoot, "src", "styles.css"), path.join(dist, "styles.css"));
await cp(
  path.join(pkgRoot, "src", "button", "button.css"),
  path.join(dist, "button", "button.css"),
);
console.log("styles copied: dist/styles.css, dist/button/button.css");
