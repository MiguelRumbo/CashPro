import { fireEvent, render, screen } from '@testing-library/react-native';

import { securityTexts } from '../texts';
import { LockView } from '../ui/lock-view';

jest.mock('@/core/ui-kit/icon-symbol', () => ({ IconSymbol: () => null }));

describe('LockView', () => {
  it('muestra el botón y llama a onUnlock', async () => {
    const onUnlock = jest.fn();
    await render(<LockView canUnlock failed={false} onUnlock={onUnlock} />);
    await fireEvent.press(screen.getByRole('button', { name: securityTexts.unlockButton }));
    expect(onUnlock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(securityTexts.failed)).toBeNull();
  });

  it('oculta el botón mientras verifica y muestra el error si falló', async () => {
    await render(<LockView canUnlock={false} failed onUnlock={jest.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText(securityTexts.failed)).toBeTruthy();
  });
});
