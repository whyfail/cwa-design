import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reactPackage = JSON.parse(
  readFileSync(path.join(repoRoot, "packages/react/package.json"), "utf8"),
);
const rootPackage = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const version = reactPackage.version;
const archive =
  process.env.CWA_REACT_TARBALL ??
  path.join(repoRoot, "apps/docs/dist/downloads", `cwa-design-react-${version}.tgz`);
const reportPath = path.join(repoRoot, "reports/optimization/tarball-results.json");
const startedAt = Date.now();
const digest = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const run = (args, cwd) =>
  execFileSync("rtk", ["proxy", "env", "NVMD_NODE_VERSION=24.21.0", ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
const report = {
  generatedAt: new Date().toISOString(),
  status: "running",
  node: process.version,
  version,
  archive: {},
  consumer: {},
  checks: {},
  assets: {},
  elapsedMs: 0,
};

try {
  if (!existsSync(archive)) throw new Error(`Missing real archive: ${archive}`);
  const bytes = readFileSync(archive);
  const entries = run(["tar", "-tf", archive], repoRoot).trim().split("\n");
  if (!entries.includes("package/dist/index.js") || !entries.includes("package/dist/styles.css"))
    throw new Error("Archive lacks public JS/CSS entries");
  if (entries.some((entry) => entry.startsWith("package/src/") || entry.includes("node_modules/")))
    throw new Error("Archive contains workspace source or node_modules");
  report.archive = {
    path: archive,
    bytes: bytes.byteLength,
    contentDigest: digest(bytes),
    entryCount: entries.length,
    publicEntriesPresent: true,
    includesWorkspaceSource: false,
  };

  const directory = mkdtempSync(path.join(tmpdir(), "cwa-tarball-consumer-"));
  const archiveName = path.basename(archive);
  copyFileSync(archive, path.join(directory, archiveName));
  const dependencies = {
    "@cwa-design/react": `file:./${archiveName}`,
    react: reactPackage.devDependencies.react,
    "react-dom": reactPackage.devDependencies["react-dom"],
  };
  const devDependencies = {
    "@typescript/native": rootPackage.devDependencies["@typescript/native"],
    "@types/react": reactPackage.devDependencies["@types/react"],
    "@types/react-dom": reactPackage.devDependencies["@types/react-dom"],
    "@vitejs/plugin-react": reactPackage.devDependencies["@vitejs/plugin-react"],
    vite: reactPackage.devDependencies.vite,
    typescript: "npm:@typescript/typescript6@6.0.2",
  };
  const packageJson = {
    name: "cwa-design-independent-tarball-consumer",
    version: "0.0.0",
    private: true,
    type: "module",
    packageManager: "pnpm@12.8.1",
    dependencies,
    devDependencies,
  };
  writeFileSync(path.join(directory, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
  mkdirSync(path.join(directory, "src"));
  writeFileSync(
    path.join(directory, "src/vite-env.d.ts"),
    '/// <reference types="vite/client" />\n',
  );
  writeFileSync(
    path.join(directory, "index.html"),
    '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><title>CWA tarball consumer</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
  );
  writeFileSync(
    path.join(directory, "tsconfig.json"),
    `${JSON.stringify({ compilerOptions: { target: "ES2022", lib: ["ES2022", "DOM", "DOM.Iterable"], module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, skipLibCheck: true, noEmit: true }, include: ["src"] }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(directory, "vite.config.mjs"),
    'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()], ssr: { external: ["@cwa-design/react", "react", "react-dom"] } });\n',
  );
  writeFileSync(
    path.join(directory, "src/app.tsx"),
    `import { Button, CwaProvider, Heading, Input, Popover, PopoverContent, SegmentedControl, Select, SelectContent, SelectItem, SettingsRecipe, Slider, Surface, Switch } from "@cwa-design/react";
import { useState } from "react";
export function App() {
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const [dynamicFill, setDynamicFill] = useState("rgba(28,29,34,0.67)");
  return (<>
<CwaProvider theme="light"><Surface material="glass"><Heading level={1}>Independent tarball consumer</Heading><Button>Ready</Button><Input aria-label="Consumer name" defaultValue="Ada" /><Slider aria-label="Volume" defaultValue={50} /><Switch>Notifications</Switch><SegmentedControl aria-label="View" defaultValue="day" items={[{value:"day",label:"Day"},{value:"week",label:"Week"}]} /><SettingsRecipe /></Surface></CwaProvider>
<section aria-label="Scoped theme check">
  <CwaProvider theme="dark" className="my-cwa-theme"><Surface material="glass" data-testid="scoped-surface"><Heading level={2}>Scoped 67% fill</Heading><Button>Scoped</Button></Surface></CwaProvider>
  <CwaProvider theme="dark"><Surface material="glass" data-testid="default-dark-surface"><Heading level={2}>Theme default</Heading><Button>Default</Button></Surface></CwaProvider>
</section>
<section aria-label="Portal override checks (V02)">
  <CwaProvider theme="dark" className="my-cwa-theme">
    <Surface material="glass"><Heading level={2}>Body portal</Heading>
      <Popover><Popover.Trigger render={<Button data-testid="portal-trigger">打开浮层</Button>} /><PopoverContent data-testid="portal-popup"><Popover.Title>作用域浮层</Popover.Title></PopoverContent></Popover>
    </Surface>
  </CwaProvider>
  <CwaProvider theme="dark" className="my-cwa-theme" portalContainer={containerNode}>
    <Surface material="glass"><Heading level={2}>Custom container</Heading>
      <Popover><Popover.Trigger render={<Button data-testid="custom-portal-trigger">容器浮层</Button>} /><PopoverContent data-testid="custom-portal-popup"><Popover.Title>自定义容器浮层</Popover.Title></PopoverContent></Popover>
    </Surface>
  </CwaProvider>
  <div ref={setContainerNode} data-testid="custom-portal-container" />
  <CwaProvider theme="light">
    <Surface material="glass"><Heading level={2}>Nested providers</Heading>
      <Popover><Popover.Trigger render={<Button data-testid="outer-portal-trigger">外层浮层</Button>} /><PopoverContent data-testid="outer-portal-popup"><Popover.Title>外层默认</Popover.Title></PopoverContent></Popover>
      <CwaProvider theme="dark" className="my-cwa-theme" style={{ "--cwa-design-color-accent": "#087a6a" } as React.CSSProperties}>
        <Popover><Popover.Trigger render={<Button data-testid="inner-portal-trigger">内层浮层</Button>} /><PopoverContent data-testid="inner-portal-popup"><Popover.Title>内层覆盖</Popover.Title></PopoverContent></Popover>
      </CwaProvider>
    </Surface>
  </CwaProvider>
  <CwaProvider theme="dark" className="my-cwa-theme" style={{ "--cwa-design-color-glass-regular-fill": dynamicFill } as React.CSSProperties}>
    <Surface material="glass"><Heading level={2}>Dynamic override</Heading>
      <Popover><Popover.Trigger render={<Button data-testid="dynamic-portal-trigger">动态浮层</Button>} /><PopoverContent data-testid="dynamic-portal-popup"><Popover.Title>动态覆盖</Popover.Title><Button data-testid="dynamic-toggle" onClick={() => setDynamicFill((fill) => (fill === "rgba(28,29,34,0.67)" ? "rgba(28,29,34,0.82)" : "rgba(28,29,34,0.67)"))}>切换遮蔽</Button></PopoverContent></Popover>
    </Surface>
  </CwaProvider>
  <CwaProvider theme="dark">
    <Surface material="glass"><Heading level={2}>Select trigger</Heading>
      <Select defaultValue="design" items={{ design: "设计团队", engineering: "研发团队" }}>
        <Select.Trigger data-testid="consumer-select-trigger" aria-label="工作区"><Select.Value /></Select.Trigger>
        <SelectContent><SelectItem value="design">设计团队</SelectItem><SelectItem value="engineering">研发团队</SelectItem></SelectContent>
      </Select>
    </Surface>
  </CwaProvider>
</section>
</>); }
`,
  );
  // 与官网主题实验室导出的 CSS 片段同构（N01）：类名挂在 Provider 上即生效。
  writeFileSync(
    path.join(directory, "src/consumer-theme.css"),
    ".my-cwa-theme {\n  --cwa-design-color-glass-regular-fill: rgba(28,29,34,0.67);\n}\n",
  );
  writeFileSync(
    path.join(directory, "src/main.tsx"),
    'import { createRoot, hydrateRoot } from "react-dom/client";\nimport "@cwa-design/react/styles.css";\nimport "./consumer-theme.css";\nimport { App } from "./app";\nconst root = document.getElementById("root")!;\nif (root.hasChildNodes()) hydrateRoot(root, <App />); else createRoot(root).render(<App />);\n',
  );
  writeFileSync(
    path.join(directory, "src/entry-server.tsx"),
    'import { renderToString } from "react-dom/server";\nimport { App } from "./app";\nexport function render() { return renderToString(<App />); }\n',
  );
  report.consumer = {
    directory,
    dependencies,
    devDependencies,
    usesWorkspaceProtocol: false,
    sourceAliasConfigured: false,
    importSpecifier: "@cwa-design/react",
    stylesSpecifier: "@cwa-design/react/styles.css",
  };

  run(["corepack", "pnpm", "install", "--ignore-scripts"], directory);
  const lock = readFileSync(path.join(directory, "pnpm-lock.yaml"), "utf8");
  if (lock.includes("workspace:") || lock.includes(repoRoot))
    throw new Error("Consumer lockfile contains workspace or repository references");
  report.checks.install = {
    passed: true,
    lockfile: "pnpm-lock.yaml",
    lockDigest: digest(lock),
    noWorkspaceReferences: true,
  };
  run(["corepack", "pnpm", "exec", "tsc", "--project", "tsconfig.json", "--noEmit"], directory);
  report.checks.typecheck = { passed: true };
  run(["corepack", "pnpm", "exec", "vite", "build"], directory);
  report.checks.viteClientBuild = { passed: true };
  run(
    [
      "corepack",
      "pnpm",
      "exec",
      "vite",
      "build",
      "--ssr",
      "src/entry-server.tsx",
      "--outDir",
      "ssr-dist",
    ],
    directory,
  );
  report.checks.viteSsrBuild = {
    passed: true,
    explicitlyExternalPublicPackages: ["@cwa-design/react", "react", "react-dom"],
  };

  const currentManifest = JSON.parse(
    readFileSync(
      path.join(repoRoot, "packages/registry/dist/manifest/react", version, "manifest.json"),
      "utf8",
    ),
  );
  const requiredExports = [
    ...new Set([
      ...currentManifest.components.flatMap((component) => component.exports),
      "SettingsRecipe",
      "AccountPanelRecipe",
      "AiWorkspaceRecipe",
    ]),
  ];
  writeFileSync(
    path.join(directory, "expected.json"),
    `${JSON.stringify({ version, repoRoot, requiredExports }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(directory, "verify-server.mjs"),
    `import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Cwa from "@cwa-design/react";
import { render } from "./ssr-dist/entry-server.js";
const expected = JSON.parse(readFileSync("expected.json", "utf8"));
const installedPackageRoot = path.dirname(fileURLToPath(import.meta.resolve("@cwa-design/react/package.json")));
const installedPackage = JSON.parse(readFileSync(path.join(installedPackageRoot, "package.json"), "utf8"));
assert.equal(installedPackage.version, expected.version);
assert.ok(!realpathSync(installedPackageRoot).startsWith(expected.repoRoot + path.sep));
for (const name of expected.requiredExports) assert.ok(name in Cwa, "Missing public export: " + name);
for (const map of [installedPackage.dependencies, installedPackage.devDependencies, installedPackage.peerDependencies]) for (const value of Object.values(map ?? {})) assert.ok(!String(value).includes("workspace:"));
const publicCssPath = fileURLToPath(import.meta.resolve("@cwa-design/react/styles.css"));
assert.ok(readFileSync(publicCssPath, "utf8").includes("material"));
const html = render();
assert.ok(html.includes("Independent tarball consumer"));
assert.ok(html.includes("Ready"));
assert.ok(html.includes('data-cwa-surface="glass"'));
assert.ok(html.includes("cwa-design-material"));
const builtHtml = readFileSync("dist/index.html", "utf8");
const document = builtHtml.replace('<div id="root"></div>', '<div id="root">' + html + '</div>');
const cssAssets = [...builtHtml.matchAll(/href="([^"]+\\.css)"/g)].map((match) => match[1]);
const scriptAssets = [...builtHtml.matchAll(/src="([^"]+\\.js)"/g)].map((match) => match[1]);
assert.ok(cssAssets.length > 0 && scriptAssets.length > 0);
const server = createServer((request, response) => {
  if (request.url === "/") { response.setHeader("Content-Type", "text/html; charset=utf-8"); response.end(document); return; }
  if (![...cssAssets, ...scriptAssets].includes(request.url)) { response.statusCode = 404; response.end("Not found"); return; }
  response.setHeader("Content-Type", request.url.endsWith(".css") ? "text/css" : "text/javascript");
  response.end(readFileSync(path.join("dist", request.url.slice(1))));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port;
const page = await fetch(base + "/"); assert.equal(page.status, 200); assert.ok((await page.text()).includes(html));
for (const asset of [...cssAssets, ...scriptAssets]) assert.equal((await fetch(base + asset)).status, 200);
const missing = await fetch(base + "/missing"); assert.equal(missing.status, 404);
let computedStyles = null;
if (process.env.CWA_SKIP_BROWSER !== "1") {
  // N01/V02/V05：粘贴官网导出的 CSS + my-cwa-theme 类后，独立消费页的计算样式
  // 与 Portal 覆盖必须生效（V07：playwright 来自仓库内 @cwa-design/qa）。
  const { createRequire } = await import("node:module");
  const qaRequire = createRequire(path.join(expected.repoRoot, "packages/qa/package.json"));
  const { chromium } = qaRequire("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ colorScheme: "dark" });
  const browserPage = await context.newPage();
  await browserPage.goto(base + "/");
  const normalize = (value) => value.replace(/\\s+/g, "");
  const readFill = (testId) => browserPage.evaluate((id) => {
    const el = document.querySelector("[data-testid=" + id + "]");
    return getComputedStyle(el).backgroundColor;
  }, testId);
  const readAccent = (testId) => browserPage.evaluate((id) => {
    const el = document.querySelector("[data-testid=" + id + "]");
    return getComputedStyle(el).getPropertyValue("--cwa-design-color-accent").trim();
  }, testId);
  const openAndCheck = async (triggerId, popupId, expectations) => {
    await browserPage.click("[data-testid=" + triggerId + "]");
    await browserPage.waitForSelector("[data-testid=" + popupId + "]", { state: "visible" });
    const actual = {};
    for (const [key, reader] of Object.entries(expectations)) actual[key] = await reader(popupId);
    await browserPage.keyboard.press("Escape");
    await browserPage.waitForSelector("[data-testid=" + popupId + "]", { state: "hidden" });
    return actual;
  };
  await browserPage.waitForSelector("[data-testid=scoped-surface]");
  const scoped = await readFill("scoped-surface");
  const fallback = await readFill("default-dark-surface");
  assert.equal(normalize(scoped), "rgba(28,29,34,0.67)", "scoped .my-cwa-theme override applies in the consumer page");
  assert.equal(normalize(fallback), "rgba(28,29,34,0.68)", "unscoped dark surface keeps the theme default");
  // V02：body Portal 继承作用域覆盖。
  const bodyPortal = await openAndCheck("portal-trigger", "portal-popup", {
    fill: readFill,
  });
  assert.equal(normalize(bodyPortal.fill), "rgba(28,29,34,0.67)", "glass popover in body portal inherits the scoped fill");
  // 自定义容器：浮层挂在容器内且覆盖一致。
  await browserPage.click("[data-testid=custom-portal-trigger]");
  await browserPage.waitForSelector("[data-testid=custom-portal-popup]", { state: "visible" });
  const inContainer = await browserPage.evaluate(() => {
    const popup = document.querySelector("[data-testid=custom-portal-popup]");
    const container = document.querySelector("[data-testid=custom-portal-container]");
    return { inside: container.contains(popup), fill: getComputedStyle(popup).backgroundColor };
  });
  assert.ok(inContainer.inside, "custom portal container hosts the popup");
  assert.equal(normalize(inContainer.fill), "rgba(28,29,34,0.67)", "custom-container popup keeps the scoped fill");
  await browserPage.keyboard.press("Escape");
  // 嵌套：外层默认浅色玻璃，内层继承暗色覆盖与 Jade accent。
  const outer = await openAndCheck("outer-portal-trigger", "outer-portal-popup", { fill: readFill });
  assert.equal(normalize(outer.fill), "rgba(255,255,255,0.52)", "outer nested portal uses the light default");
  const inner = await openAndCheck("inner-portal-trigger", "inner-portal-popup", {
    fill: readFill,
    accent: readAccent,
  });
  assert.equal(normalize(inner.fill), "rgba(28,29,34,0.67)", "inner nested portal inherits its own override");
  assert.equal(inner.accent, "#087a6a", "inner nested portal inherits the Jade accent");
  // 打开中动态更新 Provider style → Portal 重同步。
  await browserPage.click("[data-testid=dynamic-portal-trigger]");
  await browserPage.waitForSelector("[data-testid=dynamic-portal-popup]", { state: "visible" });
  assert.equal(normalize(await readFill("dynamic-portal-popup")), "rgba(28,29,34,0.67)", "dynamic portal starts at the scoped fill");
  await browserPage.click("[data-testid=dynamic-toggle]");
  await browserPage.waitForFunction(() => {
    const popup = document.querySelector("[data-testid=dynamic-portal-popup]");
    return popup && getComputedStyle(popup).backgroundColor.replace(/\\s+/g, "") === "rgba(28,29,34,0.82)";
  }, undefined, { timeout: 5000 });
  const dynamicAfterReopen = await (async () => {
    await browserPage.keyboard.press("Escape");
    await browserPage.waitForSelector("[data-testid=dynamic-portal-popup]", { state: "hidden" });
    await browserPage.click("[data-testid=dynamic-portal-trigger]");
    await browserPage.waitForSelector("[data-testid=dynamic-portal-popup]", { state: "visible" });
    return readFill("dynamic-portal-popup");
  })();
  assert.equal(normalize(dynamicAfterReopen), "rgba(28,29,34,0.82)", "reopened portal keeps the updated override");
  await browserPage.keyboard.press("Escape");
  // V05：Select.Trigger 默认公共样式（类与控件底色，非原生灰）。
  const triggerStyle = await browserPage.evaluate(() => {
    const el = document.querySelector("[data-testid=consumer-select-trigger]");
    const cs = getComputedStyle(el);
    return { className: el.className, background: cs.backgroundColor, borderRadius: cs.borderRadius, minHeight: cs.minHeight };
  });
  assert.ok(triggerStyle.className.includes("cwa-design-select__trigger"), "consumer Select.Trigger carries the CWA class");
  assert.notEqual(triggerStyle.background, "rgb(239, 239, 239)", "Select.Trigger no longer uses the native gray");
  assert.equal(triggerStyle.borderRadius, "12px", "Select.Trigger has the CWA radius");
  await browser.close();
  computedStyles = {
    scopedFill: scoped,
    unscopedDarkFill: fallback,
    portalChecks: { bodyPortal, customContainer: inContainer, outer, inner },
    selectTrigger: triggerStyle,
    engine: "chromium",
  };
}
await new Promise((resolve) => server.close(resolve));
console.log(JSON.stringify({ installedPackageRoot, installedPackageVersion: installedPackage.version, publicCssPath, packageIsWorkspaceLinked: false, publicExports: Object.keys(Cwa).sort(), requiredExportsVerified: expected.requiredExports.length, ssrMarkupCharacters: html.length, http: { status: page.status, missingStatus: missing.status, cssAssets, scriptAssets }, computedStyles, passed: true }));
`,
  );
  const proof = JSON.parse(run(["node", "verify-server.mjs"], directory));
  report.checks.installedPublicExportsAndSsrServer = proof;
  const assetFiles = readdirSync(path.join(directory, "dist/assets"));
  const cssFiles = assetFiles.filter((file) => file.endsWith(".css"));
  const css = cssFiles
    .map((file) => readFileSync(path.join(directory, "dist/assets", file), "utf8"))
    .join("\n");
  for (const required of [
    "cwa-design-material",
    "backdrop-filter",
    "--cwa-design-focus-width",
    "--cwa-design-color-glass-rim-top",
  ])
    if (!css.includes(required)) throw new Error(`Built public CSS misses ${required}`);
  report.checks.bundledPublicCss = {
    passed: true,
    material: true,
    focusTokens: true,
    opticalRim: true,
  };
  report.assets = {
    files: assetFiles.map((file) => {
      const bytes = readFileSync(path.join(directory, "dist/assets", file));
      return { file, bytes: bytes.byteLength, gzipBytes: gzipSync(bytes).byteLength };
    }),
    ssrBytes: statSync(path.join(directory, "ssr-dist/entry-server.js")).size,
  };
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error instanceof Error ? error.message : String(error);
  if (error && typeof error === "object" && "stdout" in error)
    report.commandOutput = String(error.stdout).slice(-12000);
  process.exitCode = 1;
}
report.elapsedMs = Date.now() - startedAt;
mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify({
    status: report.status,
    version,
    reportPath,
    directory: report.consumer.directory,
    elapsedMs: report.elapsedMs,
  }),
);
