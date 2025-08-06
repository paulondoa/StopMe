import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Slider,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Bell, Users, Clock, Volume2, Vibrate } from 'lucide-react-native';

interface ProximitySettingsProps {
  visible: boolean;
  onClose: () => void;
  settings: {
    enabled: boolean;
    radius: number;
    cooldownPeriod: number;
    onlineOnly: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
  onUpdateSettings: (settings: any) => void;
}

export default function ProximitySettings({
  visible,
  onClose,
  settings,
  onUpdateSettings,
}: ProximitySettingsProps) {
  const { theme } = useTheme();

  const updateSetting = (key: string, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const SettingItem = ({ 
    icon, 
    title, 
    description, 
    value, 
    onToggle, 
    showSwitch = true,
    iconColor = theme.primary 
  }: any) => (
    <View style={[styles.settingItem, { backgroundColor: theme.surface }]}>
      <View style={styles.settingContent}>
        <View style={[styles.settingIcon, { backgroundColor: `${iconColor}20` }]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            {description}
          </Text>
        </View>
      </View>
      {showSwitch && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: `${iconColor}80` }}
          thumbColor={value ? iconColor : theme.textSecondary}
        />
      )}
    </View>
  );

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
            Alertes de Proximité
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <SettingItem
            icon={<Bell color={theme.primary} size={20} />}
            title="Alertes activées"
            description="Recevoir des notifications quand des amis sont proches"
            value={settings.enabled}
            onToggle={(value: boolean) => updateSetting('enabled', value)}
            iconColor={theme.primary}
          />

          <SettingItem
            icon={<Users color={theme.accent} size={20} />}
            title="Amis en ligne uniquement"
            description="Alertes seulement pour les amis connectés"
            value={settings.onlineOnly}
            onToggle={(value: boolean) => updateSetting('onlineOnly', value)}
            iconColor={theme.accent}
          />

          <SettingItem
            icon={<Volume2 color={theme.success} size={20} />}
            title="Son des notifications"
            description="Jouer un son lors des alertes"
            value={settings.soundEnabled}
            onToggle={(value: boolean) => updateSetting('soundEnabled', value)}
            iconColor={theme.success}
          />

          <SettingItem
            icon={<Vibrate color={theme.secondary} size={20} />}
            title="Vibration"
            description="Vibrer lors des alertes"
            value={settings.vibrationEnabled}
            onToggle={(value: boolean) => updateSetting('vibrationEnabled', value)}
            iconColor={theme.secondary}
          />

          <View style={[styles.sliderSection, { backgroundColor: theme.surface }]}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sliderTitle, { color: theme.text }]}>
                Rayon de détection
              </Text>
              <Text style={[styles.sliderValue, { color: theme.primary }]}>
                {settings.radius}m
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={100}
              maximumValue={2000}
              value={settings.radius}
              onValueChange={(value) => updateSetting('radius', Math.round(value))}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbStyle={{ backgroundColor: theme.primary }}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>100m</Text>
              <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>2km</Text>
            </View>
          </View>

          <View style={[styles.sliderSection, { backgroundColor: theme.surface }]}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sliderTitle, { color: theme.text }]}>
                Période de cooldown
              </Text>
              <Text style={[styles.sliderValue, { color: theme.primary }]}>
                {settings.cooldownPeriod} min
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={120}
              value={settings.cooldownPeriod}
              onValueChange={(value) => updateSetting('cooldownPeriod', Math.round(value))}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbStyle={{ backgroundColor: theme.primary }}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>5 min</Text>
              <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>2h</Text>
            </View>
          </View>
        </ScrollView>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sliderSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  sliderValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});