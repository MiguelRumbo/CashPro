import type { AccountRecord } from '@/core/contracts/finance';

import { cardAmount, stackOrder } from '../domain/card-stack';

const account = (over: Partial<AccountRecord>): AccountRecord => ({
  id: 1,
  name: 'BBVA',
  type: 'debit',
  balance: 100,
  currency: 'MXN',
  icon: null,
  color: null,
  clabe: null,
  bank_name: null,
  card_last_four: null,
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
  ...over,
});

describe('card-stack', () => {
  it('muestra saldo en débito y crédito disponible en crédito', () => {
    expect(cardAmount(account({ balance: 250 }))).toEqual({ amount: 250, debt: null });
    expect(cardAmount(account({ type: 'credit', credit_limit: 1000, current_balance: 300 }))).toEqual({
      amount: 700,
      debt: 300,
    });
  });

  it('pone la seleccionada al frente; si no hay, la principal', () => {
    const a = account({ id: 1 });
    const b = account({ id: 2, is_primary: 1 });
    const c = account({ id: 3 });
    expect(stackOrder([a, b, c], null).ordered.map((x) => x.id)).toEqual([1, 3, 2]);
    expect(stackOrder([a, b, c], 3).selected?.id).toBe(3);
    expect(stackOrder([a, b, c], 99).selected?.id).toBe(2);
    expect(stackOrder([], 1)).toEqual({ ordered: [], selected: undefined });
  });
});
