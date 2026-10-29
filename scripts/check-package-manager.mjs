import { readFileSync } from 'node:fs';

const { packageManager } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const expected = packageManager.replace('@', '/');
if (!(process.env.npm_config_user_agent ?? '').startsWith(expected + ' ')) {
  console.error(`Este proyecto usa exclusivamente ${packageManager}. Ejecuta pnpm install --frozen-lockfile.`);
  process.exit(1);
}
