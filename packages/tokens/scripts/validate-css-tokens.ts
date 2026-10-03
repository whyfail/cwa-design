import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
function cssFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? cssFiles(file) : entry.name.endsWith(".css") ? [file] : [];
  });
}
const files = cssFiles(path.join(root, "packages/react/src"));
const normalTokens = readFileSync(path.join(root, "packages/tokens/dist/styles.css"), "utf8").split(
  "@supports",
)[0]!;
const declarations = new Set(
  [...normalTokens.matchAll(/(--cwa-design-[\w-]+)\s*:/g)].map((m) => m[1]),
);
for (const file of files) {
  for (const match of readFileSync(file, "utf8").matchAll(/(--cwa-design-[\w-]+)\s*:/g))
    declarations.add(match[1]);
}
const missing: string[] = [];
for (const file of files) {
  for (const match of readFileSync(file, "utf8").matchAll(/var\((--cwa-design-[\w-]+)\s*([,)])/g)) {
    if (match[2] === ")" && !declarations.has(match[1]))
      missing.push(`${path.relative(root, file)}: ${match[1]}`);
  }
}
if (missing.length) throw new Error(`未声明且没有 fallback 的 Token:\n${missing.join("\n")}`);
console.log(`CSS Token references checked: ${files.length} files, no missing variables.`);
