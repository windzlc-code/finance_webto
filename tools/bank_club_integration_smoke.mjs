#!/usr/bin/env node
import { createServer, request as httpRequest } from "node:http";
import { spawn } from "node:child_process";
import { createReadStream, existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error("Cannot load Playwright. Set NODE_PATH to bundled node_modules or install playwright.");
  console.error(String(error && error.message ? error.message : error));
  process.exit(2);
}

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ADMIN_PASSWORD = "admin123";
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function ok(label, detail = "") {
  return { label, status: "passed", detail };
}

function fail(label, detail) {
  return { label, status: "failed", detail };
}

async function listen(server, startPort) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    try {
      await new Promise((resolveListen, rejectListen) => {
        server.once("error", rejectListen);
        server.listen(port, "127.0.0.1", () => {
          server.off("error", rejectListen);
          resolveListen();
        });
      });
      return port;
    } catch (error) {
      server.removeAllListeners("error");
      if (!error || error.code !== "EADDRINUSE") throw error;
    }
  }
  throw new Error("No free local port available");
}

async function closeServer(server) {
  await new Promise((resolveClose) => server.close(resolveClose));
}

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function waitForApi(url, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      // Keep polling until the spawned API opens its socket.
    }
    await wait(200);
  }
  throw new Error(`API did not become ready: ${url}`);
}

function proxyToApi(clientRequest, clientResponse, apiPort) {
  const upstream = httpRequest({
    hostname: "127.0.0.1",
    port: apiPort,
    method: clientRequest.method,
    path: clientRequest.url,
    headers: clientRequest.headers
  }, (upstreamResponse) => {
    clientResponse.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(clientResponse);
  });
  upstream.on("error", (error) => {
    clientResponse.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    clientResponse.end(JSON.stringify({ error: "api_proxy_failed", detail: error.message }));
  });
  clientRequest.pipe(upstream);
}

function makeStaticProxyServer(root, apiPort) {
  return createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    if (requestUrl.pathname.startsWith("/tfse/api/") || requestUrl.pathname === "/tfse/api") {
      proxyToApi(request, response, apiPort);
      return;
    }
    if (requestUrl.pathname === "/site-config.json") {
      const config = JSON.parse(readFileSync(join(root, "site-config.json"), "utf8"));
      config.backend = Object.assign({}, config.backend || {}, {
        api_base_url: "/tfse",
        mode: "api",
        timeout_ms: 8000
      });
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify(config));
      return;
    }

    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/admin") {
      response.writeHead(308, { location: "/admin/" });
      response.end();
      return;
    }
    if (pathname.startsWith("/admin/")) {
      pathname = pathname.slice("/admin".length) || "/";
      if (pathname === "/") pathname = "/admin.html";
    }
    if (pathname === "/") pathname = "/index.html";
    let target = normalize(join(root, pathname));
    if (target.startsWith(root) && existsSync(target) && statSync(target).isDirectory()) {
      target = normalize(join(target, "index.html"));
    }
    if (!target.startsWith(root) || !existsSync(target) || !statSync(target).isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "content-type": MIME_TYPES[extname(target).toLowerCase()] || "application/octet-stream" });
    createReadStream(target).pipe(response);
  });
}

async function runBrowserChecks(baseUrl) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const results = [];
  const unexpectedResponses = [];
  const unexpectedErrors = [];

  page.on("response", (response) => {
    if (response.status() >= 400) {
      const url = response.url();
      const allowedPreLogin =
        response.status() === 401 &&
        (url.includes("/tfse/api/admin/auth/session") ||
          url.includes("/tfse/api/admin/leads") ||
          url.includes("/tfse/api/admin/bank-club/leads"));
      if (!allowedPreLogin) unexpectedResponses.push(`${response.status()} ${url}`);
    }
  });
  page.on("pageerror", (error) => unexpectedErrors.push(error.message));

  try {
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    if (!(await page.title()).includes("TFSE金融便民中心")) {
      throw new Error(`TFSE homepage identity mismatch: ${await page.title()}`);
    }
    results.push(ok("TFSE homepage remains reachable before shared-admin checks"));

    const uniqueName = `API客戶${Date.now()}`;
    const bankApiResult = await page.evaluate(async (displayName) => {
      const configResponse = await fetch("../site-config.json", { cache: "no-store" });
      const configText = await configResponse.text();
      let config = {};
      try {
        config = JSON.parse(configText);
      } catch (error) {
        config = { parse_error: error.message, text: configText.slice(0, 120) };
      }
      const base = String(config && config.backend && config.backend.api_base_url || "").replace(/\/$/, "");
      let health = { url: base ? base + "/api/health" : "", ok: false, status: 0 };
      if (health.url) {
        try {
          const healthResponse = await fetch(health.url, { cache: "no-store" });
          health = { url: health.url, ok: healthResponse.ok, status: healthResponse.status };
        } catch (error) {
          health = { url: health.url, ok: false, status: 0, error: error.message };
        }
      }
      const leadUrl = `${base}/api/bank-club/leads`;
      const leadResponse = await fetch(leadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          display_name: displayName,
          phone: "0912345678",
          loan_type: "house",
          message: "Bank Club shared admin smoke",
          source_page: "/"
        })
      });
      const leadText = await leadResponse.text();
      let leadPayload = {};
      try {
        leadPayload = JSON.parse(leadText);
      } catch (error) {
        leadPayload = { parse_error: error.message, text: leadText.slice(0, 240) };
      }
      return {
        config_status: configResponse.status,
        api_base_url: base,
        health,
        lead_status: leadResponse.status,
        lead_ok: leadResponse.ok,
        lead_payload: leadPayload
      };
    }, uniqueName).catch((error) => ({ error: error.message }));
    if (!bankApiResult.lead_ok) {
      throw new Error(`Bank Club lead API did not accept shared payload: ${JSON.stringify(bankApiResult)}; responses=${unexpectedResponses.join(" | ") || "none"}`);
    }
    results.push(ok("Bank Club lead API accepts shared admin payload"));

    await page.goto(`${baseUrl}/admin/`, { waitUntil: "networkidle" });
    await page.fill("[data-admin-password]", ADMIN_PASSWORD);
    await page.click("[data-admin-login]");
    await page.waitForFunction(() => localStorage.getItem("tfse_admin_auth") === "true", null, { timeout: 10000 });
    await page.getByRole("button", { name: "線索與客戶", exact: true }).click();
    await page.locator('[data-visual-site="bankclub"]').click();
    await page.locator("[data-bank-club-admin]").filter({ hasText: "連線模式：api" }).waitFor({ timeout: 10000 });
    await page.locator("[data-bank-club-admin]").filter({ hasText: uniqueName }).waitFor({ timeout: 10000 });
    results.push(ok("Shared admin login shows Bank Club API leads"));

    const liveFinanceName = "自動刷新金融測試";
    const liveBankName = "自動刷新銀行測試";
    const liveSubmitResult = await page.evaluate(async ({ financeName, bankName }) => {
      const [financeResponse, bankResponse] = await Promise.all([
        fetch("/tfse/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            display_name: financeName,
            phone: "0988111222",
            needs: "銀行信貸資訊查詢",
            consent_privacy: true,
            consent_line: true,
            source_url: "/free-check.html",
            utm_source: "closed_loop_smoke",
            device_id: "closed-loop-finance"
          })
        }),
        fetch("/tfse/api/bank-club/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            display_name: bankName,
            phone: "0911222333",
            loan_type: "unknown",
            source_page: "/consultation",
            source_channel: "closed_loop_smoke"
          })
        })
      ]);
      return { finance: financeResponse.status, bank: bankResponse.status };
    }, { financeName: liveFinanceName, bankName: liveBankName });
    if (liveSubmitResult.finance !== 200 || liveSubmitResult.bank !== 200) {
      throw new Error(`automatic refresh setup failed: ${JSON.stringify(liveSubmitResult)}`);
    }
    await page.locator('[data-visual-site="finance"]').click();
    await page.locator("[data-admin-visual-console]").filter({ hasText: liveFinanceName }).waitFor({ timeout: 12000 });
    await page.locator('[data-visual-site="bankclub"]').click();
    await page.locator("[data-bank-club-admin]").filter({ hasText: liveBankName }).waitFor({ timeout: 12000 });
    results.push(ok("Shared admin automatically refreshes finance and Bank Club leads"));

    await page.locator('[data-bank-lead-status]').first().click();
    await page.locator("[data-bank-club-admin]").filter({ hasText: "已聯繫" }).waitFor({ timeout: 10000 });
    results.push(ok("Bank Club lead status updates through shared admin"));

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("[data-bank-export]")
    ]);
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error("Bank Club admin export download path unavailable");
    const exported = JSON.parse((await import("node:fs")).readFileSync(downloadPath, "utf8"));
    const exportedLead = (exported.leads || []).find((lead) => lead.display_name === uniqueName);
    if (!exportedLead || exported.source_mode !== "api") {
      throw new Error("Bank Club admin export did not include current API lead data");
    }
    results.push(ok("Bank Club admin export includes API leads"));

    const switcherCount = await page.locator(".tfse-site-switcher").count();
    if (switcherCount !== 0) {
      throw new Error("single admin should not render legacy site switcher");
    }
    await page.locator("[data-bank-club-admin]").filter({ hasText: "表單、客戶與站點資料" }).waitFor({ timeout: 8000 });
    await page.locator("[data-admin-visual-console]").waitFor({ timeout: 8000 });
    results.push(ok("Single shared admin includes Bank Club module"));

    const adminFrontendLink = page.locator('[data-bank-club-admin] .tfse-visual-real-entry[href="/"]').first();
    await adminFrontendLink.waitFor({ timeout: 8000 });
    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      adminFrontendLink.click()
    ]);
    await popup.waitForLoadState("networkidle");
    if (new URL(popup.url()).pathname !== "/") {
      throw new Error(`Admin Bank Club link opened unexpected URL: ${popup.url()}`);
    }
    await popup.close();
    results.push(ok("Admin Bank Club link targets root frontend"));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/admin/`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    if (overflow.scrollWidth > overflow.width + 2) {
      throw new Error(`Shared admin mobile overflow ${overflow.scrollWidth} > ${overflow.width}`);
    }
    results.push(ok("Shared admin mobile layout has no horizontal overflow"));

    if (unexpectedResponses.length) {
      results.push(fail("No unexpected HTTP failures", unexpectedResponses.slice(0, 12).join("\n")));
    } else {
      results.push(ok("No unexpected HTTP failures"));
    }
    if (unexpectedErrors.length) {
      results.push(fail("No browser runtime errors", unexpectedErrors.slice(0, 12).join("\n")));
    } else {
      results.push(ok("No browser runtime errors"));
    }
  } catch (error) {
    results.push(fail("Bank Club integrated journey", error.stack || error.message));
  } finally {
    await browser.close();
  }
  return results;
}

async function main() {
  const tempDir = mkdtempSync(join(tmpdir(), "tfse-bank-club-smoke-"));
  const dbPath = join(tempDir, "tfse.sqlite3");
  const apiPort = 8791 + Math.floor(Math.random() * 200);
  const api = spawn("python3", [
    join(ROOT, "backend", "tfse_persistent_api.py"),
    "--host", "127.0.0.1",
    "--port", String(apiPort),
    "--db", dbPath
  ], {
    cwd: ROOT,
    env: { ...process.env, TFSE_ADMIN_PASSWORD: ADMIN_PASSWORD },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const apiLogs = [];
  api.stdout.on("data", (chunk) => apiLogs.push(String(chunk)));
  api.stderr.on("data", (chunk) => apiLogs.push(String(chunk)));

  let server;
  let browserResults = [];
  try {
    await waitForApi(`http://127.0.0.1:${apiPort}/tfse/api/health`);
    server = makeStaticProxyServer(ROOT, apiPort);
    const staticPort = await listen(server, 4176);
    browserResults = await runBrowserChecks(`http://127.0.0.1:${staticPort}`);
  } finally {
    if (server) await closeServer(server);
    api.kill();
    await new Promise((resolveExit) => api.once("exit", resolveExit));
    rmSync(tempDir, { recursive: true, force: true });
  }

  const failed = browserResults.filter((item) => item.status === "failed");
  console.log(JSON.stringify({
    format: "tfse_bank_club_integration_smoke",
    generated_at: new Date().toISOString(),
    passed_count: browserResults.length - failed.length,
    failed_count: failed.length,
    results: browserResults,
    api_log_tail: apiLogs.join("").split("\n").filter(Boolean).slice(-10)
  }, null, 2));
  return failed.length ? 1 : 0;
}

main().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
