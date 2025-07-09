import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Users, Shield } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Welcome() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1F2937', '#374151'] : ['#3B82F6', '#8B5CF6']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MapPin color={theme.surface} size={48} />
              <Text style={[styles.logo, { color: theme.surface }]}>SpotMe</Text>
            </View>
            <Text style={styles.tagline}>
              {t('stayConnected')}
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <MapPin color={theme.surface} size={24} />
              <Text style={[styles.featureText, { color: theme.surface }]}>
                {t('realTimeLocation')}
              </Text>
            </View>
            <View style={styles.feature}>
              <Users color={theme.surface} size={24} />
              <Text style={[styles.featureText, { color: theme.surface }]}>
                {t('findFriends')}
              </Text>
            </View>
            <View style={styles.feature}>
              <Shield color={theme.surface} size={24} />
              <Text style={[styles.featureText, { color: theme.surface }]}>
                {t('privacyControl')}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <View style={[styles.demoInfo, { backgroundColor: `${theme.surface}20` }]}>
              <Text style={[styles.demoTitle, { color: theme.surface }]}>
                {t('demoAccountAvailable')}
              </Text>
              <Text style={[styles.demoCredentials, { color: `${theme.surface}E6` }]}>
                {t('demoCredentials')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.surface }]}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={[styles.primaryButtonText, { color: theme.primary }]}>
                {t('getStarted')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: `${theme.surface}4D` }]}
              onPress={() => router.push('/(auth)/signin')}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.surface }]}>
                {t('signIn')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
  },
  tagline: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  features: {
    gap: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  actions: {
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  demoInfo: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  demoTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  demoCredentials: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
});