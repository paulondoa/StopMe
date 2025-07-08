import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Users, Shield, Key, User, Mail } from 'lucide-react-native';
import { DEFAULT_ACCOUNT } from '@/lib/defaultAuth';

export default function DemoAccess() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(auth)/signin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <MapPin color="white" size={48} />
                <Text style={styles.logo}>SpotMe</Text>
              </View>
              <Text style={styles.tagline}>
                Demo Account Ready
              </Text>
              <Text style={styles.subtitle}>
                Your default account has been created and is ready to use
              </Text>
            </View>

            {/* Account Credentials Card */}
            <View style={styles.credentialsCard}>
              <View style={styles.cardHeader}>
                <Key color="#3B82F6" size={24} />
                <Text style={styles.cardTitle}>Account Access</Text>
              </View>
              
              <View style={styles.credentialItem}>
                <View style={styles.credentialIcon}>
                  <Mail color="#6B7280" size={20} />
                </View>
                <View style={styles.credentialInfo}>
                  <Text style={styles.credentialLabel}>Email</Text>
                  <Text style={styles.credentialValue}>{DEFAULT_ACCOUNT.email}</Text>
                </View>
              </View>

              <View style={styles.credentialItem}>
                <View style={styles.credentialIcon}>
                  <Key color="#6B7280" size={20} />
                </View>
                <View style={styles.credentialInfo}>
                  <Text style={styles.credentialLabel}>Password</Text>
                  <Text style={styles.credentialValue}>{DEFAULT_ACCOUNT.password}</Text>
                </View>
              </View>

              <View style={styles.credentialItem}>
                <View style={styles.credentialIcon}>
                  <User color="#6B7280" size={20} />
                </View>
                <View style={styles.credentialInfo}>
                  <Text style={styles.credentialLabel}>Name</Text>
                  <Text style={styles.credentialValue}>{DEFAULT_ACCOUNT.name}</Text>
                </View>
              </View>
            </View>

            {/* Features Preview */}
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>What's Included</Text>
              
              <View style={styles.feature}>
                <MapPin color="white" size={24} />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Real-time Location</Text>
                  <Text style={styles.featureDescription}>
                    Demo location in San Francisco with simulated updates
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <Users color="white" size={24} />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>3 Demo Friends</Text>
                  <Text style={styles.featureDescription}>
                    Pre-configured friends with different online statuses
                  </Text>
                </View>
              </View>

              <View style={styles.feature}>
                <Shield color="white" size={24} />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>Privacy Controls</Text>
                  <Text style={styles.featureDescription}>
                    Toggle visibility and ghost mode functionality
                  </Text>
                </View>
              </View>
            </View>

            {/* Demo Friends Preview */}
            <View style={styles.friendsPreview}>
              <Text style={styles.previewTitle}>Your Demo Friends</Text>
              
              <View style={styles.friendItem}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>S</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>Sarah Johnson</Text>
                  <Text style={styles.friendStatus}>Online • 5 min ago</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              </View>

              <View style={styles.friendItem}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>M</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>Mike Chen</Text>
                  <Text style={styles.friendStatus}>Ghost Mode • 15 min ago</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: '#8B5CF6' }]} />
              </View>

              <View style={styles.friendItem}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>E</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>Emma Wilson</Text>
                  <Text style={styles.friendStatus}>Offline • 2 hours ago</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: '#9CA3AF' }]} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
            >
              <Text style={styles.getStartedButtonText}>Access Demo Account</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Use the credentials above to sign in and explore all features
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
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
    color: '#111827',
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  credentialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  credentialInfo: {
    flex: 1,
  },
  credentialLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 2,
  },
  credentialValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  featuresCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: 'white',
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
    color: 'white',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  friendsPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
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
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  getStartedButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
});