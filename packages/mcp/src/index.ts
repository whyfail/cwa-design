import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { pathToFileURL } from "node:url";
import { z } from "zod";

const LIBRARY_VERSION = "0.1.0-alpha.0";
const SCHEMA_VERSION = "1.0.0";

/**
 * Spike server（T02 兼容性验证）：只读 stdio，单一 capabilities 工具。
 * 正式 Registry 工具集由 T29 实现。
 */
export function createCwaDesignServer(): McpServer {
  const server = new McpServer(
    { name: "cwa-design", version: LIBRARY_VERSION },
    {
      instructions:
        "Read-only CWA Design component registry. Query capabilities before generating code.",
    },
  );

  server.registerTool(
    "cwa_design_get_capabilities",
    {
      title: "Get CWA Design capabilities",
      description:
        "Returns the schema/library versions and supported frameworks for this CWA Design installation. Read-only.",
      inputSchema: z.object({
        framework: z.enum(["react"]).optional(),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    ({ framework }) => {
      const body = {
        schemaVersion: SCHEMA_VERSION,
        libraryVersion: LIBRARY_VERSION,
        framework: framework ?? "react",
        capabilities: {
          components: ["button"],
          tools: ["cwa_design_get_capabilities"],
        },
      };
      return {
        content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
        structuredContent: body,
      };
    },
  );

  return server;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  serveStdio(() => createCwaDesignServer(), { legacy: "serve" });
}
