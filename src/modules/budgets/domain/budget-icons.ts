export interface BudgetIcon {
  icon: string;
  color: string;
  label: string;
}

/** Íconos disponibles para presupuestos (el primero es el valor por defecto). */
export const budgetIcons: readonly [BudgetIcon, ...BudgetIcon[]] = [
  { icon: 'cart.fill', color: '#8b5cf6', label: 'Compras' },
  { icon: 'fork.knife', color: '#ef4444', label: 'Comida' },
  { icon: 'car.fill', color: '#10b981', label: 'Transporte' },
  { icon: 'house.fill', color: '#f59e0b', label: 'Hogar' },
  { icon: 'film', color: '#ec4899', label: 'Entretenimiento' },
  { icon: 'heart.fill', color: '#f43f5e', label: 'Salud' },
  { icon: 'briefcase.fill', color: '#6366f1', label: 'Trabajo' },
  { icon: 'sparkles', color: '#d946ef', label: 'Otros' },
];
