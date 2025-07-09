import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Users, Shield, Key, User, Mail } from 'lucide-react-native';
import { DEFAULT_ACCOUNT } from '@/lib/defaultAuth';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DemoAccess() {
  const router = useRouter();
  const { signIn } = useDemoAuth();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  const handleGetStarted = async () => {
    try {
      // Auto-sign in with demo credentials
      const { error } = await signIn(DEFAULT_ACCOUNT.email, DEFAULT_ACCOUNT.password);
      
      if (!error) {
        // Navigate to main app after successful sign in
        router.replace('/(tabs)');
      } else {
        console.error('Demo sign in error:', error);
        // If auto-sign in fails, go to sign in page
        router.push('/(auth)/signin');
      }
    } catch (err) {
      console.error('Demo access error:', err);
      router.push('/(auth)/signin');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDark ? ['#1F2937', '#374151'] : ['#3B82F6', '#8B5CF6']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <MapPin color={theme.surface} size={48} />
                <Text style={[styles.logo, { color: theme.surface }]}>SpotMe</Text>
              </View>
              <Text style={styles.tagline}>
                {t('demoAccountReady')}
              </Text>
              <Text style={styles.subtitle}>
                {t('defaultAccountCreated')}
              </Text>
            </View>

            {/* Account Credentials Card */}
            <View style={[styles.credentialsCard, { backgroundColor: theme.surface }]}>
              <View style={styles.cardHeader}>
                <Key color={theme.primary} size={24} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {t('accountAccess')}
                </Text>
              </View>
              
              <View style={styles.credentialItem}>
                <View style={[styles.credentialIcon, { backgroundColor: theme.background }]}>
                  <Mail color={theme.textSecondary} size={20} />
                </View>
                <View style={styles.credentialInfo}>
                  <Text style={[styles.credentialLabel, { color: theme.textSecondary }]}>
                    {t('email')}
                  </Text>
                  <Text style={[styles.credentialValue, { color: theme.text }]}>
                    {DEFAULT_ACCOUNT.email}
                  </Text>
                </View>
              </View>

              <View style={styles.credentialItem}>
                <View style={[styles.credentialIcon, { backgroundColor: theme.background }]}>
                  <Key color={theme.textSecondary} size={20} />
                </View>
                <View style={styles.credentialInfo}>
                  <Text style={[styles.credentialLabel, { color: theme.textSecondary }]}>
                    {t('password')}
                  </Text>
                  <Text style={[styles.credentialValue, { color: theme.text }]}>
                    {DEFAULT_ACCOUNT.password}
                  </Text>
                </View>
              </View>

              <View style={styles.credentialItem}>
                <View style={[styles.credentialIcon, { backgroundColor: theme.background }]}>
                  <User color={theme.textSecondary} size={20} />
                </View>
                <View style={styles.credentialInfo}>
                  <Text style={[styles.credentialLabel, { color: theme.textSecondary }]}>
                    {t('name')}
                  </Text>
                  <Text style={[styles.credentialValue, { color: theme.text }]}>
                    {DEFAULT_ACCOUNT.name}
                  </Text>
                </View>
              </View>
            </View>

            {/* Features Preview */}
            <View style={[styles.featuresCard, { backgroundColor: `${theme.primary}20` }]}>
              <Text style={[styles.featuresTitle, { color: theme.surface }]}>
                {t('whatsIncluded')}
              </Text>
              
              <View style={styles.feature}>
                <MapPin color={theme.surface} size={24} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.surface }]}>
                    {t('realTimeLocation')}
                  </Text>
                  <Text style={[styles.featureDescription, { color: `${theme.surface}CC` }]}>
                    {t('demoLocationDescription')}
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <Users color={theme.surface} size={24} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.surface }]}>
                    3 {t('friends')}
                  </Text>
                  <Text style={[styles.featureDescription, { color: `${theme.surface}CC` }]}>
                    {t('demoFriendsDescription')}
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <Shield color={theme.surface} size={24} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.surface }]}>
                    {t('privacyControl')}
                  </Text>
                  <Text style={[styles.featureDescription, { color: `${theme.surface}CC` }]}>
                    {t('privacyControlsDescription')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Demo Friends Preview */}
            <View style={[styles.friendsPreview, { backgroundColor: theme.surface }]}>
              <Text style={[styles.previewTitle, { color: theme.text }]}>
                {t('yourDemoFriends')}
              </Text>
              
              <View style={styles.friendItem}>
                <View style={[styles.friendAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.friendAvatarText, { color: theme.surface }]}>S</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, { color: theme.text }]}>Sarah Johnson</Text>
                  <Text style={[styles.friendStatus, { color: theme.textSecondary }]}>
                    {t('online')} • 5 min ago
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
              </View>

              <View style={styles.friendItem}>
                <View style={[styles.friendAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.friendAvatarText, { color: theme.surface }]}>M</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, { color: theme.text }]}>Mike Chen</Text>
                  <Text style={[styles.friendStatus, { color: theme.textSecondary }]}>
                    {t('ghostMode')} • 15 min ago
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: theme.secondary }]} />
              </View>

              <View style={styles.friendItem}>
                <View style={[styles.friendAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.friendAvatarText, { color: theme.surface }]}>E</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, { color: theme.text }]}>Emma Wilson</Text>
                  <Text style={[styles.friendStatus, { color: theme.textSecondary }]}>
                    {t('offline')} • 2 hours ago
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: theme.textSecondary }]} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.getStartedButton, { backgroundColor: theme.surface }]}
              onPress={handleGetStarted}
            >
              <Text style={[styles.getStartedButtonText, { color: theme.primary }]}>
                {t('accessDemoAccount')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.manualSignInButton, { 
                backgroundColor: `${theme.surface}33`,
                borderColor: `${theme.surface}4D`
              }]}
              onPress={() => router.push('/(auth)/signin')}
            >
              <Text style={[styles.manualSignInButtonText, { color: theme.surface }]}>
                {t('manualSignIn')}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: `${theme.surface}CC` }]}>
                {t('useCredentialsAbove')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginTop: 8,
  },
  tagline: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  credentialsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  credentialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  credentialInfo: {
    flex: 1,
  },
  credentialLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  credentialValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  featuresCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  friendsPreview: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  getStartedButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  manualSignInButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  manualSignInButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});