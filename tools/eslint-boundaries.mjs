import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builtins = new Set(builtinModules.flatMap(name => [name, 'node:' + name]));
const workspace = filename => {
  const parts = path.relative(root, filename).split(path.sep);
  return ['apps', 'packages'].includes(parts[0]) ? parts[0] + '/' + parts[1] : null;
};
const allowed = {
  'apps/web': ['packages/contracts', 'packages/ui'],
  'apps/api': ['packages/contracts', 'packages/domain', 'packages/database'],
  'packages/contracts': ['packages/domain'],
  'packages/database': ['packages/domain', 'packages/contracts'],
  'packages/ui': ['packages/contracts'],
  'packages/domain': [],
};

export const boundaries = {
  meta: { type: 'problem', schema: [], messages: {
    forbidden: 'Dependencia no permitida: {{from}} → {{to}}.',
    effect: 'El dominio puro no puede importar framework, SQL, red o módulos Node: {{source}}.',
    dynamic: 'Una importación dinámica no literal impide verificar los límites de capas.',
  } },
  create(context) {
    const from = workspace(context.filename);
    if (!from) return {};
    function check(node, source) {
      if (from === 'packages/domain' && (builtins.has(source) || /^(?:next|react|@nestjs|pg|drizzle-orm|axios|undici)(?:$|\/)/u.test(source))) {
        context.report({ node, messageId: 'effect', data: { source } });
        return;
      }
      let to = null;
      if (source.startsWith('@almacen/')) {
        const name = source.split('/')[1];
        to = ['web', 'api'].includes(name) ? 'apps/' + name : 'packages/' + name;
      } else if (source.startsWith('.')) {
        to = workspace(path.resolve(path.dirname(context.filename), source));
      }
      if (to && to !== from && !allowed[from]?.includes(to)) {
        context.report({ node, messageId: 'forbidden', data: { from, to } });
      }
    }
    return {
      ImportDeclaration: node => check(node, node.source.value),
      ExportNamedDeclaration: node => { if (node.source) check(node, node.source.value); },
      ExportAllDeclaration: node => check(node, node.source.value),
      ImportExpression: node => {
        if (typeof node.source.value === 'string') check(node, node.source.value);
        else context.report({ node, messageId: 'dynamic' });
      },
    };
  },
};
