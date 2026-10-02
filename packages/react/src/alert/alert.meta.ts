import type { ComponentRecord } from "@cwa-design/registry";

export const alertMeta = {
  schemaVersion: "1.0.0",
  libraryVersion: "0.1.0-alpha.0",
  framework: "react",
  id: "alert",
  name: "Alert",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Alert"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {},
  extends: [],
  materialPolicy: "solid",
  a11y: ["keyboard-navigable", "live-region-managed", "escape-closable", "text-not-color-only"],
  examples: [],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentRecord;
