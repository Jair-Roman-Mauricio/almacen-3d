import { randomUUID } from "node:crypto";
const requestHeaders = [
  "cookie",
  "origin",
  "content-type",
  "accept",
  "x-csrf-token",
  "idempotency-key",
];
const responseHeaders = [
  "content-type",
  "content-disposition",
  "x-export-filters",
  "x-request-id",
  "idempotent-replayed",
];
function unavailable() {
  return Response.json(
    {
      error: {
        code: "TEMPORARY_FAILURE",
        message: "No se puede conectar con el servidor. Vuelve a intentarlo.",
        details: [],
        requestId: randomUUID(),
      },
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
export async function proxyRequest(
  request: Request,
  upstream = process.env.API_UPSTREAM_URL ?? "http://127.0.0.1:3001",
) {
  try {
    const url = new URL(request.url),
      base = new URL(upstream);
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password
    )
      return unavailable();
    if (!url.pathname.startsWith("/api/v1/"))
      return new Response(null, {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    const segments = url.pathname
      .slice("/api/v1/".length)
      .split("/")
      .map(decodeURIComponent);
    if (
      segments.some(
        (s) => s === "." || s === ".." || s.includes("/") || s.includes("\\"),
      )
    )
      return Response.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "La ruta no es válida.",
            details: [],
            requestId: randomUUID(),
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    const target = new URL(
        "/api/v1/" + segments.map(encodeURIComponent).join("/") + url.search,
        base.origin,
      ),
      headers = new Headers();
    for (const key of requestHeaders) {
      const value = request.headers.get(key);
      if (value) headers.set(key, value);
    }
    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers,
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    };
    if (request.body && !["GET", "HEAD"].includes(request.method)) {
      init.body = request.body;
      init.duplex = "half";
    }
    const response = await fetch(target, init),
      out = new Headers({ "Cache-Control": "no-store" });
    for (const key of responseHeaders) {
      const value = response.headers.get(key);
      if (value) out.set(key, value);
    }
    for (const cookie of response.headers.getSetCookie())
      out.append("Set-Cookie", cookie);
    if (response.headers.get("content-type")?.includes("text/event-stream"))
      out.set("X-Accel-Buffering", "no");
    return new Response(response.body, {
      status: response.status,
      headers: out,
    });
  } catch {
    return unavailable();
  }
}
