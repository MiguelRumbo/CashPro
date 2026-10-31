export const settingsTexts = {
  tabTitle: 'Ajustes',
  menuSubtitle: 'Perfil, tema, moneda y datos',
  themeSection: 'TEMA',
  themes: {
    forest: { name: 'Bosque nocturno', description: 'Oscuro con verde profundo' },
    daylight: { name: 'Claro', description: 'Fondo claro y cifras grandes' },
    wallet: { name: 'Cartera', description: 'Claro con acento índigo' },
  },
  defaultProfileName: 'Usuario',
  errors: {
    nameRequired: 'El nombre es requerido',
    invalidBackup: 'El archivo no es un respaldo válido de CashPro',
    movementsUnavailable: 'El módulo de movimientos está desactivado',
  },
  messages: {
    profileUpdated: 'Perfil actualizado exitosamente',
    dataCleared: 'Todos los datos han sido eliminados correctamente',
    dataImported: 'Datos importados correctamente',
  },
} as const;
