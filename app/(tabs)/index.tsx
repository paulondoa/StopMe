import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDemoLocation } from '@/contexts/DemoLocationContext';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff, RefreshCw, Navigation, MapPin, Users, Zap, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { user, friends } = useDemoAuth();
  const { location, hasPermission, requestPermission, startTracking, stopTracking, isTracking } = useDemoLocation();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  
  const [isVisible, setIsVisible] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(-50);
  const pulseAnim = new Animated.Value(1);
  const fabScale = new Animated.Value(0);

  useEffect(() => {
    initializeLocation();
    
    // Animate in components
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(100, [
        Animated.spring(fabScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse animation for status indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [location]);

  const initializeLocation = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to use SpotMe',
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

    // Animate button press
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (newVisibility && !isTracking) {
      await startTracking();
    } else if (!newVisibility && isTracking) {
      stopTracking();
    }
  };

  const refreshLocations = () => {
    // Animate refresh button
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    console.log('Refreshing friend locations...');
  };

  const centerOnCurrentLocation = () => {
    if (location) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const getMarkerColor = (status: string) => {
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

  const QuickStats = () => (
    <Animated.View 
      style={[
        styles.quickStats,
        { 
          backgroundColor: `${theme.surface}F0`,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: `${theme.success}20` }]}>
          <Users color={theme.success} size={16} />
        </View>
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {friends.filter(f => f.status === 'online').length}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          En ligne
        </Text>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: `${theme.primary}20` }]}>
          <MapPin color={theme.primary} size={16} />
        </View>
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {location ? '1.2km' : '---'}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          Rayon
        </Text>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: `${theme.accent}20` }]}>
          <Zap color={theme.accent} size={16} />
        </View>
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {isTracking ? 'Actif' : 'Inactif'}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          Suivi
        </Text>
      </View>
    </Animated.View>
  );

  const FloatingActionButton = ({ 
    icon, 
    onPress, 
    backgroundColor, 
    style = {},
    delay = 0 
  }: any) => {
    const [buttonScale] = useState(new Animated.Value(0));

    useEffect(() => {
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.fab,
          { 
            backgroundColor,
            transform: [{ scale: buttonScale }],
          },
          style,
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={onPress}
          activeOpacity={0.8}
        >
          {icon}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with gradient */}
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
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.greeting, { color: theme.text }]}>
                Bonjour, {user?.name?.split(' ')[0] || 'Utilisateur'} 👋
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Découvrez vos amis à proximité
              </Text>
            </View>
            
            <Animated.View 
              style={[
                styles.profileButton,
                { 
                  backgroundColor: theme.primary,
                  transform: [{ scale: pulseAnim }],
                }
              ]}
            >
              <Text style={[styles.profileInitial, { color: theme.surface }]}>
                {user?.name?.charAt(0) || 'U'}
              </Text>
            </Animated.View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Quick Stats */}
      <QuickStats />

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={false}
          customMapStyle={isDark ? darkMapStyle : []}
        >
          {/* Current user location */}
          {location && isVisible && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Vous"
              pinColor={theme.primary}
            />
          )}

          {/* Friend locations */}
          {friends.map((friend) => (
            <Marker
              key={friend.id}
              coordinate={{
                latitude: friend.latitude,
                longitude: friend.longitude,
              }}
              title={friend.name}
              description={`Vu: ${new Date(friend.last_seen).toLocaleTimeString()}`}
              pinColor={getMarkerColor(friend.status)}
            />
          ))}
        </MapView>

        {/* Map Overlay */}
        <LinearGradient
          colors={['transparent', `${theme.background}40`]}
          style={styles.mapOverlay}
          pointerEvents="none"
        />
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FloatingActionButton
          icon={isVisible ? <Eye color="white" size={24} /> : <EyeOff color="white" size={24} />}
          onPress={toggleVisibility}
          backgroundColor={isVisible ? theme.success : theme.secondary}
          delay={0}
        />

        <FloatingActionButton
          icon={<RefreshCw color="white" size={24} />}
          onPress={refreshLocations}
          backgroundColor={theme.accent}
          delay={100}
        />

        <FloatingActionButton
          icon={<Navigation color="white" size={24} />}
          onPress={centerOnCurrentLocation}
          backgroundColor={theme.primary}
          delay={200}
        />
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
            <Animated.View 
              style={[
                styles.statusDot, 
                { 
                  backgroundColor: isVisible ? theme.success : theme.textSecondary,
                  transform: [{ scale: isVisible ? pulseAnim : 1 }],
                }
              ]} 
            />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {isVisible ? 'Visible' : 'Masqué'}
            </Text>
          </View>
          
          <View style={styles.statusDivider} />
          
          <View style={styles.statusItem}>
            <Shield color={theme.primary} size={16} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {friends.length} {friends.length === 1 ? 'ami' : 'amis'} à proximité
            </Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#746855" }]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  profileInitial: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 100,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 140,
    gap: 16,
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 5,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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