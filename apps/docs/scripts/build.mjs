import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";
import { getSiteData } from "./site-data.mjs";

const root = path.resolve(import.meta.dirname, "..");
const repo = path.resolve(root, "../..");
const base = process.env.CWA_BASE ?? "/";
if (!base.startsWith("/") || !base.endsWith("/"))
  throw new Error("CWA_BASE must start and end with /");
const origin = process.env.CWA_SITE_ORIGIN ?? "https://whyfail.github.io";
const siteData = getSiteData();
const pkg = JSON.parse(await readFile(path.join(repo, "packages/react/package.json"), "utf8"));
const porcelain = execFileSync("git", ["status", "--porcelain"], { cwd: repo, encoding: "utf8" });
const changedPaths = porcelain
  .split("\n")
  .filter(Boolean)
  .map((line) => line.slice(3).replace(/^"|"$/g, ""));
// 生成物（跟踪在仓库里、由 registry/skill 构建或验证流程产出）与源码改动分开记录；
// dirty 保持整体语义，不把生成物变化强行算成源码未提交，也不写 false。
const generatedPatterns = [/^skills\/cwa-design\/references\//, /^reports\//];
const generatedChanged = changedPaths.filter((file) =>
  generatedPatterns.some((pattern) => pattern.test(file)),
);
const sourceChanged = changedPaths.filter(
  (file) => !generatedPatterns.some((pattern) => pattern.test(file)),
);
const release = {
  version: pkg.version,
  commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
  dirty: changedPaths.length > 0,
  channel: "source",
  sourceState: {
    dirty: sourceChanged.length > 0,
    changedFiles: sourceChanged.length,
    ...(sourceChanged.length ? { sample: sourceChanged.slice(0, 10) } : {}),
  },
  generatedState: {
    dirty: generatedChanged.length > 0,
    changedFiles: generatedChanged.length,
    note: "跟踪在仓库中的生成物（skill references / 验证报告）在候选版构建期间允许有变化；与源码状态分开评估。",
    ...(generatedChanged.length ? { sample: generatedChanged.slice(0, 10) } : {}),
  },
};
const common = { root, base, define: { __CWA_RELEASE__: JSON.stringify(release) } };
await build({ ...common, build: { outDir: "dist", emptyOutDir: true } });
await build({
  ...common,
  build: {
    outDir: ".ssr",
    emptyOutDir: true,
    ssr: "src/entry-server.tsx",
    rolldownOptions: {
      external: (id) => /^react(?:$|\/)/.test(id) || /\/node_modules\/react\//.test(id),
      output: { entryFileNames: "entry-server.js" },
    },
  },
});
const { routes, render } = await import(
  pathToFileURL(path.join(root, ".ssr/entry-server.js")).href
);
const template = await readFile(path.join(root, "dist/index.html"), "utf8");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const dist = path.join(root, "dist");
const markdownLinks = [];
for (const route of routes) {
  const url = `${origin}${base}${route.path.replace(/^\//, "")}`;
  const title = route.path === "/" ? route.title : `${route.title} — CWA Design`;
  const head = `<title>${escape(title)}</title><meta name="description" content="${escape(route.description)}"><link rel="canonical" href="${escape(url)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(route.description)}"><meta property="og:url" content="${escape(url)}">${route.path === "/404.html" ? '<meta name="robots" content="noindex">' : ""}`;
  const data = JSON.stringify({ route: route.path }).replaceAll("<", "\\u003c");
  const examples = siteData.manifest.examples.filter(
    (example) => route.kind === "component" && example.componentId === route.id,
  );
  const sourceFiles = [
    ...examples.map((example) => example.file),
    ...(route.kind === "pattern" || route.kind === "patterns"
      ? siteData.manifest.recipes
          .filter((recipe) => !route.id || recipe.id === route.id)
          .flatMap((recipe) => recipe.files)
      : []),
  ];
  const pageData = {
    ...siteData,
    manifest: {
      ...siteData.manifest,
      artifacts: [],
      components: siteData.manifest.components.map((component) =>
        route.kind === "component" && component.id === route.id
          ? component
          : { ...component, props: {}, compoundParts: {}, a11y: [], extends: [] },
      ),
      examples,
    },
    sources: Object.fromEntries(sourceFiles.map((file) => [file, siteData.sources[file]])),
    tokens: route.id ? { [route.id]: siteData.tokens[route.id] ?? [] } : {},
    skill: route.path === "/ai/skill/" ? siteData.skill : "",
  };
  const body = render(route.path);
  const html = template
    .replace("<!--cwa-head-->", head)
    .replace("<!--cwa-app-->", () => body)
    .replace(
      "<!--cwa-data-->",
      `<script id="cwa-page-data" type="application/json">${data}</script><script id="cwa-site-data" type="application/json">${JSON.stringify(pageData).replaceAll("<", "\\u003c")}</script>`,
    );
  const output = path.join(
    root,
    "dist",
    route.path === "/404.html" ? "404.html" : `${route.path.replace(/^\//, "")}index.html`,
  );
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, html);
  if (route.kind !== "not-found") {
    const main = /<main\b[^>]*>([\s\S]*?)<\/main>/.exec(body)?.[1] ?? "";
    const markdown = main
      .replace(/<svg\b[\s\S]*?<\/svg>/g, "")
      .replace(/<h([1-6])[^>]*>/g, (_, level) => `\n\n${"#".repeat(Number(level))} `)
      .replace(/<\/h[1-6]>/g, "\n\n")
      .replace(
        /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g,
        (_, source) => `\n\n\`\`\`\n${source}\n\`\`\`\n\n`,
      )
      .replace(
        /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
        (_, link, text) => `[${text.replace(/<[^>]+>/g, "")} ](${link})`,
      )
      .replace(/<li\b[^>]*>/g, "\n- ")
      .replace(/<\/(p|div|section|ul|tr|details)>/g, "\n\n")
      .replace(/<br\s*\/?\s*>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const markdownPath = `markdown${route.path}index.md`;
    await mkdir(path.dirname(path.join(dist, markdownPath)), { recursive: true });
    await writeFile(
      path.join(dist, markdownPath),
      `<!-- CWA Design ${pkg.version}; Registry ${siteData.manifest.registryDigest} -->\n\n${markdown}\n`,
    );
    markdownLinks.push(`- [${route.title}](${origin}${base}${markdownPath}): ${route.description}`);
  }
}
await writeFile(path.join(dist, ".nojekyll"), "");
await writeFile(
  path.join(dist, "release.json"),
  `${JSON.stringify({ ...release, registryDigest: siteData.manifest.registryDigest }, null, 2)}\n`,
);
await writeFile(path.join(dist, "routes.json"), JSON.stringify(routes, null, 2));
await writeFile(
  path.join(dist, "search-index.json"),
  JSON.stringify(
    routes.filter((route) => route.kind !== "not-found"),
    null,
    2,
  ),
);
await writeFile(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes
    .filter((route) => route.kind !== "not-found")
    .map(
      (route) =>
        `<url><loc>${escape(`${origin}${base}${route.path.replace(/^\//, "")}`)}</loc></url>`,
    )
    .join("")}</urlset>`,
);
await writeFile(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${origin}${base}sitemap.xml\n`,
);
await writeFile(
  path.join(dist, "llms.txt"),
  `# CWA Design\n\n> React design system, ${pkg.version}. Source candidate; npm publication unverified.\n\nRegistry digest: ${siteData.manifest.registryDigest}\n\n## Documentation\n${markdownLinks.join("\n")}\n`,
);
await cp(
  path.join(repo, "packages/registry/dist/manifest/react"),
  path.join(dist, "downloads/registry"),
  { recursive: true },
);
await cp(
  path.join(repo, "packages/react/src"),
  path.join(dist, "downloads/source/packages/react/src"),
  { recursive: true },
);
await mkdir(path.join(dist, "downloads"), { recursive: true });
await cp(
  path.join(repo, "packages/react/node_modules/@base-ui/react"),
  path.join(dist, "downloads/source/@base-ui/react"),
  { recursive: true, dereference: true },
);
execFileSync("tar", [
  "-czf",
  path.join(dist, "downloads", `cwa-design-skill-${pkg.version}.tar.gz`),
  "-C",
  path.join(repo, "skills"),
  "cwa-design",
]);
execFileSync(
  "corepack",
  [
    "pnpm",
    "--filter",
    "@cwa-design/react",
    "pack",
    "--pack-destination",
    path.join(dist, "downloads"),
  ],
  { cwd: repo, stdio: "inherit" },
);
await cp(path.join(repo, "apps/storybook/storybook-static"), path.join(dist, "storybook"), {
  recursive: true,
});
console.log(
  `SSG: ${routes.length} real HTML routes; base=${base}; ${release.version} (${release.commit.slice(0, 7)})`,
);
