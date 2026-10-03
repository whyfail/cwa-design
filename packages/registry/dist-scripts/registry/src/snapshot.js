import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { manifestSchema, RegistryError } from "./index.js";
export function contentDigest(content) {
    return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}
/** The digest covers JSON with registryDigest empty, indentation 2, no final newline. */
export function manifestDigest(manifest) {
    return contentDigest(JSON.stringify({ ...manifest, registryDigest: "" }, null, 2));
}
export function registryPackageRoot() {
    return path.dirname(fileURLToPath(import.meta.resolve("@cwa-design/registry/package.json")));
}
export function currentLibraryVersion(packageRoot = registryPackageRoot()) {
    const pkg = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
    return pkg.version;
}
export function readSnapshot(directory) {
    try {
        const raw = JSON.parse(readFileSync(path.join(directory, "manifest.json"), "utf8"));
        if (raw.registryDigest !== manifestDigest(raw))
            throw new Error("manifest digest mismatch");
        const manifest = manifestSchema.parse(raw);
        if (manifest.components.some((component) => component.libraryVersion !== manifest.libraryVersion || component.framework !== manifest.framework)) {
            throw new Error("component version/framework mismatch");
        }
        return { manifest, directory };
    }
    catch (error) {
        throw new RegistryError("REGISTRY_UNAVAILABLE", `Registry 快照校验失败；请重新安装匹配版本的包。${error instanceof Error ? ` (${error.name})` : ""}`);
    }
}
export function loadSnapshots(directory = path.join(registryPackageRoot(), "dist", "manifest", "react")) {
    if (!existsSync(directory))
        throw new RegistryError("REGISTRY_UNAVAILABLE", "本地 Registry 快照缺失；请先构建或安装匹配版本的包。");
    const snapshots = readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name)).map((entry) => {
        const snapshot = readSnapshot(path.join(directory, entry.name));
        if (snapshot.manifest.libraryVersion !== entry.name)
            throw new RegistryError("REGISTRY_UNAVAILABLE", "Registry 目录版本与内容不一致。");
        return snapshot;
    });
    if (snapshots.length === 0)
        throw new RegistryError("REGISTRY_UNAVAILABLE", "本地 Registry 没有版本快照。");
    return snapshots;
}
/** Only manifest-listed files confined to the same version directory may be read. */
export function readArtifact(snapshot, artifactPath) {
    const record = snapshot.manifest.artifacts?.find((entry) => entry.path === artifactPath);
    if (!record)
        throw new RegistryError("REGISTRY_UNAVAILABLE", `版本 ${snapshot.manifest.libraryVersion} 未包含该源码/Token 快照；请查询有完整产物的确切版本，不能借用其他版本。`);
    try {
        const root = realpathSync(snapshot.directory);
        const file = realpathSync(path.resolve(root, record.path));
        if (!file.startsWith(`${root}${path.sep}`))
            throw new Error("artifact escapes snapshot");
        const bytes = readFileSync(file);
        if (bytes.byteLength !== record.byteSize || contentDigest(bytes) !== record.contentDigest)
            throw new Error("artifact digest mismatch");
        return { record, content: bytes.toString("utf8") };
    }
    catch {
        throw new RegistryError("REGISTRY_UNAVAILABLE", `版本 ${snapshot.manifest.libraryVersion} 的源码/Token 文件缺失或 hash 不匹配；请重新构建或安装该版本。`);
    }
}
