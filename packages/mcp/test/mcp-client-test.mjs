// T29 测试：当前 SDK client（2.2.0）与 legacy client（1.31.0）分别连接 stdio server，
// 覆盖 8 个只读工具、错误码、分页。任一失败 exit 1。

import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { currentLibraryVersion, loadSnapshots, readArtifact } from "@cwa-design/registry/snapshot";

const VERSION = currentLibraryVersion();
const snapshot = loadSnapshots().find((entry) => entry.manifest.libraryVersion === VERSION);
const digest = (source) => `sha256:${createHash("sha256").update(source).digest("hex")}`;

function exactVersionLabel(version) {
  return `exact-version query should answer as ${version}`;
}

const serverPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist",
  "index.js",
);

async function withCurrentClient() {
  const { Client } = await import("@modelcontextprotocol/client");
  const { StdioClientTransport } = await import("@modelcontextprotocol/client/stdio");
  const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath] });
  const client = new Client({ name: "cwa-design-t29-current", version: "0.1.0" });
  await client.connect(transport);
  const tools = await client.listTools();
  const expected = [
    "cwa_design_get_capabilities",
    "cwa_design_search_components",
    "cwa_design_get_component",
    "cwa_design_get_example",
    "cwa_design_get_tokens",
    "cwa_design_get_recipe",
    "cwa_design_plan_installation",
    "cwa_design_get_migration",
  ];
  for (const name of expected) {
    if (!tools.tools.some((t) => t.name === name)) throw new Error(`缺少工具 ${name}`);
  }

  const caps = await client.callTool({ name: "cwa_design_get_capabilities", arguments: {} });
  if (caps.structuredContent?.data?.components !== 30)
    throw new Error("capabilities 组件数应为 30");
  assert.equal(caps.structuredContent.libraryVersion, VERSION);
  assert.equal(caps.structuredContent.data.recipes, 4);
  assert.equal(caps.structuredContent.data.responseBudgetBytes, 12 * 1024);
  async function call(name, args = {}) {
    const result = await client.callTool({ name: `cwa_design_${name}`, arguments: args });
    assert.ok(
      Buffer.byteLength(JSON.stringify(result)) <= 12 * 1024,
      `${name} complete response exceeds budget`,
    );
    for (const item of result.content ?? [])
      if (item.type === "text")
        assert.ok(Buffer.byteLength(item.text) <= 12 * 1024, `${name} response exceeds budget`);
    return result;
  }

  // V07：按精确版本查询——冻结的 alpha.2 与当前版本各自返回自己的身份与契约。
  const capsVersions = caps.structuredContent.data.registryVersions;
  assert.ok(Array.isArray(capsVersions), "capabilities lists registryVersions");
  for (const expectedVersion of ["0.1.0-alpha.2", VERSION]) {
    const component = await call("get_component", { id: "surface", version: expectedVersion });
    assert.equal(
      component.structuredContent.libraryVersion,
      expectedVersion,
      exactVersionLabel(expectedVersion),
    );
    if (expectedVersion === VERSION) {
      const material = JSON.stringify(
        component.structuredContent.data ?? component.structuredContent,
      );
      assert.ok(
        material.includes("3.910"),
        "current surface contract carries the measured dark-white pressure note",
      );
    }
  }
  const alpha2Surface = await call("get_component", { id: "surface", version: "0.1.0-alpha.2" });
  const alpha2Notes = JSON.stringify(
    alpha2Surface.structuredContent.data ?? alpha2Surface.structuredContent,
  );
  assert.ok(
    !alpha2Notes.includes("3.910"),
    "frozen alpha.2 content is not rewritten by the newer candidate",
  );

  const search = await client.callTool({
    name: "cwa_design_search_components",
    arguments: { query: "button", limit: 1 },
  });
  if (
    search.structuredContent?.truncated !== true ||
    search.structuredContent?.nextCursor === null
  ) {
    throw new Error("search 分页标记异常");
  }

  const component = await client.callTool({
    name: "cwa_design_get_component",
    arguments: { id: "button" },
  });
  if (component.structuredContent?.data?.name !== "Button")
    throw new Error("get_component 数据异常");

  const example = await client.callTool({
    name: "cwa_design_get_example",
    arguments: { exampleId: "button-basic" },
  });
  if (example.structuredContent?.data?.compiled !== true) throw new Error("示例未标记已编译");
  assert.equal(
    digest(example.structuredContent.data.source),
    example.structuredContent.data.contentDigest,
  );
  assert.equal(
    example.structuredContent.data.source,
    readArtifact(snapshot, "examples/button-basic.tsx").content,
  );

  const tokens = await client.callTool({
    name: "cwa_design_get_tokens",
    arguments: { theme: "dark", groups: ["semantic-dark"] },
  });
  if (!tokens.structuredContent?.data?.["semantic-dark"]) throw new Error("tokens dark 组缺失");

  const plan = await client.callTool({
    name: "cwa_design_plan_installation",
    arguments: { framework: "react" },
  });
  if (!String(plan.structuredContent?.data?.install).includes("pnpm add"))
    throw new Error("plan 异常");
  assert.equal(plan.structuredContent.data.install, `pnpm add @cwa-design/react@${VERSION}`);
  assert.equal(plan.structuredContent.data.publicationStatus, "not-verified");

  const sameVersion = await client.callTool({
    name: "cwa_design_get_migration",
    arguments: { framework: "react", fromVersion: "0.1.0-alpha.0", toVersion: "0.1.0-alpha.0" },
  });
  if (!sameVersion.structuredContent) throw new Error("同版本迁移应成功");

  // 错误路径：未知版本 / 未知组件 / 未知 recipe → isError=true 且结构化错误信息
  const badVersion = await client.callTool({
    name: "cwa_design_get_component",
    arguments: { id: "button", version: "9.9.9" },
  });
  if (badVersion.isError !== true) throw new Error("未知版本应为 tool error");
  const badComponent = await client.callTool({
    name: "cwa_design_get_component",
    arguments: { id: "ghost" },
  });
  if (badComponent.isError !== true) throw new Error("未知组件应为 tool error");
  const badRecipe = await client.callTool({
    name: "cwa_design_get_recipe",
    arguments: { recipeId: "nope" },
  });
  if (badRecipe.isError !== true) throw new Error("未知 recipe 应为 tool error");

  // Every tool that accepts a version must validate it, including same-version migration.
  for (const [name, args] of [
    ["search_components", { version: "9.9.9" }],
    ["get_tokens", { version: "9.9.9" }],
    ["get_example", { version: "9.9.9", exampleId: "button-basic" }],
    ["get_recipe", { version: "9.9.9", recipeId: "settings" }],
    ["plan_installation", { framework: "react", version: "9.9.9" }],
    ["get_migration", { framework: "react", fromVersion: "9.9.9", toVersion: "9.9.9" }],
  ]) {
    const result = await call(name, args);
    assert.equal(result.isError, true, name);
    assert.equal(result.structuredContent.error.code, "VERSION_NOT_FOUND", name);
  }
  const range = await call("search_components", { version: "^0.1.0" });
  assert.equal(range.structuredContent.error.code, "INVALID_INPUT");
  const badCursor = await call("search_components", { cursor: "bogus" });
  assert.equal(badCursor.structuredContent.error.code, "INVALID_INPUT");
  const next = await call("search_components", {
    query: "button",
    limit: 1,
    cursor: search.structuredContent.nextCursor,
  });
  assert.notEqual(
    next.structuredContent.data.results[0].id,
    search.structuredContent.data.results[0].id,
  );
  const mismatchedCursor = await call("search_components", {
    query: "dialog",
    cursor: search.structuredContent.nextCursor,
  });
  assert.equal(mismatchedCursor.structuredContent.error.code, "INVALID_INPUT");

  const oldSearch = await call("search_components", { version: "0.1.0-alpha.0", query: "button" });
  assert.equal(oldSearch.structuredContent.libraryVersion, "0.1.0-alpha.0");
  const oldPlan = await call("plan_installation", { framework: "react", version: "0.1.0-alpha.0" });
  assert.equal(oldPlan.structuredContent.data.install, "pnpm add @cwa-design/react@0.1.0-alpha.0");
  for (const [name, args] of [
    ["get_example", { exampleId: "button-basic" }],
    ["get_tokens", {}],
    ["get_recipe", { recipeId: "settings" }],
  ]) {
    const result = await call(name, { ...args, version: "0.1.0-alpha.0" });
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.error.code, "REGISTRY_UNAVAILABLE", name);
  }
  for (const recipe of snapshot.manifest.recipes) {
    let recipeCursor;
    const files = {};
    do {
      const result = await call("get_recipe", {
        recipeId: recipe.id,
        ...(recipeCursor ? { cursor: recipeCursor } : {}),
      });
      assert.notEqual(result.isError, true);
      const data = result.structuredContent.data;
      assert.ok(data.limitations.length > 0);
      for (const source of data.sources) {
        assert.equal(digest(source.source), source.sourcePage.chunkDigest);
        const previous = files[source.file] ?? { source: "", artifact: source.artifact };
        assert.equal(Array.from(previous.source).length, source.sourcePage.offset);
        previous.source += source.source;
        files[source.file] = previous;
      }
      recipeCursor = result.structuredContent.nextCursor;
    } while (recipeCursor);
    for (const source of Object.values(files))
      assert.equal(digest(source.source), source.artifact.contentDigest);
  }
  for (const entry of snapshot.manifest.examples) {
    let exampleCursor;
    let source = "";
    do {
      const result = await call("get_example", {
        exampleId: entry.id,
        ...(exampleCursor ? { cursor: exampleCursor } : {}),
      });
      assert.notEqual(result.isError, true, entry.id);
      assert.equal(result.structuredContent.libraryVersion, VERSION);
      assert.equal(Array.from(source).length, result.structuredContent.data.sourcePage.offset);
      source += result.structuredContent.data.source;
      exampleCursor = result.structuredContent.nextCursor;
    } while (exampleCursor);
    assert.equal(digest(source), entry.contentDigest);
  }
  const merged = {};
  let cursor;
  do {
    const result = await call("get_tokens", {
      theme: "all",
      limit: 2,
      ...(cursor ? { cursor } : {}),
    });
    assert.notEqual(result.isError, true);
    for (const group of ["primitive", "semantic-light", "semantic-dark", "motion"])
      if (result.structuredContent.data[group])
        Object.assign((merged[group] ??= {}), result.structuredContent.data[group]);
    cursor = result.structuredContent.nextCursor;
  } while (cursor);
  const sourceTokens = JSON.parse(readArtifact(snapshot, snapshot.manifest.tokensFile).content);
  assert.deepEqual(merged.primitive, sourceTokens.primitive);
  assert.deepEqual(merged["semantic-light"], sourceTokens.semantic.light);
  assert.deepEqual(merged["semantic-dark"], sourceTokens.semantic.dark);
  assert.deepEqual(merged.motion, sourceTokens.motion);
  const all = await call("get_tokens", {
    theme: "all",
    groups: ["semantic-light", "semantic-dark"],
  });
  assert.ok(all.structuredContent.data["semantic-light"]);
  assert.ok(all.structuredContent.data["semantic-dark"] || all.structuredContent.nextCursor);
  const largeContract = await call("get_component", { id: "select" });
  assert.equal(largeContract.structuredContent.error.code, "INVALID_INPUT");
  for (const part of [
    "root",
    ...Object.keys(
      snapshot.manifest.components.find((entry) => entry.id === "select").compoundParts,
    ),
  ]) {
    const result = await call("get_component", { id: "select", sections: ["api"], part });
    assert.notEqual(result.isError, true, part);
    assert.ok(result.structuredContent.data.api.props);
  }
  for (const record of snapshot.manifest.components) {
    const result = await call("get_component", { id: record.id, sections: ["api"], part: "root" });
    assert.notEqual(result.isError, true, record.id);
    assert.deepEqual(result.structuredContent.data.api.props, record.props);
    assert.deepEqual(result.structuredContent.data.api.exports, record.exports);
    assert.equal(result.structuredContent.libraryVersion, VERSION);
  }
  const migrated = await call("get_migration", {
    framework: "react",
    fromVersion: "0.1.0-alpha.0",
    toVersion: VERSION,
  });
  assert.notEqual(migrated.isError, true);
  assert.equal(migrated.structuredContent.libraryVersion, VERSION);
  assert.ok(migrated.structuredContent.data.changes.length > 0);

  await client.close();
  return { toolCount: tools.tools.length, libraryVersion: caps.structuredContent?.libraryVersion };
}

async function withLegacyClient() {
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
  const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath] });
  const client = new Client({ name: "cwa-design-t29-legacy", version: "0.1.0" });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    if (tools.tools.length !== 8)
      throw new Error(`legacy 工具数应为 8，实际 ${tools.tools.length}`);
    const result = await client.callTool({
      name: "cwa_design_get_component",
      arguments: { id: "dialog" },
    });
    const text = Array.isArray(result.content)
      ? result.content.map((c) => c.text ?? "").join("")
      : "";
    if (!text.includes('"id": "dialog"') && !text.includes('"id":"dialog"')) {
      throw new Error("legacy get_component 内容异常");
    }
    return { toolCount: tools.tools.length };
  } finally {
    await client.close();
  }
}

try {
  const current = await withCurrentClient();
  console.log("[current 2.2.0] ok", JSON.stringify(current));
  const legacy = await withLegacyClient();
  console.log("[legacy 1.31.0] ok", JSON.stringify(legacy));
  console.log("MCP T29 PASS");
  process.exit(0);
} catch (error) {
  console.error("MCP T29 FAIL:", error && error.message ? error.message : error);
  process.exit(1);
}
