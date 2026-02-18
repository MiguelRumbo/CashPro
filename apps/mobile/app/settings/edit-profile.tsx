import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1c2e24' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textSub = '#64876f';
  const primary = '#20df60';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/profile`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setName(result.data.name || '');
        setEmail(result.data.email || '');
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Éxito', 'Perfil actualizado exitosamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen
          options={{
            title: 'Editar Perfil',
            headerStyle: { backgroundColor: surfaceColor },
            headerTintColor: textMain,
          }}
        />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textSub }}>Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Editar Perfil',
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: textMain,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: primary }]}>
            <ThemedText style={styles.avatarText}>
              {getInitials(name)}
            </ThemedText>
          </View>
          <TouchableOpacity style={[styles.changePhotoButton, { backgroundColor: surfaceColor, borderColor }]}>
            <IconSymbol size={16} name="camera.fill" color={primary} />
            <ThemedText style={[styles.changePhotoText, { color: primary }]}>
              Cambiar Foto
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Nombre */}
        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: textMain }]}>Nombre Completo</ThemedText>
          <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderColor }]}>
            <IconSymbol size={20} name="person.fill" color={textSub} />
            <TextInput
              style={[styles.input, { color: textMain }]}
              placeholder="Tu nombre"
              placeholderTextColor={textSub}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: textMain }]}>Correo Electrónico</ThemedText>
          <View style={[styles.inputContainer, { backgroundColor: surfaceColor, borderColor }]}>
            <IconSymbol size={20} name="envelope.fill" color={textSub} />
            <TextInput
              style={[styles.input, { color: textMain }]}
              placeholder="tu@email.com"
              placeholderTextColor={textSub}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: 'rgba(32, 223, 96, 0.1)', borderColor: 'rgba(32, 223, 96, 0.2)' }]}>
          <IconSymbol size={20} name="info.circle.fill" color={primary} />
          <ThemedText style={[styles.infoText, { color: textMain }]}>
            Tu nombre se mostrará en el dashboard y en los reportes. El correo es opcional.
          </ThemedText>
        </View>

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.buttonText, { color: textMain }]}>Cancelar</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: primary }]}
            onPress={handleSave}
          >
            <ThemedText style={[styles.buttonText, { color: '#ffffff' }]}>Guardar</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
