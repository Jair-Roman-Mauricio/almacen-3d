import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = (await readFile(path.join(root, '.node-version'), 'utf8')).trim();
if (!['darwin', 'linux'].includes(process.platform) || !['arm64', 'x64'].includes(process.arch)) {
  throw new Error('Instala el Node de .node-version para esta plataforma sin cambiar el runtime de otros proyectos.');
}
const distribution = `node-v${version}-${process.platform}-${process.arch}`;
const archive = `${distribution}.tar.gz`;
const base = `https://nodejs.org/dist/v${version}/`;
const runtime = path.join(root, '.tools', distribution);
const current = spawnSync(path.join(runtime, 'bin/node'), ['--version'], { encoding: 'utf8' });
if (current.status === 0 && current.stdout.trim() === `v${version}`) {
  console.log(`Runtime disponible: ${runtime}/bin`);
} else {
  const [manifestResponse, archiveResponse] = await Promise.all([fetch(base + 'SHASUMS256.txt'), fetch(base + archive)]);
  if (!manifestResponse.ok || !archiveResponse.ok) throw new Error('No se pudo descargar el runtime oficial fijado.');
  const manifest = await manifestResponse.text();
  const expected = manifest.split('\n').map(line => line.trim().split(/\s+/u)).find(line => line[1] === archive)?.[0];
  const bytes = Buffer.from(await archiveResponse.arrayBuffer());
  if (!expected || createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error('Checksum de Node incorrecto.');
  await mkdir(path.join(root, '.tools'), { recursive: true });
  const destination = path.join(root, '.tools', archive);
  await writeFile(destination, bytes);
  const result = spawnSync('tar', ['-xzf', destination, '-C', path.join(root, '.tools')], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('No se pudo extraer Node.');
  console.log(`Runtime verificado: ${runtime}/bin`);
}
