import type { ComponentRecord } from "@cwa-design/registry";

export const switchMeta = {
  schemaVersion: "1.0.0",
  libraryVersion: "0.1.0-alpha.0",
  framework: "react",
  id: "switch",
  name: "Switch",
  status: "stable-in-alpha",
  package: "@cwa-design/react",
  exports: ["Switch"],
  importPath: "@cwa-design/react",
  stylePath: "@cwa-design/react/styles.css",
  props: {},
  extends: ["native-form-submission"],
  materialPolicy: "inherit-parent-surface",
  a11y: ["native-role", "visible-focus", "keyboard-operable", "label-required"],
  examples: [],
  runtimeDependencies: [],
  deprecated: false,
} satisfies ComponentRecord;
