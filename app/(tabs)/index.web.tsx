import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { useDemoLocation } from '@/contexts/DemoLocationContext';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Eye, EyeOff, RefreshCw, Navigation, MapPin, Users, Target, Compass } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function MapScreen() {
  const { user, friends } = useDemoAuth();
  const { location, hasPermission, requestPermission, startTracking, stopTracking, isTracking } = useDemoLocation();
  const { theme, isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    initializeLocation();
    startAnimations();
  }, []);

  const startAnimations = () => {
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
  };

  const initializeLocation = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission de localisation requise',
          'Veuillez activer les permissions de localisation pour utiliser SpotMe',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    if (!isTracking) {
      await startTracking();
    }
  };

  const toggleVisibility = async () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

    if (newVisibility && !isTracking) {
      await startTracking();
    } else if (!newVisibility && isTracking) {
      stopTracking();
    }
  };

  const refreshLocations = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return theme.success;
      case 'offline':
        return theme.textSecondary;
      case 'ghost':
        return theme.secondary;
      default:
        return theme.primary;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? [theme.background, 'transparent'] : [`${theme.primary}10`, 'transparent']}
        style={styles.headerGradient}
      >
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>
            Vue Carte 🗺️
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            La carte interactive est disponible sur les appareils mobiles
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Web Map Placeholder */}
      <Animated.View 
        style={[
          styles.mapPlaceholder,
          { 
            backgroundColor: theme.surface,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <LinearGradient
          colors={[`${theme.primary}10`, `${theme.secondary}10`]}
          style={styles.placeholderGradient}
        >
          <View style={[styles.placeholderIcon, { backgroundColor: `${theme.primary}20` }]}>
            <MapPin color={theme.primary} size={64} />
          </View>
          <Text style={[styles.placeholderTitle, { color: theme.text }]}>
            Carte Interactive
          </Text>
          <Text style={[styles.placeholderSubtitle, { color: theme.textSecondary }]}>
            Fonctionnalités complètes disponibles sur mobile
          </Text>
        </LinearGradient>
        
        {/* Current Location Info */}
        {location && (
          <View style={[styles.locationInfo, { backgroundColor: theme.background }]}>
            <View style={styles.locationHeader}>
              <Target color={theme.primary} size={20} />
              <Text style={[styles.locationTitle, { color: theme.text }]}>
                Votre Position
              </Text>
            </View>
            <Text style={[styles.locationText, { color: theme.textSecondary }]}>
              Lat: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={[styles.locationText, { color: theme.textSecondary }]}>
              Lng: {location.coords.longitude.toFixed(6)}
            </Text>
            <Text style={[styles.locationAccuracy, { color: theme.success }]}>
              Précision: ±{location.coords.accuracy?.toFixed(0) || 10}m
            </Text>
          </View>
        )}

        {/* Friends List */}
        {friends.length > 0 && (
          <View style={[styles.friendsList, { backgroundColor: theme.background }]}>
            <View style={styles.friendsHeader}>
              <Users color={theme.primary} size={20} />
              <Text style={[styles.friendsTitle, { color: theme.text }]}>
                Amis Proches ({friends.length})
              </Text>
            </View>
            
            <ScrollView style={styles.friendsScroll} showsVerticalScrollIndicator={false}>
              {friends.map((friend) => {
                const distance = location ? calculateDistance(
                  location.coords.latitude,
                  location.coords.longitude,
                  friend.latitude,
                  friend.longitude
                ) : 0;

                return (
                  <View key={friend.id} style={[styles.friendItem, { backgroundColor: theme.surface }]}>
                    <View style={styles.friendInfo}>
                      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.avatarText, { color: theme.surface }]}>
                          {friend.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.friendDetails}>
                        <Text style={[styles.friendName, { color: theme.text }]}>
                          {friend.name}
                        </Text>
                        <Text style={[styles.friendLocation, { color: theme.textSecondary }]}>
                          {distance.toFixed(1)} km de distance
                        </Text>
                        <Text style={[styles.friendTime, { color: theme.textSecondary }]}>
                          Vu: {new Date(friend.last_seen).toLocaleTimeString()}
                        </Text>
                      </View>
                      <View 
                        style={[
                          styles.statusIndicator, 
                          { backgroundColor: getStatusColor(friend.status) }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Animated.View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: isVisible ? theme.success : theme.secondary }]}
          onPress={toggleVisibility}
        >
          {isVisible ? (
            <Eye color="white" size={24} />
          ) : (
            <EyeOff color="white" size={24} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={refreshLocations}
          disabled={loading}
        >
          <RefreshCw color="white" size={24} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent }]}
          onPress={() => {
            if (location) {
              Alert.alert(
                'Position Actuelle',
                `Lat: ${location.coords.latitude.toFixed(6)}\nLng: ${location.coords.longitude.toFixed(6)}`
              );
            }
          }}
        >
          <Compass color="white" size={24} />
        </TouchableOpacity>
      </View>

      {/* Status Bar */}
      <Animated.View 
        style={[
          styles.statusBar,
          { 
            backgroundColor: `${theme.surface}F5`,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={styles.statusContent}>
          <View style={styles.statusItem}>
            <View 
              style={[
                styles.statusDot, 
                { backgroundColor: isVisible ? theme.success : theme.textSecondary }
              ]} 
            />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {isVisible ? 'Visible' : 'Masqué'}
            </Text>
          </View>
          
          <View style={styles.statusDivider} />
          
          <View style={styles.statusItem}>
            <MapPin color={theme.primary} size={16} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {friends.length} ami{friends.length !== 1 ? 's' : ''} connecté{friends.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  mapPlaceholder: {
    flex: 1,
    margin: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  placeholderGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 32,
  },
  locationInfo: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  friendsList: {
    borderRadius: 12,
    margin: 16,
    maxHeight: 300,
  },
  friendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    paddingBottom: 12,
  },
  friendsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  friendsScroll: {
    maxHeight: 200,
  },
  friendItem: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  friendLocation: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  friendTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 120,
    gap: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusBar: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  statusDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
});