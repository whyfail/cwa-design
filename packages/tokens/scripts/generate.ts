// Token 单一来源：src/tokens.json → 校验（zod）→ dist/styles.css + dist/tokens.d.ts。
// 禁止在任何组件 CSS 手工重复这些值；新 Token 只改 tokens.json。
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const primitiveEntry = z.object({
  value: z.string(),
  type: z.enum(["dimension", "number"]),
  unit: z.string(),
  description: z.string(),
});

const colorEntry = z.object({
  value: z
    .string()
    .regex(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))$/, "必须是 hex 或 rgba()/rgb() 颜色"),
  type: z.literal("color"),
  description: z.string(),
});

const motionEntry = z.union([
  z.object({
    type: z.literal("duration"),
    value: z.string().regex(/^\d+ms$/),
    description: z.string(),
  }),
  z.object({
    type: z.literal("spring"),
    bounce: z.number().min(0).max(1),
    duration: z.number().positive(),
    description: z.string(),
  }),
]);

export const tokensSchema = z.object({
  $schema: z.literal("cwa-tokens@1"),
  libraryVersion: z.string(),
  primitive: z.record(z.string(), z.record(z.string(), primitiveEntry)),
  semantic: z.object({
    light: z.record(z.string(), colorEntry),
    dark: z.record(z.string(), colorEntry),
  }),
  motion: z.record(z.string(), motionEntry),
});

export type CwaTokens = z.infer<typeof tokensSchema>;

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const cssName = (group: string, key: string) => `--cwa-design-${group}-${kebab(key)}`;

export function generateCss(tokens: CwaTokens): string {
  const lines: string[] = [];
  const p = (s: string) => lines.push(s);

  p("/* 由 packages/tokens/scripts/generate.ts 生成；勿手工编辑。来源：src/tokens.json */");
  p(":root {");
  for (const [group, entries] of Object.entries(tokens.primitive)) {
    for (const [key, entry] of Object.entries(entries))
      p(`  ${cssName(group, key)}: ${entry.value};`);
  }
  for (const [key, entry] of Object.entries(tokens.semantic.light)) {
    p(`  ${cssName("color", key.replace(/^color-/, ""))}: ${entry.value};`);
  }
  p(
    `  ${cssName("font", "family")}: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif;`,
  );
  p("}");

  p(`[data-cwa-theme="dark"] {`);
  for (const [key, entry] of Object.entries(tokens.semantic.dark)) {
    p(`  ${cssName("color", key.replace(/^color-/, ""))}: ${entry.value};`);
  }
  p("}");

  // 无 blur 支持时保留实色可读性：玻璃填充回退到 surface，blur 清零。
  const surfaceValue = (theme: "light" | "dark") => tokens.semantic[theme]["color-surface"]!.value;
  p("@supports not (backdrop-filter: blur(1px)) {");
  p("  :root {");
  p(`    ${cssName("color", "glass-regular-fill")}: ${surfaceValue("light")};`);
  p(`    ${cssName("color", "glass-thick-fill")}: ${surfaceValue("light")};`);
  p(`    ${cssName("color", "glass-clear-fill")}: ${surfaceValue("light")};`);
  p(`    ${cssName("blur", "glass-regular")}: 0px;`);
  p(`    ${cssName("blur", "glass-thick")}: 0px;`);
  p(`    ${cssName("blur", "glass-clear")}: 0px;`);
  p("  }");
  p(`  [data-cwa-theme="dark"] {`);
  p(`    ${cssName("color", "glass-regular-fill")}: ${surfaceValue("dark")};`);
  p(`    ${cssName("color", "glass-thick-fill")}: ${surfaceValue("dark")};`);
  p(`    ${cssName("color", "glass-clear-fill")}: ${surfaceValue("dark")};`);
  p("  }");
  p("}");

  // 用户显式选择实色材质：Provider 根元素 data-cwa-material="solid"。
  const solidBlock = (theme: "light" | "dark") => [
    `  ${cssName("color", "glass-regular-fill")}: ${surfaceValue(theme)};`,
    `  ${cssName("color", "glass-thick-fill")}: ${surfaceValue(theme)};`,
    `  ${cssName("color", "glass-clear-fill")}: ${surfaceValue(theme)};`,
    `  ${cssName("blur", "glass-regular")}: 0px;`,
    `  ${cssName("blur", "glass-thick")}: 0px;`,
    `  ${cssName("blur", "glass-clear")}: 0px;`,
  ];
  p(`[data-cwa-material="solid"] {`);
  p(solidBlock("light").join("\n"));
  p("}");
  p(`[data-cwa-theme="dark"][data-cwa-material="solid"] {`);
  p(solidBlock("dark").join("\n"));
  p("}");

  // 系统减少动态：动画时长趋零（位移交给组件层移除）。
  p("@media (prefers-reduced-motion: reduce) {");
  p("  :root {");
  for (const [key, entry] of Object.entries(tokens.motion)) {
    if (entry.type === "duration") p(`    --cwa-design-motion-${kebab(key)}: 1ms;`);
  }
  p("  }");
  p("}");

  // 减少透明：玻璃填充转实色，blur 清零。
  p("@media (prefers-reduced-transparency: reduce) {");
  p("  :root {");
  p(`    ${cssName("color", "glass-regular-fill")}: ${surfaceValue("light")};`);
  p(`    ${cssName("color", "glass-thick-fill")}: ${surfaceValue("light")};`);
  p(`    ${cssName("blur", "glass-regular")}: 0px;`);
  p(`    ${cssName("blur", "glass-thick")}: 0px;`);
  p("  }");
  p("}");

  // 更高对比：加强边界。
  p("@media (prefers-contrast: more) {");
  p("  :root {");
  p(
    `    ${cssName("color", "border-subtle")}: ${tokens.semantic.light["color-border-strong"]!.value};`,
  );
  p("  }");
  p("}");

  return `${lines.join("\n")}\n`;
}

function main() {
  const raw: unknown = JSON.parse(readFileSync(path.join(pkgRoot, "src", "tokens.json"), "utf8"));
  const parsed = tokensSchema.parse(raw); // 校验失败即构建失败

  const lightKeys = Object.keys(parsed.semantic.light).sort();
  const darkKeys = Object.keys(parsed.semantic.dark).sort();
  if (lightKeys.join("|") !== darkKeys.join("|")) {
    throw new Error(
      `light/dark 语义 Token 键不一致: [${lightKeys.join(" | ")}] vs [${darkKeys.join(" | ")}]`,
    );
  }

  mkdirSync(path.join(pkgRoot, "dist"), { recursive: true });
  writeFileSync(path.join(pkgRoot, "dist", "styles.css"), generateCss(parsed));
  writeFileSync(path.join(pkgRoot, "dist", "tokens.json"), JSON.stringify(parsed, null, 2));

  const varNames = [];
  for (const [group, entries] of Object.entries(parsed.primitive)) {
    for (const key of Object.keys(entries)) varNames.push(cssName(group, key));
  }
  for (const key of Object.keys(parsed.semantic.light))
    varNames.push(cssName("color", key.replace(/^color-/, "")));
  const dts = `// 由 generate.ts 生成\nexport const cwaTokenVariables = ${JSON.stringify(varNames, null, 2)} as const;\nexport type CwaTokenVariable = (typeof cwaTokenVariables)[number];\nexport const cwaMotionPresets = ${JSON.stringify(Object.keys(parsed.motion))} as const;\n`;
  writeFileSync(path.join(pkgRoot, "dist", "tokens.d.ts"), dts);
  console.log(
    `tokens: ${varNames.length} CSS variables, themes: light/dark, motion: ${Object.keys(parsed.motion).length}`,
  );
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main();
}
