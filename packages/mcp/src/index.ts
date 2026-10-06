#!/usr/bin/env node
import { Buffer } from "node:buffer";
import { pathToFileURL } from "node:url";
import { getComponent, getManifest, RegistryError } from "@cwa-design/registry";
import {
  contentDigest,
  currentLibraryVersion,
  loadSnapshots,
  type RegistrySnapshot,
  readArtifact,
} from "@cwa-design/registry/snapshot";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

const SCHEMA_VERSION = "1.1.0";
const MAX_RESPONSE_BYTES = 12 * 1024;
const annotations = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };
const versionInput = z.string().max(128).optional();
const toolNames = [
  "cwa_design_get_capabilities",
  "cwa_design_search_components",
  "cwa_design_get_component",
  "cwa_design_get_example",
  "cwa_design_get_tokens",
  "cwa_design_get_recipe",
  "cwa_design_plan_installation",
  "cwa_design_get_migration",
];

function envelope(
  data: unknown,
  libraryVersion: string,
  warnings: string[] = [],
  nextCursor: string | null = null,
) {
  const structured = {
    schemaVersion: SCHEMA_VERSION,
    libraryVersion,
    data,
    warnings,
    truncated: nextCursor !== null,
    nextCursor,
  };
  const text = JSON.stringify(structured, null, 2);
  const result = { content: [{ type: "text" as const, text }], structuredContent: structured };
  if (Buffer.byteLength(JSON.stringify(result)) > MAX_RESPONSE_BYTES) {
    throw new RegistryError(
      "INVALID_INPUT",
      "完整工具响应超过 12 KiB；请用 sections/part、limit 或 cursor 缩小查询。不会静默丢弃源码/API。",
    );
  }
  return result;
}

function guarded(action: () => ReturnType<typeof envelope>) {
  try {
    return action();
  } catch (error) {
    if (!(error instanceof RegistryError)) throw error;
    const structured = {
      schemaVersion: SCHEMA_VERSION,
      error: { code: error.code, message: error.message },
      warnings: [],
      truncated: false,
      nextCursor: null,
    };
    return {
      isError: true,
      content: [{ type: "text" as const, text: JSON.stringify(structured, null, 2) }],
      structuredContent: structured,
    };
  }
}

function cursorOffset(cursor: string | undefined, scope: string): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      scope: string;
      offset: number;
    };
    if (parsed.scope !== scope || !Number.isSafeInteger(parsed.offset) || parsed.offset < 0)
      throw new Error("invalid cursor");
    return parsed.offset;
  } catch {
    throw new RegistryError(
      "INVALID_INPUT",
      "cursor 不属于当前查询，或格式无效；请从不带 cursor 的查询重新开始。",
    );
  }
}
function nextPage(scope: string, offset: number) {
  return Buffer.from(JSON.stringify({ scope, offset })).toString("base64url");
}

function sourceEnvelope(
  metadata: Record<string, unknown>,
  snapshot: RegistrySnapshot,
  files: string[],
  scope: string,
  cursor?: string,
  limit = 2000,
) {
  const artifacts = files.map((file) => ({ file, ...readArtifact(snapshot, file) }));
  const characters = artifacts.map((artifact) => Array.from(artifact.content));
  const totalCharacters = characters.reduce((sum, content) => sum + content.length, 0);
  const start = cursorOffset(cursor, scope);
  if (start > totalCharacters) throw new RegistryError("INVALID_INPUT", "cursor 超出源码范围。");
  let fileStart = 0;
  const fileIndex = characters.findIndex((content, index) => {
    if (start < fileStart + content.length || index === characters.length - 1) return true;
    fileStart += content.length;
    return false;
  });
  const artifact = artifacts[fileIndex]!;
  const content = characters[fileIndex]!;
  const offset = start - fileStart;
  let size = Math.min(limit, content.length - offset);
  while (size >= 0) {
    const source = content.slice(offset, offset + size).join("");
    const nextOffset = start + size;
    const nextCursor = nextOffset < totalCharacters ? nextPage(scope, nextOffset) : null;
    const sourcePage = {
      file: artifact.file,
      offset,
      nextOffset: offset + size,
      totalCharacters: content.length,
      complete: offset === 0 && size === content.length,
      chunkDigest: contentDigest(source),
    };
    const data =
      files.length === 1 && metadata.exampleId !== undefined
        ? { ...metadata, source, artifact: artifact.record, sourcePage }
        : {
            ...metadata,
            sources: [{ file: artifact.file, source, artifact: artifact.record, sourcePage }],
          };
    try {
      return envelope(
        data,
        snapshot.manifest.libraryVersion,
        nextCursor
          ? [
              "源码已分页；按 file 与 sourcePage.offset 顺序拼接所有页，再校验 artifact.contentDigest（完整文件 hash）。offset 按 Unicode 字符计算。",
            ]
          : [],
        nextCursor,
      );
    } catch (error) {
      if (!(error instanceof RegistryError) || error.code !== "INVALID_INPUT" || size <= 1)
        throw error;
      size = Math.floor(size / 2);
    }
  }
  throw new RegistryError("REGISTRY_UNAVAILABLE", "无法生成源码页。");
}

/** Offline, read-only stdio tools. Every read stays in its requested version snapshot. */
export function createCwaDesignServer() {
  const snapshots = loadSnapshots();
  const libraryVersion = currentLibraryVersion();
  const manifests = snapshots.map((snapshot) => snapshot.manifest);
  function select(version = libraryVersion): RegistrySnapshot {
    const manifest = getManifest(manifests, "react", version);
    return snapshots.find((snapshot) => snapshot.manifest === manifest)!;
  }
  const current = select();
  const server = new McpServer(
    { name: "cwa-design", version: libraryVersion },
    {
      instructions:
        "Read-only CWA Design registry. Start with capabilities. Query the exact installed version. Example/recipe source and tokens are hash-verified snapshot artifacts. Never invent props, imports, publication status or backend behavior.",
    },
  );

  server.registerTool(
    "cwa_design_get_capabilities",
    {
      title: "Get CWA Design capabilities",
      description: "Available exact versions, artifact capabilities and read-only tools.",
      inputSchema: z.object({ framework: z.enum(["react"]).optional() }),
      annotations,
    },
    ({ framework }) =>
      guarded(() =>
        envelope(
          {
            framework: framework ?? "react",
            registryVersions: manifests.map((m) => m.libraryVersion),
            registryDigest: current.manifest.registryDigest,
            components: current.manifest.components.length,
            recipes: current.manifest.recipes.length,
            snapshots: manifests.map((m) => ({
              version: m.libraryVersion,
              schemaVersion: m.schemaVersion,
              hasSourceArtifacts: Boolean(m.artifacts?.length),
              hasTokens: Boolean(m.tokensFile),
            })),
            responseBudgetBytes: MAX_RESPONSE_BYTES,
            responseBudgetScope:
              "UTF-8 serialized CallToolResult (text and structuredContent combined)",
            tools: toolNames,
          },
          libraryVersion,
        ),
      ),
  );

  server.registerTool(
    "cwa_design_search_components",
    {
      title: "Search CWA Design components",
      description: "Version-specific summaries. Continue with the returned query-bound cursor.",
      inputSchema: z.object({
        framework: z.enum(["react"]).optional(),
        version: versionInput,
        query: z.string().max(100).optional(),
        limit: z.number().int().min(1).max(50).optional(),
        cursor: z.string().max(1024).optional(),
      }),
      annotations,
    },
    ({ version, query, limit, cursor }) =>
      guarded(() => {
        const { manifest } = select(version);
        const q = (query ?? "").toLowerCase();
        const pool = manifest.components.filter((c) =>
          `${c.id} ${c.name} ${c.description ?? ""} ${c.materialPolicy} ${c.a11y.join(" ")}`
            .toLowerCase()
            .includes(q),
        );
        const scope = `search:${manifest.libraryVersion}:${q}`;
        const start = cursorOffset(cursor, scope);
        const size = limit ?? 10;
        if (start > pool.length) throw new RegistryError("INVALID_INPUT", "cursor 超出结果范围。");
        const nextCursor = start + size < pool.length ? nextPage(scope, start + size) : null;
        return envelope(
          {
            results: pool.slice(start, start + size).map((c) => ({
              id: c.id,
              name: c.name,
              status: c.status,
              materialPolicy: c.materialPolicy,
            })),
            total: pool.length,
          },
          manifest.libraryVersion,
          nextCursor ? ["结果已分页；用 nextCursor 继续。"] : [],
          nextCursor,
        );
      }),
  );

  server.registerTool(
    "cwa_design_get_component",
    {
      title: "Get CWA Design component contract",
      description:
        "Exact-version API, compound parts, inherited types, material and a11y. Large contracts require sections and part=root or a compound part name.",
      inputSchema: z.object({
        framework: z.enum(["react"]).optional(),
        version: versionInput,
        id: z.string().min(1).max(128),
        sections: z.array(z.enum(["api", "a11y", "material", "examples"])).optional(),
        part: z.string().min(1).max(128).optional(),
      }),
      annotations,
    },
    ({ version, id, sections, part }) =>
      guarded(() => {
        const { manifest } = select(version);
        const record = getComponent(manifest, id);
        if (part && part !== "root" && !record.compoundParts?.[part])
          throw new RegistryError(
            "INVALID_INPUT",
            `复合部件 ${part} 不存在；可用：root、${Object.keys(record.compoundParts ?? {}).join("、")}。`,
          );
        const selected =
          part && part !== "root"
            ? record.compoundParts![part]!
            : part === "root"
              ? { ...record, compoundParts: undefined }
              : record;
        const data = sections?.length
          ? Object.fromEntries(
              sections.map((section) => [
                section,
                section === "api"
                  ? {
                      props: selected.props,
                      extends: selected.extends,
                      compoundParts: part ? undefined : record.compoundParts,
                      typeName: selected.typeName,
                      sourceTypePath: selected.sourceTypePath,
                      availableParts: ["root", ...Object.keys(record.compoundParts ?? {})],
                      importPath: record.importPath,
                      exports: record.exports,
                    }
                  : section === "a11y"
                    ? record.a11y
                    : section === "material"
                      ? { policy: record.materialPolicy, notes: record.materialNotes }
                      : record.examples,
              ]),
            )
          : part
            ? selected
            : record;
        return envelope(data, manifest.libraryVersion);
      }),
  );

  server.registerTool(
    "cwa_design_get_example",
    {
      title: "Get a verified CWA Design example",
      description:
        "Compiled example plus actual TSX source and artifact hash. Follow nextCursor and concatenate source pages before verifying the full-file hash.",
      inputSchema: z.object({
        framework: z.enum(["react"]).optional(),
        version: versionInput,
        exampleId: z.string().min(1).max(128),
        cursor: z.string().max(1024).optional(),
        limit: z.number().int().min(1).max(4000).optional(),
      }),
      annotations,
    },
    ({ version, exampleId, cursor, limit }) =>
      guarded(() => {
        const snapshot = select(version);
        const example = snapshot.manifest.examples.find((e) => e.id === exampleId);
        if (!example)
          throw new RegistryError(
            "EXAMPLE_NOT_FOUND",
            `示例 ${exampleId} 不存在于 ${snapshot.manifest.libraryVersion}。`,
          );
        if (!example.file)
          throw new RegistryError(
            "REGISTRY_UNAVAILABLE",
            `版本 ${snapshot.manifest.libraryVersion} 没有该示例源码快照。`,
          );
        const artifact = readArtifact(snapshot, example.file);
        if (artifact.record.contentDigest !== example.contentDigest)
          throw new RegistryError("REGISTRY_UNAVAILABLE", "示例记录与源码 digest 不一致。");
        return sourceEnvelope(
          { ...example, exampleId },
          snapshot,
          [example.file],
          `example:${snapshot.manifest.libraryVersion}:${exampleId}`,
          cursor,
          limit,
        );
      }),
  );

  server.registerTool(
    "cwa_design_get_tokens",
    {
      title: "Get CWA Design tokens",
      description:
        "Hash-verified version-specific token groups. theme=all includes both themes. Paging preserves group/key paths.",
      inputSchema: z.object({
        version: versionInput,
        theme: z.enum(["light", "dark", "all"]).optional(),
        groups: z
          .array(z.enum(["primitive", "semantic-light", "semantic-dark", "motion"]))
          .optional(),
        limit: z.number().int().min(1).max(50).optional(),
        cursor: z.string().max(1024).optional(),
      }),
      annotations,
    },
    ({ version, theme, groups, limit, cursor }) =>
      guarded(() => {
        const snapshot = select(version);
        const { manifest } = snapshot;
        if (!manifest.tokensFile)
          throw new RegistryError(
            "REGISTRY_UNAVAILABLE",
            `版本 ${manifest.libraryVersion} 没有 Token 快照；不能借用当前版本。`,
          );
        const artifact = readArtifact(snapshot, manifest.tokensFile);
        const tokens = JSON.parse(artifact.content) as {
          libraryVersion: string;
          primitive: Record<string, unknown>;
          semantic: { light: Record<string, unknown>; dark: Record<string, unknown> };
          motion: Record<string, unknown>;
        };
        if (tokens.libraryVersion !== manifest.libraryVersion)
          throw new RegistryError("REGISTRY_UNAVAILABLE", "Token 与 Registry 版本不一致。");
        const wanted = [
          ...new Set(
            groups ?? [
              "primitive",
              ...(theme === "all"
                ? ["semantic-light", "semantic-dark"]
                : [`semantic-${theme ?? "light"}`]),
              "motion",
            ],
          ),
        ];
        const source: Record<string, Record<string, unknown>> = {
          primitive: tokens.primitive,
          "semantic-light": tokens.semantic.light,
          "semantic-dark": tokens.semantic.dark,
          motion: tokens.motion,
        };
        const entries = wanted.flatMap((group) =>
          Object.entries(source[group]!).map(([key, value]) => ({ group, key, value })),
        );
        const scope = `tokens:${manifest.libraryVersion}:${wanted.join(",")}`;
        const start = cursorOffset(cursor, scope);
        if (start > entries.length)
          throw new RegistryError("INVALID_INPUT", "cursor 超出 Token 范围。");
        let size = Math.min(limit ?? 50, entries.length - start);
        while (size >= 0) {
          const data: Record<string, unknown> = {
            artifact: artifact.record,
            totalEntries: entries.length,
          };
          for (const { group } of entries.slice(start, start + size))
            data[group] ??= {} as Record<string, unknown>;
          for (const { group, key, value } of entries.slice(start, start + size))
            (data[group] as Record<string, unknown>)[key] = value;
          const nextCursor = start + size < entries.length ? nextPage(scope, start + size) : null;
          try {
            return envelope(
              data,
              manifest.libraryVersion,
              nextCursor ? ["Token 已分页；将各页按 group/key 合并。"] : [],
              nextCursor,
            );
          } catch (error) {
            if (!(error instanceof RegistryError) || error.code !== "INVALID_INPUT" || size <= 1)
              throw error;
            size -= 1;
          }
        }
        throw new RegistryError("REGISTRY_UNAVAILABLE", "无法生成 Token 页。");
      }),
  );

  server.registerTool(
    "cwa_design_get_recipe",
    {
      title: "Get a CWA Design recipe",
      description:
        "Actual recipe composition and limitations. Follow nextCursor, merge sources by file/offset, then verify each full-file artifact hash.",
      inputSchema: z.object({
        framework: z.enum(["react"]).optional(),
        version: versionInput,
        recipeId: z.string().min(1).max(128),
        cursor: z.string().max(1024).optional(),
        limit: z.number().int().min(1).max(4000).optional(),
      }),
      annotations,
    },
    ({ version, recipeId, cursor, limit }) =>
      guarded(() => {
        const snapshot = select(version);
        const recipe = snapshot.manifest.recipes.find((r) => r.id === recipeId);
        if (!recipe)
          throw new RegistryError(
            "RECIPE_NOT_FOUND",
            `配方 ${recipeId} 不存在于 ${snapshot.manifest.libraryVersion}。`,
          );
        return sourceEnvelope(
          recipe,
          snapshot,
          recipe.files,
          `recipe:${snapshot.manifest.libraryVersion}:${recipeId}`,
          cursor,
          limit,
        );
      }),
  );

  server.registerTool(
    "cwa_design_plan_installation",
    {
      title: "Plan CWA Design installation",
      description:
        "Exact version pinned installation plan. Registry publication is not inferred from local artifacts. No writes.",
      inputSchema: z.object({
        framework: z.enum(["react"]),
        version: versionInput,
        packageManager: z.enum(["pnpm", "npm", "yarn"]).optional(),
      }),
      annotations,
    },
    ({ version, packageManager }) =>
      guarded(() => {
        const { manifest } = select(version);
        const pkg = `@cwa-design/react@${manifest.libraryVersion}`;
        const command = {
          pnpm: `pnpm add ${pkg}`,
          npm: `npm install ${pkg}`,
          yarn: `yarn add ${pkg}`,
        }[packageManager ?? "pnpm"];
        return envelope(
          {
            version: manifest.libraryVersion,
            packages: [pkg],
            install: command,
            distribution: "source-candidate",
            publicationStatus: "not-verified",
            commandRequiresPublishedVersion: true,
            stylesImport: "@cwa-design/react/styles.css",
            provider: {
              component: "CwaProvider",
              props: { theme: "system", material: "auto", motion: "system" },
            },
          },
          manifest.libraryVersion,
          [
            "本地快照不证明 npm 已发布；当前候选请使用源码构建或审核后的本地 tarball。发布状态核验前不要执行此 npm 安装命令。",
            "计划只读，不写入工程。",
          ],
        );
      }),
  );

  server.registerTool(
    "cwa_design_get_migration",
    {
      title: "Get CWA Design migration notes",
      description:
        "Compare two available exact-version registry contracts. Does not infer undocumented implementation changes.",
      inputSchema: z.object({
        framework: z.enum(["react"]),
        fromVersion: z.string().min(1).max(128),
        toVersion: z.string().min(1).max(128),
      }),
      annotations,
    },
    ({ fromVersion, toVersion }) =>
      guarded(() => {
        const from = select(fromVersion).manifest;
        const to = select(toVersion).manifest;
        const changes = to.components.flatMap((component) => {
          const previous = from.components.find((old) => old.id === component.id);
          if (!previous) return [{ id: component.id, change: "added-component" }];
          const changed = [
            "props",
            "extends",
            "compoundParts",
            "materialPolicy",
            "materialNotes",
            "examples",
          ].filter(
            (key) =>
              JSON.stringify(previous[key as keyof typeof previous]) !==
              JSON.stringify(component[key as keyof typeof component]),
          );
          return changed.length
            ? [{ id: component.id, change: "contract-updated", sections: changed }]
            : [];
        });
        const removed = from.components
          .filter((old) => !to.components.some((component) => component.id === old.id))
          .map((old) => ({ id: old.id, change: "removed-component" }));
        return envelope(
          {
            fromVersion,
            toVersion,
            changes: [...changes, ...removed],
            note:
              fromVersion === toVersion
                ? "版本相同，无需迁移。"
                : "仅比较 Registry 契约；实现与视觉变化请结合变更日志复核。",
          },
          toVersion,
        );
      }),
  );
  return server;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) serveStdio(() => createCwaDesignServer(), { legacy: "serve" });
