import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type ComponentRecord,
  getComponent,
  getManifest,
  RegistryError,
  type RegistryManifest,
} from "@cwa-design/registry";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const SCHEMA_VERSION = "1.0.0";
const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// 本地快照优先；缺失时报 REGISTRY_UNAVAILABLE 而非联网（离线优先，§13.1）。
const manifestDir = path.join(
  pkgRoot,
  "node_modules",
  "@cwa-design/registry",
  "dist",
  "manifest",
  "react",
);

function loadManifests(): RegistryManifest[] {
  if (!existsSync(manifestDir)) {
    throw new RegistryError("REGISTRY_UNAVAILABLE", `本地 registry 快照缺失: ${manifestDir}`);
  }
  return readdirSync(manifestDir).map(
    (version) => JSON.parse(readFileSync(path.join(manifestDir, version, "manifest.json"), "utf8")) as RegistryManifest,
  );
}

function okEnvelope(data: unknown, libraryVersion: string, warnings: string[] = []) {
  const structured = {
    schemaVersion: SCHEMA_VERSION,
    libraryVersion,
    data,
    warnings,
    truncated: false,
    nextCursor: null as string | null,
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(structured, null, 2) }],
    structuredContent: structured,
  };
}

/**
 * CWA Design MCP（T29）：只读工具集，消费本地 registry manifest 快照。
 * 无写工具、无命令执行、无网络（离线快照）；stdout 仅协议数据。
 */
export function createCwaDesignServer() {
  const manifests = loadManifests();
  const libraryVersion = manifests[0]?.libraryVersion ?? "0.0.0";

  const server = new McpServer(
    { name: "cwa-design", version: libraryVersion },
    {
      instructions:
        "Read-only CWA Design component registry. Call cwa_design_get_capabilities first, then query components/examples/tokens/recipes for the exact installed version. Never invent props or imports.",
    },
  );

  server.registerTool(
    "cwa_design_get_capabilities",
    {
      title: "Get CWA Design capabilities",
      description:
        "Returns schema/library versions, supported frameworks and the tool list. Read-only.",
      inputSchema: z.object({ framework: z.enum(["react"]).optional() }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ framework }) =>
      okEnvelope(
        {
          framework: framework ?? "react",
          registryVersions: manifests.map((m) => m.libraryVersion),
          components: manifests[0]?.components.length ?? 0,
          recipes: manifests[0]?.recipes.length ?? 0,
          tools: [
            "cwa_design_get_capabilities",
            "cwa_design_search_components",
            "cwa_design_get_component",
            "cwa_design_get_example",
            "cwa_design_get_tokens",
            "cwa_design_get_recipe",
            "cwa_design_plan_installation",
            "cwa_design_get_migration",
          ],
        },
        libraryVersion,
      ),
  );

  server.registerTool(
    "cwa_design_search_components",
    {
      title: "Search CWA Design components",
      description:
        "Search components by id/name/material/a11y keyword. Returns summaries; nextCursor present when truncated.",
      inputSchema: z.object({
        framework: z.enum(["react"]).optional(),
        version: z.string().optional(),
        query: z.string().max(100).optional(),
        limit: z.number().int().min(1).max(50).optional(),
        cursor: z.string().optional(),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ query, limit, cursor }) => {
      const manifest = manifests[0]!;
      let pool = manifest.components;
      if (query) {
        const q = query.toLowerCase();
        pool = pool.filter(
          (c) =>
            c.id.includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.materialPolicy.includes(q) ||
            c.a11y.some((a) => a.includes(q)),
        );
      }
      const start = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
      const size = limit ?? 10;
      const page = pool.slice(start, start + size);
      const nextCursor = start + size < pool.length ? String(start + size) : null;
      const warnings = nextCursor !== null ? ["结果已分页；用 nextCursor 继续"] : [];
      const structured = {
        schemaVersion: SCHEMA_VERSION,
        libraryVersion,
        data: {
          results: page.map((c) => ({ id: c.id, name: c.name, status: c.status })),
          total: pool.length,
        },
        warnings,
        truncated: nextCursor !== null,
        nextCursor,
      };
      return {
        content: [{ type: "text" as const, text: JSON.stringify(structured, null, 2) }],
        structuredContent: structured,
      };
    },
  );

  server.registerTool(
    "cwa_design_get_component",
    {
      title: "Get CWA Design component contract",
      description:
        "Full contract (props/materialPolicy/a11y/exports) for a component id at an exact version.",
      inputSchema: z.object({
        framework: z.enum(["react"]).optional(),
        version: z.string().optional(),
        id: z.string().min(1),
        sections: z.array(z.enum(["api", "a11y", "material", "examples"])).optional(),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ version, id, sections }) => {
      const manifest = getManifest(manifests, "react", version ?? libraryVersion);
      const record: ComponentRecord = getComponent(manifest, id);
      const data =
        sections && sections.length > 0
          ? Object.fromEntries(
              sections.map((s) => [
                s,
                s === "api"
                  ? record.props
                  : s === "a11y"
                    ? record.a11y
                    : s === "material"
                      ? record.materialPolicy
                      : record.examples,
              ]),
            )
          : record;
      return okEnvelope(data, manifest.libraryVersion);
    },
  );

  server.registerTool(
    "cwa_design_get_example",
    {
      title: "Get a verified CWA Design example",
      description: "Returns a compiled example's imports, digest and compile status by exampleId.",
      inputSchema: z.object({
        framework: z.enum(["react"]).optional(),
        version: z.string().optional(),
        exampleId: z.string().min(1),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ version, exampleId }) => {
      const manifest = getManifest(manifests, "react", version ?? libraryVersion);
      const example = manifest.examples.find((e) => e.id === exampleId);
      if (!example) {
        throw new RegistryError(
          "INVALID_INPUT",
          `示例 "${exampleId}" 不存在于 ${manifest.libraryVersion}`,
        );
      }
      return okEnvelope(example, manifest.libraryVersion);
    },
  );

  server.registerTool(
    "cwa_design_get_tokens",
    {
      title: "Get CWA Design tokens",
      description:
        "Token groups for a theme. Groups: primitive, semantic-light, semantic-dark, motion.",
      inputSchema: z.object({
        version: z.string().optional(),
        theme: z.enum(["light", "dark", "all"]).optional(),
        groups: z
          .array(z.enum(["primitive", "semantic-light", "semantic-dark", "motion"]))
          .optional(),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ version, theme, groups }) => {
      getManifest(manifests, "react", version ?? libraryVersion);
      const tokensPath = path.join(
        pkgRoot,
        "node_modules",
        "@cwa-design/tokens",
        "dist",
        "tokens.json",
      );
      if (!existsSync(tokensPath)) {
        throw new RegistryError("REGISTRY_UNAVAILABLE", "本地 tokens 快照缺失");
      }
      const tokens = JSON.parse(readFileSync(tokensPath, "utf8")) as {
        primitive: unknown;
        semantic: { light: unknown; dark: unknown };
        motion: unknown;
      };
      const wanted = groups ?? ["primitive", `semantic-${theme ?? "light"}`, "motion"];
      const data: Record<string, unknown> = {};
      for (const g of wanted) {
        if (g === "primitive") data.primitive = tokens.primitive;
        else if (g === "semantic-light") data["semantic-light"] = tokens.semantic.light;
        else if (g === "semantic-dark") data["semantic-dark"] = tokens.semantic.dark;
        else data.motion = tokens.motion;
      }
      return okEnvelope(data, libraryVersion);
    },
  );

  server.registerTool(
    "cwa_design_get_recipe",
    {
      title: "Get a CWA Design recipe",
      description:
        "Returns a recipe's component composition and files. Alpha ships no recipes yet (empty registry).",
      inputSchema: z.object({
        framework: z.enum(["react"]).optional(),
        version: z.string().optional(),
        recipeId: z.string().min(1),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ version, recipeId }) => {
      const manifest = getManifest(manifests, "react", version ?? libraryVersion);
      const recipe = manifest.recipes.find((r) => r.id === recipeId);
      if (!recipe) {
        throw new RegistryError(
          "INVALID_INPUT",
          `recipe "${recipeId}" 不存在于 ${manifest.libraryVersion}（Alpha 无 recipes）`,
        );
      }
      return okEnvelope(recipe, manifest.libraryVersion);
    },
  );

  server.registerTool(
    "cwa_design_plan_installation",
    {
      title: "Plan CWA Design installation",
      description:
        "Reviewable installation plan (packages, styles entry, provider setup) for the exact version. No writes.",
      inputSchema: z.object({
        framework: z.enum(["react"]),
        version: z.string().optional(),
        packageManager: z.enum(["pnpm", "npm", "yarn"]).optional(),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ packageManager }) => {
      const add: Record<string, string> = {
        pnpm: "pnpm add @cwa-design/react",
        npm: "npm install @cwa-design/react",
        yarn: "yarn add @cwa-design/react",
      };
      return okEnvelope(
        {
          version: libraryVersion,
          install: add[packageManager ?? "pnpm"],
          stylesImport: "@cwa-design/react/styles.css",
          provider: {
            component: "CwaProvider",
            props: { theme: "system", material: "auto", motion: "system" },
          },
          warnings: ["plan 只读；apply 由 CLI 显式执行"],
        },
        libraryVersion,
      );
    },
  );

  server.registerTool(
    "cwa_design_get_migration",
    {
      title: "Get CWA Design migration notes",
      description:
        "Migration notes between versions. Alpha has a single version; other pairs return INVALID_INPUT.",
      inputSchema: z.object({
        framework: z.enum(["react"]),
        fromVersion: z.string().min(1),
        toVersion: z.string().min(1),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ fromVersion, toVersion }) => {
      if (fromVersion === toVersion) {
        return okEnvelope({ changes: [], note: "版本相同，无需迁移" }, libraryVersion);
      }
      throw new RegistryError(
        "INVALID_INPUT",
        `迁移 ${fromVersion} → ${toVersion} 尚无记录（当前仅 ${libraryVersion}）`,
      );
    },
  );

  return server;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  serveStdio(() => createCwaDesignServer(), { legacy: "serve" });
}
