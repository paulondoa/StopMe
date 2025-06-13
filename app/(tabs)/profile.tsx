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
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/lib/supabase';
import { LogOut, MapPin, Eye, EyeOff, Shield, Bell } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { isTracking, startTracking, stopTracking } = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const updateProfile = async (updates: any) => {
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } else {
      setProfile({ ...profile, ...updates });
    }
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
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
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
    if (!profile) return 'Loading...';
    
    switch (profile.status) {
      case 'online':
        return 'Online';
      case 'ghost':
        return 'Ghost Mode';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
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
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
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
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Privacy & Location</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIcon}>
                <Eye color="#3B82F6" size={20} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Visible to Friends</Text>
                <Text style={styles.settingDescription}>
                  Allow friends to see your location
                </Text>
              </View>
            </View>
            <Switch
              value={profile.visible}
              onValueChange={toggleVisibility}
              trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
              thumbColor={profile.visible ? '#3B82F6' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIcon}>
                <MapPin color="#10B981" size={20} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Location Tracking</Text>
                <Text style={styles.settingDescription}>
                  Share your real-time location
                </Text>
              </View>
            </View>
            <Switch
              value={isTracking}
              onValueChange={toggleLocationTracking}
              trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
              thumbColor={isTracking ? '#10B981' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={styles.settingIcon}>
                <Shield color="#8B5CF6" size={20} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Ghost Mode</Text>
                <Text style={styles.settingDescription}>
                  {profile.status === 'ghost' ? 'You are invisible to friends' : 'Become invisible to all friends'}
                </Text>
              </View>
            </View>
            <Switch
              value={profile.status === 'ghost'}
              onValueChange={(value) => toggleVisibility(!value)}
              trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
              thumbColor={profile.status === 'ghost' ? '#8B5CF6' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
            <LogOut color="#EF4444" size={20} />
            <Text style={styles.dangerButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>SpotMe v1.0.0</Text>
          <Text style={styles.appInfoText}>
            Stay connected with friends in real-time
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
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
    backgroundColor: '#3B82F6',
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
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  settingsSection: {
    backgroundColor: 'white',
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
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  appInfo: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  appInfoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});