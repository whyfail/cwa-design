import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { z } from "zod";
import { componentRecordSchema, exampleRecordSchema, manifestSchema, REGISTRY_SCHEMA_VERSION, } from "../src/index.js";
import { contentDigest, manifestDigest, readArtifact, readSnapshot } from "../src/snapshot.js";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", "..");
if (!existsSync(path.join(repoRoot, "pnpm-workspace.yaml")))
    throw new Error("Registry builder must run from its compiled monorepo location.");
const reactSrc = path.join(repoRoot, "packages", "react", "src");
const registryRoot = path.join(repoRoot, "packages", "registry");
const registryDist = path.join(registryRoot, "dist");
const packageVersion = (name) => JSON.parse(readFileSync(path.join(repoRoot, "packages", name, "package.json"), "utf8")).version;
/** Restore immutable historical releases from source, never from ignored build output. */
export function restoreHistoricalSnapshots(destination = path.join(registryDist, "manifest", "react"), source = path.join(registryRoot, "snapshots", "react")) {
    const files = (directory, prefix = "") => readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isSymbolicLink())
            throw new Error("Historical Registry snapshots cannot contain symlinks");
        return entry.isDirectory() ? files(path.join(directory, entry.name), relative) : [relative];
    })
        .sort();
    for (const entry of readdirSync(source, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (!entry.isDirectory())
            throw new Error("Historical Registry source must contain version directories");
        const directory = path.join(source, entry.name);
        const snapshot = readSnapshot(directory);
        if (snapshot.manifest.libraryVersion !== entry.name || entry.name === packageVersion("react"))
            throw new Error("Historical Registry source version is invalid or is the current editable release");
        for (const artifact of snapshot.manifest.artifacts ?? [])
            readArtifact(snapshot, artifact.path);
        const expected = [
            "manifest.json",
            ...(snapshot.manifest.artifacts ?? []).map((artifact) => artifact.path),
        ].sort();
        const actual = files(directory);
        if (JSON.stringify(actual) !== JSON.stringify(expected))
            throw new Error(`Historical Registry source contains unlisted files: ${entry.name}`);
        const target = path.join(destination, entry.name);
        if (existsSync(target)) {
            if (JSON.stringify(files(target)) !== JSON.stringify(expected) ||
                expected.some((file) => !readFileSync(path.join(target, file)).equals(readFileSync(path.join(directory, file)))))
                throw new Error(`Historical Registry output differs from immutable source: ${entry.name}`);
        }
        else {
            mkdirSync(destination, { recursive: true });
            cpSync(directory, target, { recursive: true });
        }
    }
}
/** Keep a release digest stable when a clean checkout has no generated dist yet. */
export function releaseGeneratedAt(version, existingManifest, referenceManifest = path.join(repoRoot, "skills", "cwa-design", "references", "manifest.json")) {
    for (const file of [existingManifest, referenceManifest]) {
        if (!existsSync(file))
            continue;
        const snapshot = readSnapshot(path.dirname(file));
        if (snapshot.manifest.libraryVersion === version)
            return snapshot.manifest.generatedAt;
    }
    return new Date().toISOString();
}
/** Verify metadata against actual public parameter types, including compound exports. */
export function validateComponentApis(components) {
    const entry = path.join(reactSrc, "index.ts");
    const program = ts.createProgram([entry], {
        jsx: ts.JsxEmit.ReactJSX,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        strict: true,
        skipLibCheck: true,
    });
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(entry);
    const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(source));
    const getProps = (exportName) => {
        const names = exportName.split(".");
        const symbol = exports.find((entry) => entry.name === names[0]);
        if (!symbol)
            throw new Error(`Metadata invents export ${exportName}`);
        let type = checker.getTypeOfSymbolAtLocation(symbol, source);
        for (const name of names.slice(1)) {
            const member = checker.getPropertyOfType(type, name);
            if (!member)
                throw new Error(`Metadata invents compound export ${exportName}`);
            type = checker.getTypeOfSymbolAtLocation(member, source);
        }
        const signature = checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0];
        if (!signature?.parameters[0])
            throw new Error(`Cannot resolve props for ${exportName}`);
        return checker.getTypeOfSymbolAtLocation(signature.parameters[0], source);
    };
    const validate = (name, record) => {
        const propsType = getProps(name);
        for (const [propName, prop] of Object.entries(record.props)) {
            const symbol = checker.getPropertyOfType(propsType, propName);
            if (!symbol)
                throw new Error(`Metadata invents prop ${name}.${propName}`);
            if (prop.required === true && symbol.flags & ts.SymbolFlags.Optional)
                throw new Error(`Metadata wrongly requires ${name}.${propName}`);
            const type = checker.getTypeOfSymbolAtLocation(symbol, source);
            const variants = type.isUnion() ? type.types : [type];
            const literals = variants
                .filter((value) => value.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral))
                .map((value) => value.value);
            const hasBroadType = variants.some((value) => value.flags &
                (ts.TypeFlags.String |
                    ts.TypeFlags.Number |
                    ts.TypeFlags.Any |
                    ts.TypeFlags.TypeParameter));
            if (prop.type === "enum" &&
                !hasBroadType &&
                (prop.values.length !== literals.length ||
                    prop.values.some((value) => !literals.includes(value))))
                throw new Error(`Metadata enum differs from TypeScript: ${name}.${propName}`);
        }
        if (!record.sourceTypePath?.startsWith("packages/") || !record.typeName)
            return;
        const localPath = path.join(repoRoot, record.sourceTypePath.split("#")[0]);
        const local = program.getSourceFile(localPath);
        if (!local)
            throw new Error(`Cannot resolve metadata source ${name}`);
        const own = [];
        const collect = (node) => {
            if (ts.isTypeLiteralNode(node))
                own.push(...node.members);
            if (ts.isIntersectionTypeNode(node))
                node.types.forEach(collect);
        };
        for (const statement of local.statements) {
            if (ts.isInterfaceDeclaration(statement) && statement.name.text === record.typeName)
                own.push(...statement.members);
            if (ts.isTypeAliasDeclaration(statement) && statement.name.text === record.typeName)
                collect(statement.type);
        }
        for (const member of own) {
            if (!ts.isPropertySignature(member) || !member.name)
                continue;
            const key = ts.isStringLiteral(member.name) || ts.isIdentifier(member.name)
                ? member.name.text
                : member.name.getText(local);
            if (!(key in record.props))
                throw new Error(`Metadata omits own prop ${name}.${key}`);
            if (!member.questionToken && record.props[key]?.required !== true)
                throw new Error(`Metadata omits required flag ${name}.${key}`);
        }
        const defaults = new Map();
        const walk = (node) => {
            if (ts.isBindingElement(node) && ts.isIdentifier(node.name) && node.initializer) {
                const value = node.initializer;
                if (ts.isStringLiteral(value))
                    defaults.set(node.name.text, value.text);
                if (ts.isNumericLiteral(value))
                    defaults.set(node.name.text, Number(value.text));
                if (value.kind === ts.SyntaxKind.TrueKeyword || value.kind === ts.SyntaxKind.FalseKeyword)
                    defaults.set(node.name.text, value.kind === ts.SyntaxKind.TrueKeyword);
            }
            ts.forEachChild(node, walk);
        };
        walk(local);
        for (const [key, prop] of Object.entries(record.props)) {
            if (defaults.has(key) && (!("default" in prop) || prop.default !== defaults.get(key)))
                throw new Error(`Metadata default differs from source ${name}.${key}`);
        }
    };
    for (const component of components) {
        for (const name of component.exports)
            if (!exports.some((entry) => entry.name === name))
                throw new Error(`Missing public export ${name}`);
        validate(component.exports[0], component);
        for (const part of Object.values(component.compoundParts ?? {}))
            validate(part.exportName, part);
    }
}
/** Compiler failures are fatal; isolated fixtures never touch component source. */
export function compileSources(files) {
    const fixture = mkdtempSync(path.join(registryRoot, ".compile-check-"));
    const config = path.join(fixture, "tsconfig.json");
    writeFileSync(config, JSON.stringify({
        compilerOptions: {
            noEmit: true,
            jsx: "react-jsx",
            strict: true,
            moduleResolution: "bundler",
            module: "esnext",
            target: "es2022",
            skipLibCheck: true,
            esModuleInterop: true,
            paths: {
                "@cwa-design/react": [path.join(repoRoot, "packages/react/dist/index.d.ts")],
                react: [path.join(repoRoot, "packages/react/node_modules/@types/react/index.d.ts")],
                "react/*": [path.join(repoRoot, "packages/react/node_modules/@types/react/*")],
            },
        },
        files,
    }, null, 2));
    try {
        execFileSync(process.execPath, [
            path.join(repoRoot, "node_modules", "@typescript", "native", "bin", "tsc"),
            "--project",
            config,
        ], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    }
    catch (error) {
        const err = error;
        throw new Error(`Registry source compilation failed: ${[err.stdout, err.stderr].filter(Boolean).join("\n") || String(error)}`, { cause: error });
    }
    finally {
        rmSync(fixture, { recursive: true, force: true });
    }
}
function exampleExport(source) {
    if (/export\s+default\s/.test(source))
        return "default";
    const named = /export\s+function\s+(\w+)/.exec(source)?.[1];
    if (!named)
        throw new Error("Example must export a renderable function");
    return named;
}
export function buildManifest(outputDirectory = registryDist) {
    const libraryVersion = packageVersion("react");
    restoreHistoricalSnapshots(path.join(outputDirectory, "manifest", "react"));
    if (packageVersion("registry") !== libraryVersion || packageVersion("tokens") !== libraryVersion)
        throw new Error("React, Registry and Tokens package versions must match");
    const rawMetas = JSON.parse(readFileSync(path.join(repoRoot, "packages", "react", "dist", "metas.json"), "utf8"));
    const components = rawMetas.map((meta) => componentRecordSchema.parse({ ...meta, libraryVersion }));
    if (components.length !== 30 || new Set(components.map((record) => record.id)).size !== 30)
        throw new Error("Registry requires 30 unique components");
    validateComponentApis(components);
    const versionDir = path.join(outputDirectory, "manifest", "react", libraryVersion);
    const existingPath = path.join(versionDir, "manifest.json");
    const generatedAt = releaseGeneratedAt(libraryVersion, existingPath);
    const staging = mkdtempSync(path.join(registryRoot, ".snapshot-build-"));
    const artifacts = [];
    const put = (file, content, mimeType, sourcePath, sourceDigest) => {
        const dest = path.join(staging, file);
        mkdirSync(path.dirname(dest), { recursive: true });
        writeFileSync(dest, content);
        artifacts.push({
            path: file,
            mimeType,
            contentDigest: contentDigest(content),
            byteSize: Buffer.byteLength(content),
            ...(sourcePath ? { sourcePath } : {}),
            ...(sourceDigest ? { sourceDigest } : {}),
        });
    };
    try {
        const examples = [];
        for (const component of components) {
            for (const id of component.examples) {
                const local = path.join(reactSrc, component.id, "examples", `${id}.tsx`);
                const file = existsSync(local) ? local : path.join(registryRoot, "examples", `${id}.tsx`);
                const source = readFileSync(file, "utf8");
                const sourcePath = path.relative(repoRoot, file).split(path.sep).join("/");
                const artifactFile = `examples/${id}.tsx`;
                put(artifactFile, source, "text/plain", sourcePath, contentDigest(source));
                examples.push(exampleRecordSchema.parse({
                    id,
                    componentId: component.id,
                    framework: "react",
                    title: `${component.name} ${id.endsWith("-loading") ? "加载状态" : "基础用法"}`,
                    compiled: true,
                    imports: [
                        ...new Set([...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map((entry) => entry[1])),
                    ],
                    needsStyles: true,
                    contentDigest: contentDigest(source),
                    sourcePath,
                    file: artifactFile,
                    exportName: exampleExport(source),
                    requiresProvider: component.id !== "provider",
                }));
            }
        }
        if (new Set(examples.map((example) => example.id)).size !== examples.length)
            throw new Error("Duplicate example ids");
        const recipes = [
            {
                id: "settings",
                framework: "react",
                title: "个人设置表单",
                components: [
                    "provider",
                    "field",
                    "input",
                    "switch",
                    "button",
                    "card",
                    "dialog",
                    "toast",
                    "stack",
                ],
                files: ["recipes/settings.tsx"],
                sourcePath: "packages/react/src/recipes/settings.tsx",
                exportName: "SettingsRecipe",
                compiled: true,
                limitations: ["本地表单演示；onSave 由业务接入，未连接持久化服务。"],
            },
            {
                id: "account-panel",
                framework: "react",
                title: "账户面板",
                components: [
                    "provider",
                    "avatar",
                    "badge",
                    "button",
                    "card",
                    "tabs",
                    "dropdown-menu",
                    "skeleton",
                    "stack",
                    "text",
                ],
                files: ["recipes/account-panel.tsx"],
                sourcePath: "packages/react/src/recipes/account-panel.tsx",
                exportName: "AccountPanelRecipe",
                compiled: true,
                limitations: ["活动与账单为静态 fixture；业务操作可通过回调接入，默认只给本地反馈。"],
            },
            {
                id: "ai-workspace",
                framework: "react",
                title: "AI 工作台界面组合",
                components: [
                    "provider",
                    "sheet",
                    "popover",
                    "tabs",
                    "text",
                    "button",
                    "badge",
                    "card",
                    "stack",
                ],
                files: ["recipes/ai-workspace.tsx"],
                sourcePath: "packages/react/src/recipes/ai-workspace.tsx",
                exportName: "AiWorkspaceRecipe",
                compiled: true,
                limitations: [
                    "消息与工具记录为静态 fixture；未连接模型服务。",
                    "发送与附件选择提供本地演示，可通过回调接入业务；没有文件上传服务。",
                ],
            },
            {
                id: "media-toolbar",
                framework: "react",
                title: "媒体工具栏可读配方",
                components: ["provider", "surface", "icon-button", "button", "text"],
                files: ["recipes/media-toolbar.tsx"],
                sourcePath: "packages/react/src/recipes/media-toolbar.tsx",
                exportName: "MediaToolbarRecipe",
                compiled: true,
                limitations: [
                    "媒体背景为样式化占位（无真实照片依赖）；接入时用应用实际媒体验证对比度。",
                    "Clear 仅在媒体与主题方向一致且文字/必要图标有实色底面时使用；混合亮度请用 Thick/Solid。",
                ],
            },
        ];
        for (const recipe of recipes) {
            const original = readFileSync(path.join(repoRoot, recipe.sourcePath), "utf8");
            // Served source uses public exports; compile and hash the transformed bytes, not the original.
            const source = original.replace(/from\s+(["'])\.\.\/[^"']+\1/g, 'from "@cwa-design/react"');
            put(recipe.files[0], source, "text/plain", recipe.sourcePath, contentDigest(original));
            const scopePath = "packages/react/src/recipes/recipe-scope.tsx";
            if (!artifacts.some((artifact) => artifact.path === "recipes/recipe-scope.tsx")) {
                const scope = readFileSync(path.join(repoRoot, scopePath), "utf8");
                put("recipes/recipe-scope.tsx", scope.replace(/from\s+(["'])\.\.\/[^"']+\1/g, 'from "@cwa-design/react"'), "text/plain", scopePath, contentDigest(scope));
            }
            recipe.files.push("recipes/recipe-scope.tsx");
            for (const id of recipe.components)
                if (!components.some((record) => record.id === id))
                    throw new Error(`Recipe invents component ${id}`);
        }
        compileSources([
            ...examples.map((example) => path.join(staging, example.file)),
            ...recipes.flatMap((recipe) => recipe.files.map((file) => path.join(staging, file))),
        ]);
        const tokens = readFileSync(path.join(repoRoot, "packages", "tokens", "dist", "tokens.json"), "utf8");
        if (JSON.parse(tokens).libraryVersion !== libraryVersion)
            throw new Error("Tokens snapshot version mismatch");
        put("tokens.json", tokens, "application/json", "packages/tokens/src/tokens.json", contentDigest(readFileSync(path.join(repoRoot, "packages", "tokens", "src", "tokens.json"))));
        for (const component of components)
            put(`contracts/${component.id}.json`, `${JSON.stringify(component, null, 2)}\n`, "application/json", `packages/react/src/${component.id}/${component.id}.meta.ts`, contentDigest(readFileSync(path.join(reactSrc, component.id, `${component.id}.meta.ts`))));
        const body = {
            schemaVersion: REGISTRY_SCHEMA_VERSION,
            libraryVersion,
            framework: "react",
            registryDigest: "",
            generatedAt,
            components,
            examples,
            recipes,
            artifacts,
            tokensFile: "tokens.json",
            digestMethod: "sha256-json-2-space-empty-registryDigest",
        };
        const digest = manifestDigest(body);
        const final = { ...body, registryDigest: digest };
        manifestSchema.parse(final);
        writeFileSync(path.join(staging, "manifest.json"), `${JSON.stringify(final, null, 2)}\n`);
        const stagedSnapshot = readSnapshot(staging);
        for (const artifact of artifacts)
            readArtifact(stagedSnapshot, artifact.path);
        // Only the unpublished current snapshot is rebuilt; older version directories stay intact.
        mkdirSync(versionDir, { recursive: true });
        for (const artifact of artifacts) {
            mkdirSync(path.dirname(path.join(versionDir, artifact.path)), { recursive: true });
            writeFileSync(path.join(versionDir, artifact.path), readFileSync(path.join(staging, artifact.path)));
        }
        writeFileSync(existingPath, readFileSync(path.join(staging, "manifest.json")));
        writeFileSync(path.join(outputDirectory, "manifest.schema.json"), `${JSON.stringify(z.toJSONSchema(manifestSchema), null, 2)}\n`);
        return {
            manifestPath: existingPath,
            digest,
            components: components.length,
            examples: examples.length,
        };
    }
    finally {
        rmSync(staging, { recursive: true, force: true });
    }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const result = buildManifest();
    console.log(`manifest: ${result.components} components, ${result.examples} compiled examples, digest=${result.digest}`);
    console.log(`artifact: ${result.manifestPath}`);
}
