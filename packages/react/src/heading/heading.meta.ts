import type { ComponentRecord } from "@cwa-design/registry";

export const headingMeta = {
  schemaVersion: "1.0.0",
  libraryVersion: "0.1.0-alpha.0",
  framework: "react",
  id: "heading",
  name: "Heading",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Heading"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {},
  extends: [],
  materialPolicy: "inherit-parent-surface",
  a11y: ["semantic-heading-level"],
  examples: [],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentRecord;
