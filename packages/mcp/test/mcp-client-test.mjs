// T02 spike：当前 SDK client（@modelcontextprotocol/client 2.2.0）与
// legacy client（@modelcontextprotocol/sdk 1.31.0）分别连接 stdio server，
// listTools + callTool 必须成功。任一失败 exit 1。
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist",
  "index.js",
);

function spawnServer() {
  return spawn(process.execPath, [serverPath], { stdio: ["pipe", "pipe", "pipe"] });
}

async function withCurrentClient() {
  const { Client } = await import("@modelcontextprotocol/client");
  const { StdioClientTransport } = await import("@modelcontextprotocol/client/stdio");
  const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath] });
  const client = new Client({ name: "cwa-design-spike-current", version: "0.1.0" });
  await client.connect(transport);
  const tools = await client.listTools();
  if (!tools.tools.some((t) => t.name === "cwa_design_get_capabilities")) {
    throw new Error("current client: capabilities tool missing");
  }
  const result = await client.callTool({ name: "cwa_design_get_capabilities", arguments: {} });
  const structured = result.structuredContent;
  if (!structured || structured.libraryVersion !== "0.1.0-alpha.0") {
    throw new Error(`current client: unexpected structuredContent ${JSON.stringify(structured)}`);
  }
  await client.close();
  return { toolCount: tools.tools.length, libraryVersion: structured.libraryVersion };
}

async function withLegacyClient() {
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
  const server = spawnServer();
  const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath] });
  const client = new Client({ name: "cwa-design-spike-legacy", version: "0.1.0" });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    if (!tools.tools.some((t) => t.name === "cwa_design_get_capabilities")) {
      throw new Error("legacy client: capabilities tool missing");
    }
    const result = await client.callTool({
      name: "cwa_design_get_capabilities",
      arguments: { framework: "react" },
    });
    const text = Array.isArray(result.content)
      ? result.content.map((c) => c.text ?? "").join("")
      : "";
    if (
      !text.includes('"libraryVersion": "0.1.0-alpha.0"') &&
      !text.includes('"libraryVersion":"0.1.0-alpha.0"')
    ) {
      throw new Error(`legacy client: unexpected content ${text.slice(0, 200)}`);
    }
    return { toolCount: tools.tools.length };
  } finally {
    await client.close();
    server.kill();
  }
}

try {
  const current = await withCurrentClient();
  console.log("[current 2.2.0] ok", JSON.stringify(current));
  const legacy = await withLegacyClient();
  console.log("[legacy 1.31.0] ok", JSON.stringify(legacy));
  console.log("MCP SPIKE PASS");
  process.exit(0);
} catch (error) {
  console.error("MCP SPIKE FAIL:", error && error.message ? error.message : error);
  process.exit(1);
}
