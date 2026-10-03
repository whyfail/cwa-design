import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const base = new URL("https://whyfail.github.io/cwa-design/");
const repo = "/Users/wulei/Desktop/wl/cwa/cwa-design";
const output = path.join(import.meta.dirname, "http-results.json");
const expected = {
  commit: "8f394b8eae01b948432a2186cc62e01909b65c43",
  version: "0.1.0-alpha.1",
  registryDigest: "sha256:26fc17e480ae582f1defb1ec332034ee9e15e5e9a58f273468ea93ba1f678a48",
  historicalDigest: "sha256:095bda6190018ed0ee6882a7e74c7130692f227e0b4e5b108a950585e6a157ec",
};
const digest = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const report = { status: "running", startedAt: new Date().toISOString(), base: base.href, expected, requests: [], checks: {}, failures: [] };
const requestCache = new Map();
const decode = (value) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
const attrs = (source) => Object.fromEntries([...source.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((match) => [match[1].toLowerCase(), decode(match[2] ?? match[3])]));
const tags = (html) => [...html.matchAll(/<(a|script|img|source|link)\b([^>]*)>/gi)].map((match) => ({ tag: match[1].toLowerCase(), attrs: attrs(match[2]) }));
const scriptJson = (html, id) => {
  const match = html.match(new RegExp(`<script\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/script>`));
  assert(match, `Missing SSR JSON ${id}`);
  return JSON.parse(match[1]);
};
async function get(value, purpose, expectedStatus = 200) {
  const url = new URL(value, base).href;
  if (!requestCache.has(url)) requestCache.set(url, (async () => {
    const start = Date.now();
    const record = { url, purpose, method: "GET", attempts: [], startedAt: new Date().toISOString() };
    report.requests.push(record);
    let response, bytes;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch(url, { headers: { "Cache-Control": "no-cache", "User-Agent": "CWA-Design-Deployment-Verify/0.1.0" }, signal: AbortSignal.timeout(20000) });
        bytes = Buffer.from(await response.arrayBuffer());
        record.attempts.push({ attempt, status: response.status });
        if (response.status < 500 || attempt === 3) break;
      } catch (error) {
        record.attempts.push({ attempt, error: error.message });
        if (attempt === 3) throw error;
      }
    }
    record.status = response.status;
    record.finalUrl = response.url;
    record.bytes = bytes.length;
    record.contentDigest = digest(bytes);
    record.elapsedMs = Date.now() - start;
    record.headers = Object.fromEntries(["content-type", "etag", "last-modified", "cache-control", "content-encoding", "x-cache", "x-github-request-id"].map((name) => [name, response.headers.get(name)]));
    return { response, bytes, text: bytes.toString("utf8"), record };
  })());
  const result = await requestCache.get(url);
  assert.equal(result.response.status, expectedStatus, `${purpose}: GET ${url}`);
  return result;
}
async function each(values, callback, concurrency = 5) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const value = values[cursor++];
      try { await callback(value); }
      catch (error) { report.failures.push({ stage: "parallel-check", item: typeof value === "string" ? value : value.path ?? value.url, message: error.stack }); }
    }
  }));
}
async function check(name, callback) {
  try { report.checks[name] = { passed: true, details: await callback() }; }
  catch (error) { report.checks[name] = { passed: false }; report.failures.push({ stage: name, message: error.stack }); }
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
}
function verifyRelease(release) {
  assert.equal(release.commit, expected.commit);
  assert.equal(release.version, expected.version);
  assert.equal(release.registryDigest, expected.registryDigest);
  assert.equal(release.dirty, false, "Production source must be clean");
}
function verifyManifest(raw, version, expectedDigest) {
  assert.equal(raw.libraryVersion, version);
  assert.equal(raw.framework, "react");
  assert.equal(raw.registryDigest, expectedDigest);
  assert.equal(digest(JSON.stringify({ ...raw, registryDigest: "" }, null, 2)), expectedDigest);
  assert.equal(raw.components.length, 30);
  assert.equal(new Set(raw.components.map((component) => component.id)).size, 30);
  assert(raw.components.every((component) => component.libraryVersion === version && component.framework === "react"));
}
let initialRelease, routes, currentManifest;
const documents = new Map();
const destinations = new Map();
const localLinks = [];
function gather(html, documentUrl) {
  for (const element of tags(html)) {
    let link;
    if (element.tag === "a") link = element.attrs.href;
    else if (["script", "img", "source"].includes(element.tag)) link = element.attrs.src;
    else if (["stylesheet", "icon", "modulepreload"].includes(element.attrs.rel)) link = element.attrs.href;
    if (!link || /^(?:data:|mailto:|tel:|javascript:)/i.test(link)) continue;
    const resolved = new URL(link, documentUrl);
    if (resolved.origin !== base.origin) continue;
    assert(resolved.pathname.startsWith(base.pathname), `Local URL escapes project base: ${resolved.href}`);
    if (resolved.hash) localLinks.push({ url: resolved.href, from: documentUrl });
    resolved.hash = "";
    destinations.set(resolved.href, { url: resolved.href, purpose: `${element.tag} from ${documentUrl}` });
  }
}
await check("release-identity", async () => {
  const result = await get("release.json", "Release identity");
  initialRelease = JSON.parse(result.text);
  verifyRelease(initialRelease);
  return initialRelease;
});
if (!report.checks["release-identity"].passed) {
  report.status = "failed";
  report.completedAt = new Date().toISOString();
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.error(`Wrong deployed release; refusing to test a stale site. ${output}`);
  process.exit(1);
}
await check("route-contract", async () => {
  routes = JSON.parse((await get("routes.json", "Static route contract")).text);
  const local = JSON.parse(await readFile(path.join(repo, "apps/docs/dist/routes.json"), "utf8"));
  assert.equal(routes.length, 51);
  assert.equal(new Set(routes.map((route) => route.path)).size, 51);
  assert.equal(routes.filter((route) => route.kind === "component").length, 30);
  assert.equal(routes.filter((route) => route.kind === "not-found").length, 1);
  assert.deepEqual(routes.map(({ path, kind, id }) => ({ path, kind, id })), local.map(({ path, kind, id }) => ({ path, kind, id })));
  return { routes: routes.length, components: 30, matchesLocalRouteContract: true };
});
if (routes) await check("all-51-static-html-routes", async () => {
  const failuresBefore = report.failures.length;
  await each(routes, async (route) => {
    const url = new URL(route.path.replace(/^\//, ""), base);
    const result = await get(url, `SSG route ${route.path}`);
    assert.equal((result.text.match(/<h1\b/gi) ?? []).length, 1, route.path);
    assert.equal((result.text.match(/<main\b/gi) ?? []).length, 1, route.path);
    assert.equal(scriptJson(result.text, "cwa-page-data").route, route.path, `Real per-route SSR data: ${route.path}`);
    const pageData = scriptJson(result.text, "cwa-site-data");
    assert.equal(pageData.manifest.libraryVersion, expected.version);
    assert.equal(pageData.manifest.registryDigest, expected.registryDigest);
    const canonical = tags(result.text).filter((element) => element.tag === "link" && element.attrs.rel === "canonical");
    assert.equal(canonical.length, 1, route.path);
    assert.equal(canonical[0].attrs.href, url.href, route.path);
    assert(!result.text.includes("<!--cwa-app-->"), "SSR placeholder is not production markup");
    const ids = [...result.text.matchAll(/\bid="([^"]*)"/g)].map((match) => decode(match[1]));
    documents.set(url.href, { route, ids: new Set(ids), storybook: pageData.storybook });
    gather(result.text, url.href);
  });
  assert.equal(report.failures.length, failuresBefore, "All real routes must pass");
  return { realHtmlPages: documents.size, components: [...documents.values()].filter((doc) => doc.route.kind === "component").length };
});
await check("all-local-links-and-ssr-resources", async () => {
  const failuresBefore = report.failures.length;
  await each([...destinations.values()], async ({ url, purpose }) => { await get(url, purpose); });
  for (const link of localLinks) {
    const resolved = new URL(link.url);
    const id = decodeURIComponent(resolved.hash.slice(1));
    resolved.hash = "";
    const doc = documents.get(resolved.href);
    if (doc) assert(doc.ids.has(id), `Missing anchor ${link.url} from ${link.from}`);
  }
  assert.equal(report.failures.length, failuresBefore, "All local destinations must pass");
  return { uniqueLocalDestinations: destinations.size, fragmentLinks: localLinks.length };
});
if (routes) await check("all-50-markdown-pages", async () => {
  const failuresBefore = report.failures.length;
  const readable = routes.filter((route) => route.kind !== "not-found");
  assert.equal(readable.length, 50);
  await each(readable, async (route) => {
    const result = await get(`markdown${route.path}index.md`, `Markdown ${route.path}`);
    assert(result.text.startsWith(`<!-- CWA Design ${expected.version}; Registry ${expected.registryDigest} -->`));
    assert(result.text.includes("# "), "Markdown has real content");
  });
  assert.equal(report.failures.length, failuresBefore);
  return { markdownPages: readable.length };
});
await check("registry-current-and-artifacts", async () => {
  const result = await get(`downloads/registry/${expected.version}/manifest.json`, "Current Registry manifest");
  currentManifest = JSON.parse(result.text);
  verifyManifest(currentManifest, expected.version, expected.registryDigest);
  assert.equal(currentManifest.schemaVersion, "1.1.0");
  assert.equal(currentManifest.examples.length, 31);
  assert.equal(currentManifest.recipes.length, 3);
  assert.equal(currentManifest.tokensFile, "tokens.json");
  assert(currentManifest.artifacts.length > 60);
  const failuresBefore = report.failures.length;
  await each(currentManifest.artifacts, async (artifact) => {
    assert(!artifact.path.startsWith("/") && !artifact.path.split("/").includes(".."), "Artifact paths are confined");
    const artifactResult = await get(`downloads/registry/${expected.version}/${artifact.path}`, `Artifact ${artifact.path}`);
    assert.equal(artifactResult.bytes.length, artifact.byteSize, artifact.path);
    assert.equal(digest(artifactResult.bytes), artifact.contentDigest, artifact.path);
    if (artifact.path === "tokens.json") assert.equal(JSON.parse(artifactResult.text).libraryVersion, expected.version);
  });
  assert.equal(report.failures.length, failuresBefore);
  return { digest: currentManifest.registryDigest, verifiedArtifacts: currentManifest.artifacts.length, examples: currentManifest.examples.length, recipes: currentManifest.recipes.length };
});
await check("immutable-historical-registry", async () => {
  const result = await get("downloads/registry/0.1.0-alpha.0/manifest.json", "Historical alpha.0 Registry");
  const historical = JSON.parse(result.text);
  verifyManifest(historical, "0.1.0-alpha.0", expected.historicalDigest);
  assert.equal(historical.artifacts, undefined, "Old version remains metadata-only");
  const source = await readFile(path.join(repo, "packages/registry/snapshots/react/0.1.0-alpha.0/manifest.json"));
  assert(result.bytes.equals(source), "Historical bytes match immutable source exactly");
  return { digest: historical.registryDigest, byteDigest: digest(result.bytes), bytes: result.bytes.length, equalsTrackedSource: true };
});
await check("distribution-downloads", async () => {
  const react = await get(`downloads/cwa-design-react-${expected.version}.tgz`, "React tarball distribution");
  const skill = await get(`downloads/cwa-design-skill-${expected.version}.tar.gz`, "Skill distribution");
  for (const result of [react, skill]) {
    assert.equal(result.bytes[0], 0x1f);
    assert.equal(result.bytes[1], 0x8b);
    assert(result.bytes.length > 1000);
  }
  const reactPath = path.join(import.meta.dirname, `cwa-design-react-${expected.version}.tgz`);
  const skillPath = path.join(import.meta.dirname, `cwa-design-skill-${expected.version}.tar.gz`);
  await writeFile(reactPath, react.bytes);
  await writeFile(skillPath, skill.bytes);
  return { react: { path: reactPath, bytes: react.bytes.length, contentDigest: digest(react.bytes) }, skill: { path: skillPath, bytes: skill.bytes.length, contentDigest: digest(skill.bytes) }, installVerification: "Separate online tarball consumer check" };
});
await check("discovery-and-storybook", async () => {
  const sitemap = (await get("sitemap.xml", "Sitemap")).text;
  const locations = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => decode(match[1])).sort();
  assert.deepEqual(locations, routes.filter((route) => route.kind !== "not-found").map((route) => new URL(route.path.replace(/^\//, ""), base).href).sort());
  const robots = (await get("robots.txt", "Robots")).text;
  assert(robots.includes(`Sitemap: ${new URL("sitemap.xml", base).href}`));
  const llms = (await get("llms.txt", "AI discovery")).text;
  assert(llms.includes(expected.registryDigest));
  assert(llms.includes(expected.version));
  const entries = JSON.parse((await get("storybook/index.json", "Storybook index")).text).entries;
  await get("storybook/", "Storybook manager");
  await get("storybook/iframe.html", "Storybook renderer");
  const localPage = await readFile(path.join(repo, "apps/docs/dist/index.html"), "utf8");
  const expectedStorybook = scriptJson(localPage, "cwa-site-data").storybook;
  for (const doc of documents.values()) assert.deepEqual(doc.storybook, expectedStorybook, "Published Storybook mapping matches the source contract");
  const linkedStories = new Set(Object.values(expectedStorybook));
  assert(linkedStories.size > 0);
  for (const story of linkedStories) assert.equal(entries[story]?.type, "story", `Storybook link ${story}`);
  const mappedComponents = Object.keys(expectedStorybook).length;
  if (mappedComponents < 30) report.storybookNote = `${mappedComponents}/30 components map to ${linkedStories.size} distinct grouped stories; ${30 - mappedComponents} component detail links use the working Storybook manager root according to the source contract.`;
  return { sitemapUrls: locations.length, mappedComponents, linkedStories: linkedStories.size, rootFallbackComponents: 30 - mappedComponents, storybookEntries: Object.keys(entries).length, matchesSourceContract: true };
});
await check("missing-route-real-branded-404", async () => {
  const result = await get("__qa_missing__/", "Intentional missing deep route", 404);
  assert.equal(scriptJson(result.text, "cwa-page-data").route, "/404.html");
  assert(result.text.includes("页面未找到"));
  assert(result.text.includes("CWA Design"));
  return { status: result.response.status, customBrandPage: true };
});
await check("release-stability", async () => {
  const fresh = await fetch(new URL("release.json", base), { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(20000) });
  assert.equal(fresh.status, 200);
  const latest = await fresh.json();
  verifyRelease(latest);
  assert.deepEqual(latest, initialRelease);
  return { unchangedDuringVerification: true, commit: latest.commit };
});
report.status = report.failures.length ? "failed" : "passed";
report.completedAt = new Date().toISOString();
report.summary = { checks: Object.keys(report.checks).length, passedChecks: Object.values(report.checks).filter((item) => item.passed).length, uniqueGetRequests: report.requests.length, failures: report.failures.length };
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, ...report.summary, output, failures: report.failures.map(({ stage, item, message }) => ({ stage, item, message: message.split("\n")[0] })) }, null, 2));
if (report.failures.length) process.exitCode = 1;
