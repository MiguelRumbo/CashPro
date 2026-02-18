import { Platform } from 'react-native';

// Obtener la IP local para desarrollo
// IMPORTANTE: Cambia esta IP por la de tu computadora
// Para obtenerla: Windows (ipconfig), Mac/Linux (ifconfig)
const LOCAL_IP = '192.168.1.6'; // ⚠️ Tu IP local actual

// Configuración de la API
export const API_CONFIG = {
  // Para desarrollo local
  BASE_URL: __DEV__ 
    ? Platform.OS === 'android' 
      ? `http://${LOCAL_IP}:3000/api`  // Android usa IP de la red
      : 'http://localhost:3000/api'     // iOS puede usar localhost
    : 'http://localhost:3000/api',      // Cambiar en producción
};

export const API_ENDPOINTS = {
  ACCOUNTS: '/accounts',
  ACCOUNTS_STATS: '/accounts/stats/total-balance',
};

// Helper para construir URLs completas
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
