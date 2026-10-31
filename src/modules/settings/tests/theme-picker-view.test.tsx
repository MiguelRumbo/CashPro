import { fireEvent, render, screen } from '@testing-library/react-native';

import { settingsTexts } from '../texts';
import { ThemePickerView } from '../ui/theme-picker-view';

jest.mock('@/core/ui-kit/icon-symbol', () => ({ IconSymbol: () => null }));

describe('ThemePickerView', () => {
  it('marca el tema seleccionado y avisa al elegir otro', async () => {
    const onSelect = jest.fn();
    await render(<ThemePickerView selected="forest" onSelect={onSelect} />);
    expect(
      screen.getByRole('radio', { name: settingsTexts.themes.forest.name }).props.accessibilityState,
    ).toEqual({
      selected: true,
    });
    await fireEvent.press(screen.getByRole('radio', { name: settingsTexts.themes.wallet.name }));
    expect(onSelect).toHaveBeenCalledWith('wallet');
  });
});
