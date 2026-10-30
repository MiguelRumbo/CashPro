/**
 * Catálogo de categorías de v1 (ids '1'..'12', referenciados por movimientos y presupuestos).
 * En v2 pasa a la tabla `categories` (ver docs/migration-v1-v2.md).
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
}

export const categories: readonly Category[] = [
  { id: '1', name: 'Comida', icon: 'fork.knife', color: '#ea580c', bg: '#ffedd5' },
  { id: '2', name: 'Comestibles', icon: 'cart.fill', color: '#16a34a', bg: '#dcfce7' },
  { id: '3', name: 'Compras', icon: 'bag.fill', color: '#dc2626', bg: '#fee2e2' },
  { id: '4', name: 'Transporte', icon: 'car.fill', color: '#2563eb', bg: '#dbeafe' },
  { id: '5', name: 'Entretenimiento', icon: 'film', color: '#db2777', bg: '#fce7f3' },
  { id: '6', name: 'Facturas', icon: 'doc.text.fill', color: '#059669', bg: '#d1fae5' },
  { id: '7', name: 'Regalos', icon: 'gift.fill', color: '#dc2626', bg: '#fee2e2' },
  { id: '8', name: 'Belleza', icon: 'sparkles', color: '#d946ef', bg: '#fae8ff' },
  { id: '9', name: 'Trabajo', icon: 'briefcase.fill', color: '#92400e', bg: '#fef3c7' },
  { id: '10', name: 'Viajes', icon: 'airplane', color: '#0891b2', bg: '#cffafe' },
  { id: '11', name: 'Ingreso', icon: 'dollarsign.circle.fill', color: '#ca8a04', bg: '#fef9c3' },
  { id: '12', name: 'Corrección', icon: 'chart.bar.fill', color: '#7c3aed', bg: '#ede9fe' },
];

export function findCategory(id: string | null | undefined): Category | undefined {
  return id ? categories.find((c) => c.id === id) : undefined;
}
