import { spawnSync } from 'node:child_process';

const task = process.argv[2];
if (!['build', 'typecheck', 'backend'].includes(task)) throw new Error('Comando de workspace desconocido.');
const shared = ['domain', 'contracts', 'database', 'ui'];
const workspaces = [...shared, 'api', 'web'];

function run(name, command) {
  const result = spawnSync(process.env.npm_execpath, ['--filter', `@almacen/${name}`, 'run', command], {
    stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (task === 'backend') {
  for (const name of ['domain', 'contracts', 'database', 'api']) run(name, 'build');
  process.exit(0);
}
if (task === 'typecheck') for (const name of [...shared, 'api']) run(name, 'build');
for (const name of workspaces) run(name, task);
if (task === 'typecheck') {
  const fixtures = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.fixtures.json'], { stdio: 'inherit' });
  if (fixtures.status !== 0) process.exit(fixtures.status ?? 1);
  const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.tests.json'], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
