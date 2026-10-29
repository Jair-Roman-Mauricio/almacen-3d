import assert from 'node:assert/strict';
import path from 'node:path';
import { ESLint } from 'eslint';

const eslint = new ESLint();
const checks = [
  ['packages/domain', "import 'node:fs';", true],
  ['packages/domain', "import 'pg';", true],
  ['packages/domain', "import '@nestjs/common';", true],
  ['packages/domain', "import 'react';", true],
  ['packages/domain', "import '@almacen/database';", true],
  ['packages/domain', "import '../../database/src/index.js';", true],
  ['packages/domain', "import 'decimal.js';", false],
  ['packages/ui', "import '@almacen/database';", true],
  ['apps/web', "import '@almacen/database';", true],
  ['apps/web', "import '@almacen/contracts';", false],
  ['apps/api', "import '@almacen/domain';", false],
];

for (const [directory, source, forbidden] of checks) {
  const results = await eslint.lintText(source, { filePath: path.resolve(directory, 'src/__architecture_probe.ts') });
  const violations = results.flatMap(result => result.messages).filter(message => message.ruleId === 'architecture/boundaries');
  assert.equal(violations.length > 0, forbidden, `${directory}: ${source}`);
}
console.log(`Límites de capas: ${checks.length}/${checks.length} comprobaciones correctas.`);
