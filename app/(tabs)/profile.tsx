import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useDemoLocation } from '@/contexts/DemoLocationContext';
import { LogOut, MapPin, Eye, EyeOff, Shield, Settings as SettingsIcon } from 'lucide-react-native';
import SettingsModal from '@/components/SettingsModal';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, signOut } = useDemoAuth();
  const { isTracking, startTracking, stopTracking } = useDemoLocation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setLoading(false);
    }
  }, [user]);

  const updateProfile = async (updates: any) => {
    setProfile({ ...profile, ...updates });
  };

  const toggleVisibility = async (value: boolean) => {
    await updateProfile({ 
      visible: value,
      status: value ? 'online' : 'ghost'
    });

    if (value && !isTracking) {
      await startTracking();
    } else if (!value && isTracking) {
      stopTracking();
    }
  };

  const toggleLocationTracking = async (value: boolean) => {
    if (value) {
      await startTracking();
    } else {
      stopTracking();
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('signOut'),
      t('signOutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: async () => {
            stopTracking();
            await signOut();
          },
        },
      ]
    );
  };

  const getStatusText = () => {
    if (!profile) return t('loading');
    
    switch (profile.status) {
      case 'online':
        return t('onlineStatus');
      case 'ghost':
        return t('ghostModeStatus');
      case 'offline':
        return t('offlineStatus');
      default:
        return t('offlineStatus');
    }
  };

  const getStatusColor = () => {
    if (!profile) return '#9CA3AF';
    
    switch (profile.status) {
      case 'online':
        return '#10B981';
      case 'ghost':
        return '#8B5CF6';
      case 'offline':
        return '#9CA3AF';
      default:
        return '#3B82F6';
    }
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: theme.text }}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.text }]}>{t('profile')}</Text>
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: theme.surface }]}
              onPress={() => setShowSettings(true)}
            >
              <SettingsIcon color={theme.text} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View 
              style={[
                styles.statusIndicator, 
                { backgroundColor: getStatusColor() }
              ]} 
            />
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{profile.name}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{profile.email}</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Settings */}
        <View style={[styles.settingsSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('privacyLocation')}</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: theme.background }]}>
                <Eye color={theme.primary} size={20} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>{t('visibleToFriends')}</Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {t('allowFriendsLocation')}
                </Text>
              </View>
            </View>
            <Switch
              value={profile.visible}
              onValueChange={toggleVisibility}
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={profile.visible ? theme.primary : theme.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: theme.background }]}>
                <MapPin color={theme.accent} size={20} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>{t('locationTracking')}</Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {t('shareRealTimeLocation')}
                </Text>
              </View>
            </View>
            <Switch
              value={isTracking}
              onValueChange={toggleLocationTracking}
              trackColor={{ false: theme.border, true: theme.accent + '80' }}
              thumbColor={isTracking ? theme.accent : theme.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: theme.background }]}>
                <Shield color={theme.secondary} size={20} />
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>{t('ghostModeTitle')}</Text>
                <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  {profile.status === 'ghost' ? t('ghostModeActive') : t('ghostModeDescription')}
                </Text>
              </View>
            </View>
            <Switch
              value={profile.status === 'ghost'}
              onValueChange={(value) => toggleVisibility(!value)}
              trackColor={{ false: theme.border, true: theme.secondary + '80' }}
              thumbColor={profile.status === 'ghost' ? theme.secondary : theme.textSecondary}
            />
          </View>
        </View>

        {/* Account */}
        <View style={[styles.settingsSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('account')}</Text>

          <TouchableOpacity style={[styles.dangerButton, { backgroundColor: theme.error + '20', borderColor: theme.error + '40' }]} onPress={handleSignOut}>
            <LogOut color={theme.error} size={20} />
            <Text style={[styles.dangerButtonText, { color: theme.error }]}>{t('signOut')}</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>{t('appVersion')}</Text>
          <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
            {t('appDescription')}
          </Text>
        </View>
      </ScrollView>
      
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  settingsButton: {
    padding: 12,
    borderRadius: 12,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  name: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  settingsSection: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  appInfo: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  appInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});