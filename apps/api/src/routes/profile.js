const express = require('express');
const router = express.Router();
const { db } = require('../database/db-json');

// Obtener perfil de usuario
router.get('/', (req, res) => {
  try {
    console.log('=== GET PROFILE DEBUG ===');
    const profiles = db.prepare('SELECT * FROM user_profile').all();
    console.log('Todos los perfiles:', profiles);
    
    // Buscar el perfil con ID 1 o el último creado
    let profile = profiles.find(p => p.id === 1);
    
    if (!profile && profiles.length > 0) {
      // Si no hay perfil con ID 1, usar el último
      profile = profiles[profiles.length - 1];
      console.log('Usando último perfil:', profile);
    }
    
    if (!profile) {
      console.log('No hay perfil, creando uno por defecto');
      // Crear perfil por defecto si no existe
      const defaultProfile = {
        name: 'Usuario',
        email: '',
      };
      
      const stmt = db.prepare(`
        INSERT INTO user_profile (name, email) VALUES (?, ?)
      `);
      
      const result = stmt.run(defaultProfile.name, defaultProfile.email);
      console.log('Resultado INSERT:', result);
      const newProfile = db.prepare('SELECT * FROM user_profile WHERE id = ?').get(result.lastInsertRowid);
      console.log('Nuevo perfil creado:', newProfile);
      console.log('=== FIN DEBUG ===');
      
      return res.json({ success: true, data: newProfile });
    }
    
    console.log('Perfil encontrado:', profile);
    console.log('=== FIN DEBUG ===');
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar perfil de usuario
router.put('/', (req, res) => {
  try {
    const { name, email, currency } = req.body;
    
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('Datos recibidos:', { name, email, currency });
    
    // Validaciones
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'El nombre es requerido' 
      });
    }
    
    // Obtener todos los perfiles
    const profiles = db.prepare('SELECT * FROM user_profile').all();
    console.log('Perfiles existentes:', profiles);
    
    // Buscar el perfil con ID 1 o el último creado
    let existingProfile = profiles.find(p => p.id === 1);
    
    if (!existingProfile && profiles.length > 0) {
      existingProfile = profiles[profiles.length - 1];
    }
    
    console.log('Perfil a actualizar:', existingProfile);
    
    if (!existingProfile) {
      console.log('No existe perfil, creando uno nuevo');
      // Crear perfil si no existe
      const stmt = db.prepare(`
        INSERT INTO user_profile (name, email, currency) VALUES (?, ?, ?)
      `);
      
      const result = stmt.run(name.trim(), email?.trim() || '', currency || 'MXN');
      console.log('Resultado INSERT:', result);
      const newProfile = db.prepare('SELECT * FROM user_profile WHERE id = ?').get(result.lastInsertRowid);
      console.log('Nuevo perfil:', newProfile);
      console.log('=== FIN DEBUG ===');
      
      return res.json({ 
        success: true, 
        data: newProfile,
        message: 'Perfil creado exitosamente' 
      });
    }
    
    // Actualizar perfil existente
    console.log(`Actualizando perfil ID ${existingProfile.id}`);
    const updateResult = db.prepare(`
      UPDATE user_profile 
      SET name = ?, email = ?, currency = ?, updated_at = ?
      WHERE id = ?
    `).run(name.trim(), email?.trim() || '', currency || 'MXN', new Date().toISOString(), existingProfile.id);
    
    console.log('Resultado UPDATE:', updateResult);
    
    const updatedProfile = db.prepare('SELECT * FROM user_profile WHERE id = ?').get(existingProfile.id);
    console.log('Perfil actualizado:', updatedProfile);
    console.log('=== FIN DEBUG ===');
    
    res.json({ 
      success: true, 
      data: updatedProfile,
      message: 'Perfil actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
