import { allModuleIds, startApp } from './support';

describe('arranque con módulos apagados', () => {
  it('con todos los módulos activos aporta todas las pestañas', async () => {
    const app = await startApp();
    expect(app.registry.failedModules().size).toBe(0);
    expect(app.registry.tabs().map((t) => t.routeName)).toEqual([
      'index',
      'movements',
      'explore',
      'accounts',
      'settings',
    ]);
    expect(app.registry.actions('more.menu')).toHaveLength(5);
    app.dispose();
  });

  it.each(allModuleIds)('arranca sin el módulo %s', async (id) => {
    const app = await startApp([id]);
    expect(app.registry.isActive(id)).toBe(false);
    expect(app.registry.failedModules().size).toBe(0);
    expect(app.registry.activeModules()).toHaveLength(allModuleIds.length - 1);
    app.dispose();
  });

  it('arranca con todos los módulos apagados', async () => {
    const app = await startApp(allModuleIds);
    expect(app.registry.activeModules()).toHaveLength(0);
    expect(app.registry.tabs()).toEqual([]);
    app.dispose();
  });
});
