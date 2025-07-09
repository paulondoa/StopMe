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
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useDemoLocation } from '@/contexts/DemoLocationContext';
import { 
  LogOut, 
  MapPin, 
  Eye, 
  EyeOff, 
  Shield, 
  Settings as SettingsIcon,
  User,
  Bell,
  Globe,
  Palette,
  ChevronRight,
  Edit3
} from 'lucide-react-native';
import SettingsModal from '@/components/SettingsModal';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  const { user, signOut } = useDemoAuth();
  const { isTracking, startTracking, stopTracking } = useDemoLocation();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setLoading(false);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
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
    if (!profile) return theme.textSecondary;
    
    switch (profile.status) {
      case 'online':
        return theme.success;
      case 'ghost':
        return theme.secondary;
      case 'offline':
        return theme.textSecondary;
      default:
        return theme.primary;
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

  const SettingItem = ({ 
    icon, 
    title, 
    description, 
    value, 
    onToggle, 
    showSwitch = true,
    onPress,
    iconColor = theme.primary 
  }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: theme.surface }]}
      onPress={onPress}
      disabled={!onPress && !onToggle}
    >
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
      {showSwitch ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: `${iconColor}80` }}
          thumbColor={value ? iconColor : theme.textSecondary}
        />
      ) : (
        <ChevronRight color={theme.textSecondary} size={20} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{t('profile')}</Text>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.surface }]}
            onPress={() => setShowSettings(true)}
          >
            <SettingsIcon color={theme.text} size={20} />
          </TouchableOpacity>
        </View>

        <Animated.View 
          style={[
            styles.animatedContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
            <LinearGradient
              colors={isDark ? [theme.primary, theme.secondary] : [`${theme.primary}20`, `${theme.secondary}20`]}
              style={styles.profileGradient}
            >
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.avatarText, { color: theme.surface }]}>
                      {profile.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View 
                    style={[
                      styles.statusIndicator, 
                      { backgroundColor: getStatusColor() }
                    ]} 
                  />
                  <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.surface }]}>
                    <Edit3 color={theme.primary} size={16} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={[styles.name, { color: isDark ? theme.surface : theme.text }]}>
                    {profile.name}
                  </Text>
                  <Text style={[styles.email, { color: isDark ? `${theme.surface}CC` : theme.textSecondary }]}>
                    {profile.email}
                  </Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                    <Text style={[styles.status, { color: isDark ? theme.surface : getStatusColor() }]}>
                      {getStatusText()}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Privacy & Location Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('privacyLocation')}
            </Text>
            
            <View style={styles.settingsGroup}>
              <SettingItem
                icon={<Eye color={theme.primary} size={20} />}
                title={t('visibleToFriends')}
                description={t('allowFriendsLocation')}
                value={profile.visible}
                onToggle={toggleVisibility}
                iconColor={theme.primary}
              />

              <SettingItem
                icon={<MapPin color={theme.accent} size={20} />}
                title={t('locationTracking')}
                description={t('shareRealTimeLocation')}
                value={isTracking}
                onToggle={toggleLocationTracking}
                iconColor={theme.accent}
              />

              <SettingItem
                icon={<Shield color={theme.secondary} size={20} />}
                title={t('ghostModeTitle')}
                description={profile.status === 'ghost' ? t('ghostModeActive') : t('ghostModeDescription')}
                value={profile.status === 'ghost'}
                onToggle={(value: boolean) => toggleVisibility(!value)}
                iconColor={theme.secondary}
              />
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('settings')}
            </Text>
            
            <View style={styles.settingsGroup}>
              <SettingItem
                icon={<Bell color={theme.warning} size={20} />}
                title="Notifications"
                description="Gérer les notifications push"
                showSwitch={false}
                onPress={() => {}}
                iconColor={theme.warning}
              />

              <SettingItem
                icon={<Globe color={theme.primary} size={20} />}
                title={t('language')}
                description="Français"
                showSwitch={false}
                onPress={() => setShowSettings(true)}
                iconColor={theme.primary}
              />

              <SettingItem
                icon={<Palette color={theme.secondary} size={20} />}
                title={t('theme')}
                description={isDark ? t('darkMode') : t('lightMode')}
                showSwitch={false}
                onPress={() => setShowSettings(true)}
                iconColor={theme.secondary}
              />
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('account')}
            </Text>
            
            <TouchableOpacity 
              style={[styles.dangerButton, { 
                backgroundColor: `${theme.error}20`, 
                borderColor: `${theme.error}40` 
              }]} 
              onPress={handleSignOut}
            >
              <LogOut color={theme.error} size={20} />
              <Text style={[styles.dangerButtonText, { color: theme.error }]}>
                {t('signOut')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
              {t('appVersion')}
            </Text>
            <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>
              {t('appDescription')}
            </Text>
          </View>
        </Animated.View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  animatedContent: {
    paddingHorizontal: 24,
  },
  profileCard: {
    borderRadius: 20,
    marginBottom: 32,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  profileGradient: {
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'white',
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
    marginLeft: 4,
  },
  settingsGroup: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
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
    gap: 16,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    lineHeight: 20,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  appInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});