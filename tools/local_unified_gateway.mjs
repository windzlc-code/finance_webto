#!/usr/bin/env node

import http from "node:http";

const host = process.env.TFSE_GATEWAY_HOST || "127.0.0.1";
const port = Number(process.env.TFSE_GATEWAY_PORT || 8080);
const bankClubPort = Number(process.env.BANKCLUB_PORT || 3000);
const backadminPort = Number(process.env.BACKADMIN_PORT || 8788);

function routeFor(url) {
  if (url === "/admin" || url === "/admin.html") return { redirect: "/admin/" };
  if (url.startsWith("/admin/")) {
    return { port: backadminPort, path: url.slice("/admin".length) || "/" };
  }
  if (url === "/api/leads" || url === "/api/events" || url.startsWith("/api/files/")) {
    return { port: bankClubPort, path: url };
  }
  if (url.startsWith("/api/") || url.startsWith("/tfse/api/")) {
    return { port: backadminPort, path: url };
  }
  if (url === "/tfse") return { redirect: "/tfse/" };
  if (url.startsWith("/tfse/")) {
    return { port: backadminPort, path: url.slice("/tfse".length) || "/" };
  }
  return { port: bankClubPort, path: url };
}

const server = http.createServer((request, response) => {
  const route = routeFor(request.url || "/");
  if (route.redirect) {
    response.writeHead(308, { Location: route.redirect });
    response.end();
    return;
  }

  const forwardedFor = [request.headers["x-forwarded-for"], request.socket.remoteAddress]
    .filter(Boolean)
    .join(", ");
  const upstream = http.request({
    hostname: "127.0.0.1",
    port: route.port,
    path: route.path,
    method: request.method,
    headers: {
      ...request.headers,
      host: request.headers.host || `${host}:${port}`,
      "x-forwarded-for": forwardedFor,
      "x-forwarded-proto": "http",
    },
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });

  upstream.on("error", (error) => {
    if (response.headersSent) {
      response.destroy(error);
      return;
    }
    response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "gateway_upstream_failed", detail: error.message }));
  });
  request.pipe(upstream);
});

server.listen(port, host, () => {
  console.log(`TFSE unified gateway listening on http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
