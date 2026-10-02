import type { ComponentRecord } from "@cwa-design/registry";

export const surfaceMeta = {
  schemaVersion: "1.0.0",
  libraryVersion: "0.1.0-alpha.0",
  framework: "react",
  id: "surface",
  name: "Surface",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Surface"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {},
  extends: [],
  materialPolicy: "inherit-parent-surface",
  a11y: ["material-contrast"],
  examples: [],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentRecord;
