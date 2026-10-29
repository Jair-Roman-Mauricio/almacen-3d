export function GET(): Response {
  return Response.json(
    { data: { service: 'almacen-web', status: 'ok' } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
