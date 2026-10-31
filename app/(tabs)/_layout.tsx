import { router, Tabs, type Href } from 'expo-router';

import { useRegistry } from '@/core/registry/react';
import { coreTexts } from '@/core/texts';
import { HapticTab, IconSymbol, useAppTheme } from '@/core/ui-kit';
import { FabTabButton } from '@/core/ui-kit/fab-tab-button';

/** Rutas de pestañas existentes; las que ningún módulo activo aporta se ocultan. */
const TAB_ROUTES = ['index', 'movements', 'add', 'accounts', 'more', 'explore', 'settings'] as const;

/** La pestaña "Más" pertenece al núcleo: lista lo que aportan los módulos. */
const MORE_TAB = {
  routeName: 'more',
  title: coreTexts.moreTitle,
  icon: 'ellipsis.circle.fill',
  order: 5,
} as const;

/** El "+" va entre la segunda y la tercera pestaña. */
const FAB_ORDER = 3;
const TAB_ICON_SIZE = 24;

export default function TabLayout() {
  const registry = useRegistry();
  const { tabBar } = useAppTheme();
  const fab = registry.actions('tabbar.fab')[0];
  const tabs = [...registry.tabs(), MORE_TAB];
  const byRoute = new Map<string, { title: string; icon: (typeof tabs)[number]['icon']; order: number }>(
    tabs.map((tab) => [tab.routeName, tab]),
  );
  const orderOf = (route: string) =>
    route === 'add' ? FAB_ORDER : (byRoute.get(route)?.order ?? Number.MAX_SAFE_INTEGER);
  const ordered = [...TAB_ROUTES].sort((a, b) => orderOf(a) - orderOf(b));

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tabBar.active,
        tabBarInactiveTintColor: tabBar.inactive,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontFamily: 'Manrope-SemiBold', fontSize: 11 },
        tabBarStyle: { backgroundColor: tabBar.background, borderTopColor: tabBar.border },
      }}
    >
      {ordered.map((routeName) => {
        if (routeName === 'add') {
          return (
            <Tabs.Screen
              key={routeName}
              name={routeName}
              options={
                fab
                  ? {
                      title: '',
                      tabBarButton: () => (
                        <FabTabButton
                          label={coreTexts.fabLabel}
                          onAction={() => router.push(fab.route as Href)}
                        />
                      ),
                    }
                  : { href: null }
              }
            />
          );
        }
        const tab = byRoute.get(routeName);
        return (
          <Tabs.Screen
            key={routeName}
            name={routeName}
            options={
              tab
                ? {
                    title: tab.title,
                    tabBarIcon: ({ color }) => (
                      <IconSymbol size={TAB_ICON_SIZE} name={tab.icon} color={color} />
                    ),
                  }
                : { href: null }
            }
          />
        );
      })}
    </Tabs>
  );
}
