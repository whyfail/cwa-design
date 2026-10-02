import type { ComponentRecord } from "@cwa-design/registry";

export const tooltipMeta = {
  schemaVersion: "1.0.0",
  libraryVersion: "0.1.0-alpha.0",
  framework: "react",
  id: "tooltip",
  name: "Tooltip",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Tooltip"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {},
  extends: [],
  materialPolicy: "solid",
  a11y: ["hover-focus-triggered", "escape-closable", "focus-restored", "no-interactive-content"],
  examples: [],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentRecord;
