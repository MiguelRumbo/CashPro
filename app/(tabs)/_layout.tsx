import { Tabs } from 'expo-router';

import { useAppConfig, useRegistry } from '@/core/registry/react';
import { HapticTab, IconSymbol, useColorScheme, Colors } from '@/core/ui-kit';

/** Rutas de pestañas existentes; las que ningún módulo activo aporta se ocultan. */
const TAB_ROUTES = ['index', 'movements', 'explore', 'accounts', 'more', 'settings'] as const;

/** La pestaña "Más" pertenece al núcleo: lista lo que aportan los módulos. */
const MORE_TAB = { routeName: 'more', title: 'Más', icon: 'ellipsis.circle.fill', order: 5 } as const;

const TAB_ICON_SIZE = 26;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const registry = useRegistry();
  const { ui } = useAppConfig();
  const tabs = [...registry.tabs(), MORE_TAB].sort((a, b) => a.order - b.order);
  const byRoute = new Map(tabs.map((tab) => [tab.routeName, tab]));
  const ordered = [...TAB_ROUTES].sort(
    (a, b) =>
      (byRoute.get(a)?.order ?? Number.MAX_SAFE_INTEGER) - (byRoute.get(b)?.order ?? Number.MAX_SAFE_INTEGER),
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ui.primaryColor,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a2c20' : '#ffffff',
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
        },
      }}
    >
      {ordered.map((routeName) => {
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
