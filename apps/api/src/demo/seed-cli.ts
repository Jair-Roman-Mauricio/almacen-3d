import pg from 'pg';
import { seedDemo } from './seed-demo.js';
const pools: pg.Pool[] = [];
try {
  if (process.env.DEMO_MODE !== 'true')
    throw new Error('La carga requiere DEMO_MODE=true explícito.');
  if (!process.env.DATABASE_URL || !process.env.DATABASE_PROVISION_URL)
    throw new Error('Configura las conexiones de aplicación y provisión.');
  const appPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 }), provisionPool = new pg.Pool({ connectionString: process.env.DATABASE_PROVISION_URL, max: 1 });
  pools.push(appPool, provisionPool);
  const mode = process.env.INSTALLATION_MODE ?? 'saas';
  if (mode !== 'saas' && mode !== 'local')
    throw new Error('La modalidad no es válida.');
  const result = await seedDemo({ appPool, provisionPool, mode, demoMode: true });
  console.log(`Demo sintética v${result.version}: ${result.companies} empresas; ${result.accounts} cuentas ficticias. No se reiniciaron datos existentes.`);
}
catch (error) {
  console.error(error instanceof Error && ['DomainError', 'Error'].includes(error.name) ? error.message : 'No se pudo cargar la demostración.');
  process.exitCode = 1;
}
finally {
  await Promise.all(pools.map(pool => pool.end()));
}
