import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Plus, Target, Shield, TriangleAlert as AlertTriangle, X, Save, Trash2 } from 'lucide-react-native';

interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: 'safe' | 'alert' | 'custom';
  active: boolean;
}

interface GeofenceManagerProps {
  zones: GeofenceZone[];
  onAddZone: (zone: Omit<GeofenceZone, 'id'>) => void;
  onUpdateZone: (id: string, updates: Partial<GeofenceZone>) => void;
  onDeleteZone: (id: string) => void;
  visible: boolean;
  onClose: () => void;
  currentLocation?: { latitude: number; longitude: number };
}

export default function GeofenceManager({
  zones,
  onAddZone,
  onUpdateZone,
  onDeleteZone,
  visible,
  onClose,
  currentLocation,
}: GeofenceManagerProps) {
  const { theme } = useTheme();
  const [editingZone, setEditingZone] = useState<GeofenceZone | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    latitude: currentLocation?.latitude || 37.7749,
    longitude: currentLocation?.longitude || -122.4194,
    radius: 200,
    type: 'custom' as 'safe' | 'alert' | 'custom',
  });

  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      latitude: currentLocation?.latitude || 37.7749,
      longitude: currentLocation?.longitude || -122.4194,
      radius: 200,
      type: 'custom',
    });
    setEditingZone(null);
    setShowAddForm(false);
  }, [currentLocation]);

  const handleSave = useCallback(() => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la zone');
      return;
    }

    if (editingZone) {
      onUpdateZone(editingZone.id, {
        name: formData.name,
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: formData.radius,
        type: formData.type,
      });
    } else {
      onAddZone({
        name: formData.name,
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: formData.radius,
        type: formData.type,
        active: true,
      });
    }

    resetForm();
  }, [formData, editingZone, onAddZone, onUpdateZone, resetForm]);

  const handleEdit = useCallback((zone: GeofenceZone) => {
    setFormData({
      name: zone.name,
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: zone.radius,
      type: zone.type,
    });
    setEditingZone(zone);
    setShowAddForm(true);
  }, []);

  const handleDelete = useCallback((zone: GeofenceZone) => {
    Alert.alert(
      'Supprimer la zone',
      `Êtes-vous sûr de vouloir supprimer "${zone.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDeleteZone(zone.id),
        },
      ]
    );
  }, [onDeleteZone]);

  const getZoneIcon = useCallback((type: string) => {
    switch (type) {
      case 'safe': return Shield;
      case 'alert': return AlertTriangle;
      default: return Target;
    }
  }, []);

  const getZoneColor = useCallback((type: string) => {
    switch (type) {
      case 'safe': return theme.success;
      case 'alert': return theme.error;
      default: return theme.primary;
    }
  }, [theme]);

  const ZoneCard = React.memo(({ zone }: { zone: GeofenceZone }) => {
    const Icon = getZoneIcon(zone.type);
    const color = getZoneColor(zone.type);

    return (
      <View style={[styles.zoneCard, { backgroundColor: theme.surface }]}>
        <View style={styles.zoneHeader}>
          <View style={[styles.zoneIcon, { backgroundColor: `${color}20` }]}>
            <Icon color={color} size={20} />
          </View>
          <View style={styles.zoneInfo}>
            <Text style={[styles.zoneName, { color: theme.text }]}>
              {zone.name}
            </Text>
            <Text style={[styles.zoneDetails, { color: theme.textSecondary }]}>
              Rayon: {zone.radius}m • {zone.type}
            </Text>
          </View>
          <View style={styles.zoneActions}>
            <TouchableOpacity
              style={[styles.zoneAction, { backgroundColor: `${theme.primary}20` }]}
              onPress={() => handleEdit(zone)}
            >
              <Text style={[styles.zoneActionText, { color: theme.primary }]}>
                Modifier
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.zoneAction, { backgroundColor: `${theme.error}20` }]}
              onPress={() => handleDelete(zone)}
            >
              <Trash2 color={theme.error} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color={theme.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            Géofences
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowAddForm(true)}
          >
            <Plus color={theme.surface} size={20} />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {zones.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}20` }]}>
                <Target color={theme.primary} size={48} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                Aucune géofence
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Créez des zones pour recevoir des alertes automatiques
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.zonesList} showsVerticalScrollIndicator={false}>
              {zones.map((zone) => (
                <ZoneCard key={zone.id} zone={zone} />
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Add/Edit Form Modal */}
        <Modal
          visible={showAddForm}
          transparent
          animationType="fade"
          onRequestClose={resetForm}
        >
          <View style={styles.formOverlay}>
            <View style={[styles.formContainer, { backgroundColor: theme.surface }]}>
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: theme.text }]}>
                  {editingZone ? 'Modifier la zone' : 'Nouvelle zone'}
                </Text>
                <TouchableOpacity onPress={resetForm}>
                  <X color={theme.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formContent}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Nom de la zone
                  </Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background, color: theme.text }]}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="Ex: Domicile, Bureau..."
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Latitude
                    </Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: theme.background, color: theme.text }]}
                      value={formData.latitude.toString()}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, latitude: parseFloat(text) || 0 }))}
                      keyboardType="numeric"
                      placeholder="37.7749"
                      placeholderTextColor={theme.textSecondary}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Longitude
                    </Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: theme.background, color: theme.text }]}
                      value={formData.longitude.toString()}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, longitude: parseFloat(text) || 0 }))}
                      keyboardType="numeric"
                      placeholder="-122.4194"
                      placeholderTextColor={theme.textSecondary}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Rayon (mètres)
                  </Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: theme.background, color: theme.text }]}
                    value={formData.radius.toString()}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, radius: parseInt(text) || 100 }))}
                    keyboardType="numeric"
                    placeholder="200"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.text }]}>
                    Type de zone
                  </Text>
                  <View style={styles.typeSelector}>
                    {[
                      { key: 'safe', label: 'Sécurisé', icon: Shield, color: theme.success },
                      { key: 'alert', label: 'Alerte', icon: AlertTriangle, color: theme.error },
                      { key: 'custom', label: 'Personnalisé', icon: Target, color: theme.primary },
                    ].map(({ key, label, icon: Icon, color }) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.typeOption,
                          { 
                            backgroundColor: formData.type === key ? `${color}20` : theme.background,
                            borderColor: formData.type === key ? color : theme.border,
                          }
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, type: key as any }))}
                      >
                        <Icon color={color} size={20} />
                        <Text style={[styles.typeLabel, { color: theme.text }]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton, { backgroundColor: theme.background }]}
                  onPress={resetForm}
                >
                  <Text style={[styles.formButtonText, { color: theme.textSecondary }]}>
                    Annuler
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton, { backgroundColor: theme.primary }]}
                  onPress={handleSave}
                >
                  <Save color={theme.surface} size={20} />
                  <Text style={[styles.formButtonText, { color: theme.surface }]}>
                    {editingZone ? 'Modifier' : 'Créer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  zonesList: {
    flex: 1,
  },
  zoneCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  zoneDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  zoneActions: {
    flexDirection: 'row',
    gap: 8,
  },
  zoneAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneActionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    borderRadius: 16,
    maxHeight: '80%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  formContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  formInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeSelector: {
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  formActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  formButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});