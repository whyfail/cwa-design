// Registry checks use memory clones and owned temporary fixtures, never component source edits.
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import {
  type ArtifactRecord,
  type ComponentRecord,
  componentRecordSchema,
  getComponent,
  getManifest,
  type RegistryManifest,
} from "../src/index.js";
import {
  contentDigest,
  currentLibraryVersion,
  loadSnapshots,
  manifestDigest,
  type RegistrySnapshot,
  readArtifact,
  readSnapshot,
} from "../src/snapshot.js";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");
const version = currentLibraryVersion(pkgRoot);
const snapshot = readSnapshot(path.join(pkgRoot, "dist", "manifest", "react", version));
const { manifest } = snapshot;
const builder = (await import(
  pathToFileURL(path.join(pkgRoot, "dist-scripts", "registry", "scripts", "build-manifest.js")).href
)) as {
  validateComponentApis: (components: ComponentRecord[]) => void;
  compileSources: (files: string[]) => void;
  restoreHistoricalSnapshots: (destination: string, source?: string) => void;
  releaseGeneratedAt: (
    version: string,
    existingManifest: string,
    referenceManifest?: string,
  ) => string;
};
const temporaryDirectories: string[] = [];
function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(path.join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}
afterAll(() => {
  for (const directory of temporaryDirectories) rmSync(directory, { recursive: true, force: true });
});

function clonedComponent(id: string): ComponentRecord {
  return structuredClone(getComponent(manifest, id));
}

const source = "export const label = '玻璃';\n";
function isolatedSnapshot(): {
  directory: string;
  file: string;
  record: ArtifactRecord;
  raw: RegistryManifest;
  snapshot: RegistrySnapshot;
} {
  const directory = temporaryDirectory("cwa-registry-snapshot-");
  const record: ArtifactRecord = {
    path: "source/example.tsx",
    mimeType: "text/plain",
    contentDigest: contentDigest(source),
    byteSize: Buffer.byteLength(source),
  };
  const file = path.join(directory, record.path);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, source);
  const raw: RegistryManifest = {
    ...structuredClone(manifest),
    examples: [],
    recipes: [],
    artifacts: [record],
    tokensFile: undefined,
  };
  raw.registryDigest = manifestDigest(raw);
  writeFileSync(path.join(directory, "manifest.json"), `${JSON.stringify(raw, null, 2)}\n`);
  return { directory, file, record, raw, snapshot: readSnapshot(directory) };
}
function writeFixtureManifest(directory: string, raw: RegistryManifest): void {
  raw.registryDigest = manifestDigest(raw);
  writeFileSync(path.join(directory, "manifest.json"), `${JSON.stringify(raw, null, 2)}\n`);
}

describe("clean checkout Registry release inputs", () => {
  const historicalSource = path.join(pkgRoot, "snapshots", "react");
  const historicalVersion = "0.1.0-alpha.0";
  it("restores the historical metadata snapshot without inventing unavailable artifacts", () => {
    const destination = temporaryDirectory("cwa-registry-clean-");
    builder.restoreHistoricalSnapshots(destination);
    const original = readFileSync(path.join(historicalSource, historicalVersion, "manifest.json"));
    const restored = readSnapshot(path.join(destination, historicalVersion));
    expect(readFileSync(path.join(restored.directory, "manifest.json")).equals(original)).toBe(
      true,
    );
    expect(restored.manifest.registryDigest).toBe(
      "sha256:095bda6190018ed0ee6882a7e74c7130692f227e0b4e5b108a950585e6a157ec",
    );
    expect(restored.manifest.artifacts).toBeUndefined();
    expect(() => readArtifact(restored, "tokens.json")).toThrow(/REGISTRY_UNAVAILABLE/);
    expect(() => builder.restoreHistoricalSnapshots(destination)).not.toThrow();
    expect(
      original.equals(
        readFileSync(
          path.join(
            repoRoot,
            "skills/cwa-design/references/versions/react",
            historicalVersion,
            "references/manifest.json",
          ),
        ),
      ),
    ).toBe(true);
  });

  it("fails instead of overwriting a modified historical output even when its digest is valid", () => {
    const destination = temporaryDirectory("cwa-registry-history-changed-");
    builder.restoreHistoricalSnapshots(destination);
    const directory = path.join(destination, historicalVersion);
    const modified = structuredClone(readSnapshot(directory).manifest);
    modified.generatedAt = "2026-10-04T00:00:00.000Z";
    writeFixtureManifest(directory, modified);
    expect(() => builder.restoreHistoricalSnapshots(destination)).toThrow(
      /differs from immutable source/,
    );
    expect(readSnapshot(directory).manifest.generatedAt).toBe(modified.generatedAt);
  });

  it("rejects corrupted source snapshots before copying them", () => {
    const sourceDirectory = temporaryDirectory("cwa-registry-history-corrupt-");
    cpSync(historicalSource, sourceDirectory, { recursive: true });
    const file = path.join(sourceDirectory, historicalVersion, "manifest.json");
    const raw = JSON.parse(readFileSync(file, "utf8")) as RegistryManifest;
    raw.registryDigest = `sha256:${"0".repeat(64)}`;
    writeFileSync(file, JSON.stringify(raw));
    const destination = temporaryDirectory("cwa-registry-history-no-copy-");
    expect(() => builder.restoreHistoricalSnapshots(destination, sourceDirectory)).toThrow(
      /REGISTRY_UNAVAILABLE/,
    );
    expect(existsSync(path.join(destination, historicalVersion))).toBe(false);
  });

  it("keeps the current release timestamp from a verified Skill manifest when dist is absent", () => {
    const destination = temporaryDirectory("cwa-registry-current-date-");
    const reference = path.join(repoRoot, "skills/cwa-design/references/manifest.json");
    expect(
      builder.releaseGeneratedAt(version, path.join(destination, "manifest.json"), reference),
    ).toBe(manifest.generatedAt);
    expect(
      builder.releaseGeneratedAt("9.9.9", path.join(destination, "manifest.json"), reference),
    ).not.toBe(manifest.generatedAt);
  });

  it("rejects a damaged timestamp reference rather than trusting its date", () => {
    const fixture = temporaryDirectory("cwa-registry-bad-date-reference-");
    const raw = structuredClone(manifest);
    raw.registryDigest = `sha256:${"0".repeat(64)}`;
    const file = path.join(fixture, "manifest.json");
    writeFileSync(file, JSON.stringify(raw));
    expect(() =>
      builder.releaseGeneratedAt(version, path.join(fixture, "missing/manifest.json"), file),
    ).toThrow(/REGISTRY_UNAVAILABLE/);
  });
});

describe("current version manifest artifacts", () => {
  it("30 components, 32 compiled examples, 4 recipes and a verified manifest digest", () => {
    expect(version).toBe(currentLibraryVersion(pkgRoot));
    expect(manifest.libraryVersion).toBe(version);
    expect(manifest.schemaVersion).toBe("1.1.0");
    expect(manifest.components).toHaveLength(30);
    expect(manifest.examples).toHaveLength(32);
    expect(manifest.recipes).toHaveLength(4);
    expect(manifest.registryDigest).toBe(manifestDigest(manifest));
    expect(new Set(manifest.components.map((component) => component.id)).size).toBe(30);
    for (const component of manifest.components) expect(component.libraryVersion).toBe(version);
    for (const example of manifest.examples) {
      expect(example.compiled, example.id).toBe(true);
      expect(example.file, example.id).toBeDefined();
      const artifact = readArtifact(snapshot, example.file!);
      expect(artifact.record.contentDigest).toBe(example.contentDigest);
      expect(contentDigest(artifact.content)).toBe(example.contentDigest);
      expect(artifact.content).toBe(readFileSync(path.join(repoRoot, example.sourcePath!), "utf8"));
    }
    for (const artifact of manifest.artifacts ?? [])
      expect(contentDigest(readArtifact(snapshot, artifact.path).content)).toBe(
        artifact.contentDigest,
      );
  });

  it("metadata maps to actual public TypeScript contracts", () => {
    expect(() => builder.validateComponentApis(structuredClone(manifest.components))).not.toThrow();
    for (const component of manifest.components) {
      expect(component.typeName).toBeTruthy();
      expect(component.sourceTypePath).toContain("packages/react/src/");
    }
  }, 15000);

  it("version and component lookups never silently fall back", () => {
    const snapshots = loadSnapshots(path.join(pkgRoot, "dist", "manifest", "react"));
    const manifests = snapshots.map((entry) => entry.manifest);
    expect(getManifest(manifests, "react", version)).toBe(
      snapshots.find((entry) => entry.manifest.libraryVersion === version)!.manifest,
    );
    expect(getManifest(manifests, "react", "0.1.0-alpha.0").libraryVersion).toBe("0.1.0-alpha.0");
    expect(() => getManifest(manifests, "react", "9.9.9")).toThrow(/VERSION_NOT_FOUND/);
    expect(() => getManifest(manifests, "react", "^0.1.0")).toThrow(/INVALID_INPUT/);
    expect(getComponent(manifest, "button").name).toBe("Button");
    expect(() => getComponent(manifest, "not-a-component")).toThrow(/COMPONENT_NOT_FOUND/);
  });

  it("Token source and recipe files remain in the same version", () => {
    expect(manifest.tokensFile).toBeDefined();
    const artifact = readArtifact(snapshot, manifest.tokensFile!);
    expect((JSON.parse(artifact.content) as { libraryVersion: string }).libraryVersion).toBe(
      version,
    );
    for (const recipe of manifest.recipes) {
      expect(recipe.compiled).toBe(true);
      expect(recipe.limitations?.length).toBeGreaterThan(0);
      for (const file of recipe.files)
        expect(readArtifact(snapshot, file).content.length).toBeGreaterThan(0);
    }
    const old = readSnapshot(path.join(pkgRoot, "dist", "manifest", "react", "0.1.0-alpha.0"));
    expect(() => readArtifact(old, "tokens.json")).toThrow(/REGISTRY_UNAVAILABLE/);
    expect(() => readArtifact(old, "examples/button-basic.tsx")).toThrow(/REGISTRY_UNAVAILABLE/);
  });
});

describe("isolated API and source failures", () => {
  it("rejects an enum default outside values without changing a real metadata file", () => {
    const badge = clonedComponent("badge");
    badge.props.tone = { type: "enum", values: ["neutral"], default: "ghost" };
    expect(componentRecordSchema.safeParse(badge).success).toBe(false);
  });

  it("rejects an invented public export", () => {
    const badge = clonedComponent("badge");
    badge.exports = ["GhostBadge"];
    expect(() => builder.validateComponentApis([badge])).toThrow(
      /Missing public export GhostBadge/,
    );
  }, 15000);

  it("rejects invented props and omitted own props against actual TypeScript", () => {
    const invented = clonedComponent("badge");
    invented.props.inventedProp = { type: "string" };
    expect(() => builder.validateComponentApis([invented])).toThrow(
      /Metadata invents prop Badge.inventedProp/,
    );
    const omitted = clonedComponent("badge");
    delete omitted.props.max;
    expect(() => builder.validateComponentApis([omitted])).toThrow(
      /Metadata omits own prop Badge.max/,
    );
  }, 15000);

  it("rejects wrong enum values and defaults against actual source", () => {
    const wrongEnum = clonedComponent("badge");
    wrongEnum.props.tone = { type: "enum", values: ["neutral"], default: "neutral" };
    expect(() => builder.validateComponentApis([wrongEnum])).toThrow(
      /Metadata enum differs from TypeScript/,
    );
    const wrongDefault = clonedComponent("badge");
    const tone = wrongDefault.props.tone;
    if (tone?.type !== "enum") throw new Error("Badge tone must have an enum contract");
    tone.default = "accent";
    expect(() => builder.validateComponentApis([wrongDefault])).toThrow(
      /Metadata default differs from source Badge.tone/,
    );
  }, 15000);

  it("rejects an invented compound export", () => {
    const select = clonedComponent("select");
    select.compoundParts!.SelectContent!.exportName = "Select.GhostPopup";
    expect(() => builder.validateComponentApis([select])).toThrow(
      /Metadata invents compound export Select.GhostPopup/,
    );
  }, 15000);

  it("compiles an owned positive fixture and rejects a missing import", () => {
    const directory = temporaryDirectory("cwa-registry-source-");
    const valid = path.join(directory, "valid.tsx");
    const invalid = path.join(directory, "invalid.tsx");
    writeFileSync(
      valid,
      'import { Button } from "@cwa-design/react";\nexport function Valid() { return <Button>Safe fixture</Button>; }\n',
    );
    writeFileSync(
      invalid,
      'import { Button } from "@cwa-design/react/ghost-export";\nexport function Invalid() { return <Button />; }\n',
    );
    expect(() => builder.compileSources([valid])).not.toThrow();
    expect(() => builder.compileSources([invalid])).toThrow(/Registry source compilation failed/);
    expect(readFileSync(valid, "utf8")).toContain("Safe fixture");
  }, 15000);
});

describe("isolated snapshot integrity and path boundaries", () => {
  it("reads listed bytes and rejects unlisted paths", () => {
    const fixture = isolatedSnapshot();
    expect(readArtifact(fixture.snapshot, fixture.record.path).content).toBe(source);
    expect(() => readArtifact(fixture.snapshot, "source/ghost.tsx")).toThrow(
      /REGISTRY_UNAVAILABLE/,
    );
  });

  it("rejects same-size changed content by digest and changed byte counts", () => {
    const fixture = isolatedSnapshot();
    const tampered = source.replace("玻璃", "水晶");
    expect(Buffer.byteLength(tampered)).toBe(fixture.record.byteSize);
    writeFileSync(fixture.file, tampered);
    expect(() => readArtifact(fixture.snapshot, fixture.record.path)).toThrow(
      /REGISTRY_UNAVAILABLE/,
    );
    writeFileSync(fixture.file, `${source}extra`);
    expect(() => readArtifact(fixture.snapshot, fixture.record.path)).toThrow(
      /REGISTRY_UNAVAILABLE/,
    );
  });

  it("rejects missing files and symlinks escaping the snapshot", () => {
    const fixture = isolatedSnapshot();
    rmSync(fixture.file);
    expect(() => readArtifact(fixture.snapshot, fixture.record.path)).toThrow(
      /REGISTRY_UNAVAILABLE/,
    );
    const outside = path.join(temporaryDirectory("cwa-registry-outside-"), "example.tsx");
    writeFileSync(outside, source);
    symlinkSync(outside, fixture.file);
    expect(() => readArtifact(fixture.snapshot, fixture.record.path)).toThrow(
      /REGISTRY_UNAVAILABLE/,
    );
    expect(readFileSync(outside, "utf8")).toBe(source);
  });

  it("rejects traversal paths, even when the manifest digest is recomputed", () => {
    const fixture = isolatedSnapshot();
    fixture.raw.artifacts![0]!.path = "../outside.tsx";
    writeFixtureManifest(fixture.directory, fixture.raw);
    expect(() => readSnapshot(fixture.directory)).toThrow(/REGISTRY_UNAVAILABLE/);
  });

  it("rejects a forged manifest digest and mismatched component version", () => {
    const fixture = isolatedSnapshot();
    fixture.raw.registryDigest = `sha256:${"0".repeat(64)}`;
    writeFileSync(path.join(fixture.directory, "manifest.json"), JSON.stringify(fixture.raw));
    expect(() => readSnapshot(fixture.directory)).toThrow(/REGISTRY_UNAVAILABLE/);
    fixture.raw.components[0]!.libraryVersion = "0.1.0-alpha.0";
    writeFixtureManifest(fixture.directory, fixture.raw);
    expect(() => readSnapshot(fixture.directory)).toThrow(/REGISTRY_UNAVAILABLE/);
  });

  it("loadSnapshots rejects absent snapshots and a directory/version mismatch", () => {
    const holder = temporaryDirectory("cwa-registry-versions-");
    expect(() => loadSnapshots(path.join(holder, "missing"))).toThrow(/REGISTRY_UNAVAILABLE/);
    expect(() => loadSnapshots(holder)).toThrow(/REGISTRY_UNAVAILABLE/);
    const fixture = isolatedSnapshot();
    const wrongVersionDirectory = path.join(holder, "9.9.9");
    mkdirSync(wrongVersionDirectory);
    writeFileSync(
      path.join(wrongVersionDirectory, "manifest.json"),
      readFileSync(path.join(fixture.directory, "manifest.json")),
    );
    expect(() => loadSnapshots(holder)).toThrow(/REGISTRY_UNAVAILABLE/);
    expect(existsSync(fixture.file)).toBe(true);
  });
});
