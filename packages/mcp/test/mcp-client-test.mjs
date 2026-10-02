// T29 测试：当前 SDK client（2.2.0）与 legacy client（1.31.0）分别连接 stdio server，
// 覆盖 8 个只读工具、错误码、分页。任一失败 exit 1。
import path from "node:path";
import { fileURLToPath } from "node:url";

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

  const tokens = await client.callTool({
    name: "cwa_design_get_tokens",
    arguments: { theme: "dark" },
  });
  if (!tokens.structuredContent?.data?.["semantic-dark"]) throw new Error("tokens dark 组缺失");

  const plan = await client.callTool({
    name: "cwa_design_plan_installation",
    arguments: { framework: "react" },
  });
  if (!String(plan.structuredContent?.data?.install).includes("pnpm add"))
    throw new Error("plan 异常");

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
