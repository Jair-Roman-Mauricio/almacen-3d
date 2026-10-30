import { proxyRequest } from "../../../../server/api-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  return proxyRequest(request);
}
export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as HEAD,
};
