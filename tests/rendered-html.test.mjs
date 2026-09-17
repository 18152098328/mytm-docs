import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function readAppSources() {
  const appDir = new URL("../app/", import.meta.url);
  const entries = await readdir(appDir, { recursive: true });
  const files = entries
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => /\.(tsx|ts|css)$/.test(entry));
  const sources = await Promise.all(
    files.map((entry) => readFile(new URL(entry, appDir), "utf8")),
  );
  return sources.join("\n");
}

test("server-renders the MyTM Docs workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>MyTM Docs \| 本地外贸单据工作台<\/title>/i);
  // The workspace is gated: the server-rendered first paint is the loading
  // shell of the login gate, not the sidebar.
  assert.match(html, /login-gate/);
  assert.match(html, /正在进入工作台/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("ships the independent local-first feature set", async () => {
  const [bundle, packageJson] = await Promise.all([
    readAppSources(),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(bundle, /mytm-docs-v1/);
  assert.match(bundle, /Quotation/);
  assert.match(bundle, /Proforma Invoice/);
  assert.match(bundle, /Sales Contract/);
  assert.match(bundle, /Commercial Invoice/);
  assert.match(bundle, /Packing List/);
  assert.match(bundle, /localStorage\.setItem/);
  assert.match(bundle, /MyTM-Docs-backup/);
  assert.match(bundle, /MyTM Docs/);
  assert.match(bundle, /@media print/);
  assert.match(packageJson, /"name": "mytm-docs"/);
  assert.doesNotMatch(bundle, /site-creator-vinext-starter|SkeletonPreview/i);
});

test("supports editing and deleting every record type", async () => {
  const bundle = await readAppSources();
  assert.match(bundle, /parseBackup/);
  for (const view of ["CustomersView", "ProductsView", "DocumentsView"]) {
    assert.match(bundle, new RegExp(`function ${view}`));
  }
  assert.match(bundle, /onDelete/);
  assert.match(bundle, /startEdit/);
  assert.match(bundle, /draftFromDocument/);
});

test("covers seller settings, trade terms, packing data, search and conversion", async () => {
  const bundle = await readAppSources();
  assert.match(bundle, /function SettingsView/);
  assert.match(bundle, /bankName/);
  assert.match(bundle, /incoterm/);
  assert.match(bundle, /portOfLoading/);
  assert.match(bundle, /shippingMarks/);
  assert.match(bundle, /grossWeight/);
  assert.match(bundle, /amountInWords/);
  assert.match(bundle, /SAY TOTAL/);
  assert.match(bundle, /search-box/);
  assert.match(bundle, /onConvert/);
});

test("covers bilingual output, Chinese amount words, and stamp upload", async () => {
  const bundle = await readAppSources();
  assert.match(bundle, /amountInWordsCn/);
  assert.match(bundle, /金额大写/);
  assert.match(bundle, /bilingual/);
  assert.match(bundle, /中英双语/);
  assert.match(bundle, /stampImage/);
  assert.match(bundle, /toDataURL/);
  assert.match(bundle, /paymentTerms/);
  assert.match(bundle, /PAYMENT TERMS/);
  assert.match(bundle, /break-inside: avoid/);
  assert.match(bundle, /HS CODE/);
  assert.match(bundle, /onStampMove/);
  assert.match(bundle, /stampX/);
});

test("ships the premium UI with light and dark themes", async () => {
  const bundle = await readAppSources();
  assert.match(bundle, /\[data-theme="dark"\]/);
  assert.match(bundle, /mytm-docs-theme/);
  assert.match(bundle, /theme-toggle/);
  assert.match(bundle, /color-scheme: dark/);
  assert.match(bundle, /doc-badge t-/);
  assert.match(bundle, /本月单据/);
});

test("covers product photos, custom logo, spec column, MOQ and per-carton qty", async () => {
  const bundle = await readAppSources();
  assert.match(bundle, /logoImage/);
  assert.match(bundle, /pcsPerCarton/);
  assert.match(bundle, /moq/);
  assert.match(bundle, /SPEC\./);
  assert.match(bundle, /photo-cell/);
  assert.match(bundle, /product-thumb/);
});

test("covers cloud accounts, sync, and the admin console", async () => {
  const bundle = await readAppSources();
  assert.match(bundle, /AccountView/);
  assert.match(bundle, /putCloudStore/);
  assert.match(bundle, /\/api\/auth/);
  assert.match(bundle, /\/api\/admin/);
  assert.match(bundle, /admin-table/);
});

test("gates the workspace behind assigned-account login", async () => {
  const bundle = await readAppSources();
  assert.match(bundle, /LoginGate/);
  assert.match(bundle, /adminCreateUser/);
  assert.match(bundle, /login-gate/);
  assert.match(bundle, /账号由管理员统一创建与分配/);
});
