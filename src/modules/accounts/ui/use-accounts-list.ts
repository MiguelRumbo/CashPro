import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import {
  movementsLedgerKey,
  type AccountRecord,
  type AccountsStats,
  type MovementWithAccount,
} from '@/core/contracts/finance';
import { useCapability } from '@/core/registry/react';

import { stackOrder } from '../domain/card-stack';
import { getAccountsRuntime } from '../runtime';

/** Máximo de movimientos recientes que se muestran bajo la tarjeta seleccionada. */
const RECENT_LIMIT = 5;

/** Estado de la pantalla de cuentas: lista, totales, selección y movimientos recientes. */
export function useAccountsList() {
  const { accounts: service } = getAccountsRuntime();
  const ledger = useCapability(movementsLedgerKey);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [stats, setStats] = useState<AccountsStats | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [movements, setMovements] = useState<MovementWithAccount[]>([]);

  const reload = useCallback(() => {
    const list = service.getAccounts();
    const totals = service.getAccountsStats();
    setFailed(!list.success);
    if (list.success) setAccounts(list.data);
    if (totals.success) setStats(totals.data);
    setMovements(ledger?.list() ?? []);
  }, [service, ledger]);

  useFocusEffect(reload);

  const { ordered, selected } = useMemo(() => stackOrder(accounts, selectedId), [accounts, selectedId]);

  const recent = useMemo(
    () =>
      selected
        ? movements
            .filter((m) => m.account_id === selected.id || m.to_account_id === selected.id)
            .slice(0, RECENT_LIMIT)
        : [],
    [movements, selected],
  );

  const remove = (id: number) => {
    const result = service.deleteAccount(id);
    if (result.success) reload();
    return result;
  };

  return { accounts, ordered, selected, stats, recent, failed, select: setSelectedId, remove, reload };
}
