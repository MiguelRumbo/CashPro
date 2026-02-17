// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type IconMapping = Partial<Record<SymbolViewProps['name'], MaterialIconName>>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'chart.bar.fill': 'bar-chart',
  'creditcard.fill': 'account-balance-wallet',
  'person.fill': 'person',
  // Arrows
  'arrow.up': 'arrow-upward',
  'arrow.down': 'arrow-downward',
  'arrow.up.right': 'trending-up',
  // Actions
  'plus': 'add',
  'minus': 'remove',
  'ellipsis': 'more-horiz',
  // Categories
  'fork.knife': 'restaurant',
  'car.fill': 'directions-car',
  'bag.fill': 'shopping-bag',
  // Finance
  'building.columns.fill': 'account-balance',
  'banknote': 'payments',
  'creditcard': 'credit-card',
  'dollarsign.circle.fill': 'savings',
  'plus.circle.fill': 'add-circle',
  'bell.fill': 'notifications',
  // Movimientos
  'receipt': 'receipt-long',
  'magnifyingglass': 'search',
  'cup.and.saucer.fill': 'local-cafe',
  'fuelpump.fill': 'local-gas-station',
  'film': 'movie',
  'dumbbell': 'fitness-center',
  'cross.case.fill': 'local-pharmacy',
  // Ajustes
  'gearshape.fill': 'settings',
  'pencil': 'edit',
  'chart.pie.fill': 'pie-chart',
  'moon.fill': 'dark-mode',
  'faceid': 'face',
  'number': 'dialpad',
  'arrow.down.circle.fill': 'file-download',
  'arrow.up.circle.fill': 'file-upload',
  'chevron.forward': 'arrow-forward-ios',
  'arrow.backward': 'arrow-back',
  // Reportes
  'arrow.down.right': 'trending-down',
  'lightbulb': 'lightbulb',
  'calendar': 'event',
  'ellipsis.vertical': 'more-vert',
  // General
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]!} style={style} />;
}
