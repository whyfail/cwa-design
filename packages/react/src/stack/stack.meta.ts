import type { ComponentRecord } from "@cwa-design/registry";

export const stackMeta = {
  schemaVersion: "1.0.0",
  libraryVersion: "0.1.0-alpha.0",
  framework: "react",
  id: "stack",
  name: "Stack",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Stack"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {},
  extends: [],
  materialPolicy: "inherit-parent-surface",
  a11y: ["layout-only"],
  examples: [],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentRecord;
