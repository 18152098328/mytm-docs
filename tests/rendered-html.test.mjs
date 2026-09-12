import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("server-renders the MyTM Docs workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>MyTM Docs \| 本地外贸单据工作台<\/title>/i);
  assert.match(html, /客户资料/);
  assert.match(html, /商品资料/);
  assert.match(html, /外贸单据/);
  assert.match(html, /18152098328/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("ships the independent local-first feature set", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /mytm-docs-v1/);
  assert.match(page, /Quotation/);
  assert.match(page, /Proforma Invoice/);
  assert.match(page, /Sales Contract/);
  assert.match(page, /Commercial Invoice/);
  assert.match(page, /Packing List/);
  assert.match(page, /localStorage\.setItem/);
  assert.match(page, /MyTM-Docs-backup/);
  assert.match(layout, /MyTM Docs/);
  assert.match(css, /@media print/);
  assert.match(packageJson, /"name": "mytm-docs"/);
  assert.doesNotMatch(`${page}\n${layout}\n${css}`, /site-creator-vinext-starter|SkeletonPreview/i);
});
