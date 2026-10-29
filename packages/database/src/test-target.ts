export function assertTestDatabaseTarget(testUrl: string, developmentUrl: string): void {
  const message = 'Configura una base de pruebas separada, con nombre terminado en _test y URL PostgreSQL sin parámetros.';
  try {
    const test = new URL(testUrl);
    const development = new URL(developmentUrl);
    for (const url of [test, development]) {
      if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.search || url.hash) throw new Error(message);
    }
    const database = decodeURIComponent(test.pathname.slice(1));
    const endpoint = (url: URL): string => {
      const hostname = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname) ? 'loopback' : url.hostname;
      return `${hostname}:${url.port || '5432'}/${decodeURIComponent(url.pathname.slice(1))}`;
    };
    if (!database.endsWith('_test') || endpoint(test) === endpoint(development)) throw new Error(message);
  } catch {
    throw new Error(message);
  }
}
