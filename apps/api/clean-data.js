const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

console.log('🧹 Limpiando datos duplicados...');

// Leer datos
const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

console.log('📊 Estado actual:');
console.log(`- Cuentas: ${data.accounts.length}`);
console.log(`- Perfiles: ${data.user_profile.length}`);

// Limpiar perfiles duplicados - mantener solo el último con datos válidos
if (data.user_profile && data.user_profile.length > 0) {
  // Buscar el último perfil con nombre diferente a "Usuario"
  const validProfile = data.user_profile.reverse().find(p => p.name && p.name !== 'Usuario');
  
  if (validProfile) {
    console.log('✅ Perfil válido encontrado:', validProfile);
    // Mantener solo este perfil con ID 1
    data.user_profile = [{
      id: 1,
      name: validProfile.name,
      email: validProfile.email || '',
      currency: validProfile.currency || 'MXN',
      created_at: validProfile.created_at,
      updated_at: new Date().toISOString(),
    }];
  } else {
    // Si no hay perfil válido, crear uno por defecto
    console.log('⚠️  No se encontró perfil válido, creando uno por defecto');
    data.user_profile = [{
      id: 1,
      name: 'Usuario',
      email: '',
      currency: 'MXN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }];
  }
  
  data.nextProfileId = 2;
}

// Verificar estado de is_primary en cuentas
console.log('\n📋 Estado de cuentas:');
data.accounts.forEach(account => {
  console.log(`- ${account.name}: is_primary = ${account.is_primary}`);
});

// Escribir datos limpios
fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

console.log('\n✅ Datos limpiados exitosamente');
console.log('📊 Estado final:');
console.log(`- Cuentas: ${data.accounts.length}`);
console.log(`- Perfiles: ${data.user_profile.length}`);
console.log(`- Perfil activo:`, data.user_profile[0]);
