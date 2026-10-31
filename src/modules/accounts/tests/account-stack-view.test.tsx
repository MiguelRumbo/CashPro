import { fireEvent, render, screen } from '@testing-library/react-native';

import type { AccountRecord } from '@/core/contracts/finance';

import { AccountStackView } from '../ui/account-stack-view';

const account = (id: number, name: string): AccountRecord => ({
  id,
  name,
  type: 'debit',
  balance: 100 * id,
  currency: 'MXN',
  icon: null,
  color: null,
  clabe: null,
  bank_name: null,
  card_last_four: '1234',
  generates_interest: 0,
  interest_rate: 0,
  credit_limit: 0,
  current_balance: 0,
  cut_off_day: null,
  payment_due_day: null,
  is_primary: 0,
  include_in_balance: 1,
  created_at: '',
  updated_at: '',
});

describe('AccountStackView', () => {
  it('trae al frente una tarjeta de atrás y abre la del frente', async () => {
    const onSelect = jest.fn();
    const onOpen = jest.fn();
    const format = (n: number) => `$${n}`;
    await render(
      <AccountStackView
        ordered={[account(1, 'Efectivo'), account(2, 'BBVA')]}
        selectedId={2}
        formatCurrency={format}
        onSelect={onSelect}
        onOpen={onOpen}
        onLongPress={jest.fn()}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: /Efectivo/ }));
    expect(onSelect).toHaveBeenCalledWith(1);
    await fireEvent.press(screen.getByRole('button', { name: /BBVA/ }));
    expect(onOpen).toHaveBeenCalledWith(2);
  });
});
