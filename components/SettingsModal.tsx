import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, Globe, Palette, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { currentLanguage, setLanguage, supportedLanguages, t } = useLanguage();
  const [activeSection, setActiveSection] = useState<'main' | 'language' | 'theme'>('main');

  const themeOptions = [
    { key: 'light', label: t('lightMode'), icon: '☀️' },
    { key: 'dark', label: t('darkMode'), icon: '🌙' },
    { key: 'system', label: t('systemMode'), icon: '⚙️' },
  ];

  const renderMainSettings = () => (
    <View style={styles.content}>
      <TouchableOpacity
        style={[styles.settingItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setActiveSection('language')}
      >
        <View style={[styles.settingIcon, { backgroundColor: theme.primary + '20' }]}>
          <Globe color={theme.primary} size={20} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            {t('language')}
          </Text>
          <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
            {supportedLanguages.find(lang => lang.code === currentLanguage)?.nativeName}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.settingItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setActiveSection('theme')}
      >
        <View style={[styles.settingIcon, { backgroundColor: theme.secondary + '20' }]}>
          <Palette color={theme.secondary} size={20} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            {t('theme')}
          </Text>
          <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
            {themeOptions.find(option => option.key === themeMode)?.label}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderLanguageSettings = () => (
    <View style={styles.content}>
      {supportedLanguages.map((language) => (
        <TouchableOpacity
          key={language.code}
          style={[styles.optionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => {
            setLanguage(language.code);
            setActiveSection('main');
          }}
        >
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: theme.text }]}>
              {language.nativeName}
            </Text>
            <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
              {language.name}
            </Text>
          </View>
          {currentLanguage === language.code && (
            <Check color={theme.primary} size={20} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderThemeSettings = () => (
    <View style={styles.content}>
      {themeOptions.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[styles.optionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => {
            setThemeMode(option.key as any);
            setActiveSection('main');
          }}
        >
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: theme.text }]}>
              {option.icon} {option.label}
            </Text>
          </View>
          {themeMode === option.key && (
            <Check color={theme.primary} size={20} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const getTitle = () => {
    switch (activeSection) {
      case 'language':
        return t('selectLanguage');
      case 'theme':
        return t('selectTheme');
      default:
        return t('settings');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (activeSection === 'main') {
                onClose();
              } else {
                setActiveSection('main');
              }
            }}
          >
            <X color={theme.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            {getTitle()}
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeSection === 'main' && renderMainSettings()}
          {activeSection === 'language' && renderLanguageSettings()}
          {activeSection === 'theme' && renderThemeSettings()}
        </ScrollView>
      </SafeAreaView>
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
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});