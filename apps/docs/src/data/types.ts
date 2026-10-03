export interface PropDoc {
  type: string;
  values?: (string | number)[];
  default?: string | number | boolean;
  defaultSummary?: string;
  required?: boolean;
  summary?: string;
  description?: string;
}
export interface ComponentDoc {
  id: string;
  name: string;
  exports: string[];
  importPath: string;
  stylePath: string;
  description?: string;
  typeName?: string;
  sourceTypePath?: string;
  props: Record<string, PropDoc>;
  compoundParts?: Record<
    string,
    {
      props: Record<string, PropDoc>;
      typeName?: string;
      sourceTypePath?: string;
      extends?: string[];
      description?: string;
    }
  >;
  extends: string[];
  materialPolicy: string;
  materialNotes?: string[] | string;
  a11y: string[];
  examples: string[];
}
export interface ExampleDoc {
  id: string;
  componentId: string;
  title: string;
  sourcePath: string;
  file: string;
  exportName: string;
  contentDigest: string;
  compiled: boolean | null;
  requiresProvider?: boolean;
}
export interface RecipeDoc {
  id: string;
  title: string;
  components: string[];
  files: string[];
  sourcePath?: string;
  exportName?: string;
  compiled?: boolean;
  limitations?: string[];
}
export interface SiteData {
  manifest: {
    libraryVersion: string;
    registryDigest: string;
    schemaVersion: string;
    generatedAt: string;
    components: ComponentDoc[];
    examples: ExampleDoc[];
    recipes: RecipeDoc[];
    artifacts: { path: string; contentDigest: string; byteSize: number; mimeType: string }[];
    tokensFile: string;
  };
  sources: Record<string, string>;
  tokens: Record<string, string[]>;
  storybook: Record<string, string>;
  skill: string;
}
