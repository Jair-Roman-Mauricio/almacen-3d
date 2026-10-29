import { createHash } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const version = manifest.packageManager.split('@')[1];
const target = `${process.platform}-${process.arch}`;
const folder = path.join(root, '.tools', `pnpm-${version}-${target}`);
const binary = path.join(folder, 'package', process.platform === 'win32' ? 'pnpm.exe' : 'pnpm');
if (existsSync(binary)) {
  const check = spawnSync(binary, ['--version'], { encoding: 'utf8' });
  if (check.status === 0 && check.stdout.trim() === version) {
    console.log(`pnpm ${version} disponible en .tools.`);
    process.exit(0);
  }
}
const name = `@pnpm/exe.${target}`;
const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`);
if (!response.ok) throw new Error('No existe una distribución de pnpm para esta plataforma.');
const metadata = await response.json();
const download = await fetch(metadata.dist.tarball);
if (!download.ok) throw new Error('No se pudo descargar pnpm.');
const bytes = Buffer.from(await download.arrayBuffer());
const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
if (integrity !== metadata.dist.integrity) throw new Error('La integridad de pnpm no coincide con el registro oficial.');
await mkdir(folder, { recursive: true });
const archive = path.join(folder, 'pnpm.tgz');
await writeFile(archive, bytes);
const extraction = spawnSync('tar', ['-xzf', archive, '-C', folder], { stdio: 'inherit' });
if (extraction.status !== 0 || !existsSync(binary)) throw new Error('No se pudo preparar pnpm.');
await chmod(binary, 0o755);
const check = spawnSync(binary, ['--version'], { encoding: 'utf8' });
if (check.status !== 0 || check.stdout.trim() !== version) throw new Error('La versión de pnpm no coincide.');
console.log(`pnpm ${version} descargado y verificado dentro del proyecto.`);
