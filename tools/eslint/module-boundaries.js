/**
 * Regla local: hace cumplir las dependencias entre capas (CLAUDE.md §6.1).
 *   config    -> nada del proyecto
 *   core      -> config
 *   módulo A  -> config, core, su propio módulo (nunca otro módulo)
 *   bootstrap -> config, core y el index.ts de cada módulo
 *   app       -> config, core, bootstrap (nunca modules)
 */
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src');

function layerOf(absPath) {
  const rel = path.relative(ROOT, absPath).split(path.sep);
  if (rel[0] === 'app') return { layer: 'app' };
  if (rel[0] !== 'src') return { layer: 'other' };
  if (rel[1] === 'modules') return { layer: 'module', module: rel[2], rest: rel.slice(3) };
  return { layer: rel[1] ?? 'other' };
}

function resolveImport(source, fromFile) {
  if (source.startsWith('@/')) return path.join(SRC, source.slice(2));
  if (source.startsWith('.')) return path.resolve(path.dirname(fromFile), source);
  return undefined;
}

const isModuleIndex = (target) =>
  target.rest.length === 0 || (target.rest.length === 1 && /^index(\.tsx?)?$/.test(target.rest[0]));

module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Límites de importación entre capas y módulos' },
    schema: [],
    messages: {
      forbidden: '{{from}} no puede importar {{to}} ({{why}}).',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const from = layerOf(filename);
    const check = (node, source) => {
      if (typeof source !== 'string') return;
      const resolved = resolveImport(source, filename);
      if (!resolved) return;
      const to = layerOf(resolved);
      const report = (why) =>
        context.report({ node, messageId: 'forbidden', data: { from: from.layer, to: source, why } });
      if (from.layer === 'config' && to.layer !== 'config') return report('config no depende del proyecto');
      if (from.layer === 'core' && ['module', 'bootstrap', 'app'].includes(to.layer)) {
        return report('core no conoce módulos ni bootstrap');
      }
      if (from.layer === 'module') {
        if (to.layer === 'module' && to.module !== from.module) return report('usa eventos o capacidades');
        if (to.layer === 'bootstrap' || to.layer === 'app')
          return report('un módulo no conoce el arranque ni las rutas');
      }
      if (from.layer === 'bootstrap') {
        if (to.layer === 'app') return report('bootstrap no conoce las rutas');
        if (to.layer === 'module' && !isModuleIndex(to)) return report('solo el index.ts del módulo');
      }
      if (from.layer === 'app' && to.layer === 'module') return report('las rutas usan <ModuleScreen>');
      return undefined;
    };
    return {
      ImportDeclaration: (node) => check(node, node.source.value),
      ExportNamedDeclaration: (node) => node.source && check(node, node.source.value),
      ExportAllDeclaration: (node) => check(node, node.source.value),
      CallExpression: (node) => {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments[0]?.type === 'Literal'
        ) {
          check(node, node.arguments[0].value);
        }
      },
    };
  },
};
