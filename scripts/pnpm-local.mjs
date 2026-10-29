#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nodeVersion = readFileSync(path.join(root, '.node-version'), 'utf8').trim();
const version = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).packageManager.split('@')[1];
const nodeBin = path.join(root, '.tools', `node-v${nodeVersion}-${process.platform}-${process.arch}`, 'bin');
const managerBin = path.join(root, '.tools', `pnpm-${version}-${process.platform}-${process.arch}`, 'package');
const executable = path.join(managerBin, process.platform === 'win32' ? 'pnpm.exe' : 'pnpm');
if (!existsSync(path.join(nodeBin, 'node')) || !existsSync(executable)) {
  console.error('Prepara las herramientas: node scripts/setup-runtime.mjs y node scripts/setup-pnpm.mjs');
  process.exit(1);
}
const result = spawnSync(executable, process.argv.slice(2), {
  cwd: root, stdio: 'inherit',
  env: { ...process.env, PATH: [nodeBin, managerBin, process.env.PATH ?? ''].join(path.delimiter), NEXT_TELEMETRY_DISABLED: '1' },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
