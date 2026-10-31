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
  { id: '1', name: 'Comida', icon: 'fork.knife', color: '#ea580c', bg: 'rgba(234,88,12,0.16)' },
  { id: '2', name: 'Comestibles', icon: 'cart.fill', color: '#16a34a', bg: 'rgba(34,197,94,0.16)' },
  { id: '3', name: 'Compras', icon: 'bag.fill', color: '#dc2626', bg: 'rgba(239,68,68,0.14)' },
  { id: '4', name: 'Transporte', icon: 'car.fill', color: '#2563eb', bg: 'rgba(59,130,246,0.16)' },
  { id: '5', name: 'Entretenimiento', icon: 'film', color: '#db2777', bg: 'rgba(219,39,119,0.14)' },
  { id: '6', name: 'Facturas', icon: 'doc.text.fill', color: '#059669', bg: 'rgba(16,185,129,0.16)' },
  { id: '7', name: 'Regalos', icon: 'gift.fill', color: '#dc2626', bg: 'rgba(239,68,68,0.14)' },
  { id: '8', name: 'Belleza', icon: 'sparkles', color: '#d946ef', bg: 'rgba(217,70,239,0.14)' },
  { id: '9', name: 'Trabajo', icon: 'briefcase.fill', color: '#92400e', bg: 'rgba(245,158,11,0.16)' },
  { id: '10', name: 'Viajes', icon: 'airplane', color: '#0891b2', bg: 'rgba(8,145,178,0.16)' },
  { id: '11', name: 'Ingreso', icon: 'dollarsign.circle.fill', color: '#ca8a04', bg: 'rgba(202,138,4,0.16)' },
  { id: '12', name: 'Corrección', icon: 'chart.bar.fill', color: '#7c3aed', bg: 'rgba(124,58,237,0.16)' },
];

export function findCategory(id: string | null | undefined): Category | undefined {
  return id ? categories.find((c) => c.id === id) : undefined;
}
