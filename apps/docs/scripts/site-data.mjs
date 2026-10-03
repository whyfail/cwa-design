import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "../../..");
export function getSiteData() {
  const version = JSON.parse(
    readFileSync(path.join(repo, "packages/react/package.json"), "utf8"),
  ).version;
  const versionRoot = path.join(repo, "packages/registry/dist/manifest/react", version);
  const manifestPath = path.join(versionRoot, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error(`Build the exact registry first: ${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.libraryVersion !== version || manifest.components.length !== 30)
    throw new Error("Docs require the matching 30-component release manifest");
  const sources = {};
  for (const artifact of manifest.artifacts ?? []) {
    const bytes = readFileSync(path.join(versionRoot, artifact.path));
    if (`sha256:${createHash("sha256").update(bytes).digest("hex")}` !== artifact.contentDigest)
      throw new Error(`Artifact digest mismatch: ${artifact.path}`);
    if (/^(examples|recipes)\/.*\.tsx$/.test(artifact.path) || artifact.path.endsWith("SKILL.md"))
      sources[artifact.path] = bytes.toString("utf8");
  }
  for (const example of manifest.examples) {
    if (!example.sourcePath || !example.exportName || !example.compiled || !sources[example.file])
      throw new Error(`Example contract incomplete: ${example.id}`);
    const raw = readFileSync(path.join(repo, example.sourcePath));
    if (`sha256:${createHash("sha256").update(raw).digest("hex")}` !== example.contentDigest)
      throw new Error(`Preview source mismatch: ${example.id}`);
  }
  for (const component of manifest.components) {
    if (Object.keys(component.props).length === 0)
      throw new Error(`API metadata is empty: ${component.id}`);
    if (!manifest.examples.some((example) => example.componentId === component.id))
      throw new Error(`Component example missing: ${component.id}`);
  }
  const tokens = {};
  for (const component of manifest.components) {
    const cssPath = path.join(repo, "packages/react/src", component.id, `${component.id}.css`);
    const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
    tokens[component.id] = [
      ...new Set([...css.matchAll(/var\((--cwa-design-[a-z0-9-]+)/g)].map((match) => match[1])),
    ];
  }
  const storybook = {};
  const storyIndex = path.join(repo, "apps/storybook/storybook-static/index.json");
  if (existsSync(storyIndex)) {
    const entries = Object.values(JSON.parse(readFileSync(storyIndex, "utf8")).entries);
    for (const component of manifest.components) {
      const term = component.name.replace(/^Cwa/, "").toLowerCase();
      const normalize = (value) => value.replace(/[^a-z]/gi, "").toLowerCase();
      const entry =
        entries.find(
          (story) =>
            story.type === "story" && normalize(story.title.split("/").at(-1)) === normalize(term),
        ) ??
        entries.find(
          (story) =>
            story.type === "story" && new RegExp(`\\b${term}(?:s|es)?\\b`, "i").test(story.name),
        );
      if (entry) storybook[component.id] = entry.id;
    }
  }
  const skillPath = Object.keys(sources).find((file) => file.endsWith("SKILL.md"));
  return {
    manifest,
    sources,
    tokens,
    storybook,
    skill: skillPath
      ? sources[skillPath]
      : readFileSync(path.join(repo, "skills/cwa-design/SKILL.md"), "utf8"),
  };
}

export function siteDataPlugin() {
  const id = "\0virtual:cwa-site-data";
  return {
    name: "cwa-release-data",
    resolveId(source) {
      if (source === "virtual:cwa-site-data") return id;
    },
    load(source, options) {
      if (source !== id) return;
      if (options?.ssr || this.environment?.config?.consumer === "server")
        return `export default ${JSON.stringify(getSiteData())};`;
      return 'const element = document.getElementById("cwa-site-data"); if (!element) throw new Error("CWA page data missing; rebuild the static site"); export default JSON.parse(element.textContent);';
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        return context.server
          ? html.replace(
              "<!--cwa-data-->",
              `<script id="cwa-site-data" type="application/json">${JSON.stringify(getSiteData()).replaceAll("<", "\\u003c")}</script>`,
            )
          : html;
      },
    },
  };
}
