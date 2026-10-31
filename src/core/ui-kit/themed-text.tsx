import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { fontFamilyFor } from './typography';

import { useThemeColor } from './use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({ style, lightColor, darkColor, type = 'default', ...rest }: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const typeStyle =
    type === 'title'
      ? styles.title
      : type === 'defaultSemiBold'
        ? styles.defaultSemiBold
        : type === 'subtitle'
          ? styles.subtitle
          : type === 'link'
            ? styles.link
            : styles.default;
  const flat: TextStyle = StyleSheet.flatten([typeStyle, style]) ?? {};
  // Cada peso es una familia en Android: se elige la familia y se quita fontWeight.
  const fontFamily = flat.fontFamily ?? fontFamilyFor(flat.fontWeight, flat.fontSize);

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
        { fontFamily, fontWeight: 'normal' },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
