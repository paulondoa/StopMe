import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
  Modal,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDemoLocation } from '@/contexts/DemoLocationContext';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Eye, 
  EyeOff, 
  Navigation, 
  MapPin, 
  Users, 
  Target, 
  Settings, 
  Compass, 
  Filter,
  Route,
  Bell,
  Star,
  Clock,
  Zap,
  Shield,
  Plus,
  Minus,
  RefreshCw,
  X
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapClusters from '@/components/MapClusters';
import { useGeofencing } from '@/hooks/useGeofencing';
import { useProximityAlerts } from '@/hooks/useProximityAlerts';

const { width, height } = Dimensions.get('window');

interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: 'safe' | 'alert' | 'custom';
  active: boolean;
}

interface POI {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'restaurant' | 'cafe' | 'park' | 'shop' | 'custom';
  rating: number;
  description: string;
}

interface MapSettings {
  showGeofences: boolean;
  showPOIs: boolean;
  showClusters: boolean;
  showTraffic: boolean;
  showBuildings: boolean;
  mapType: 'standard' | 'satellite' | 'hybrid';
  followUser: boolean;
  autoZoom: boolean;
}

export default function MapScreen() {
  const { user, friends } = useDemoAuth();
  const { location, hasPermission, requestPermission, startTracking, stopTracking, isTracking } = useDemoLocation();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  
  // Core state
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  
  // Map state
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  // Settings state
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    showGeofences: true,
    showPOIs: true,
    showClusters: true,
    showTraffic: false,
    showBuildings: true,
    mapType: 'standard',
    followUser: false,
    autoZoom: true,
  });
  
  // UI state
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [routeToFriend, setRouteToFriend] = useState<any>(null);
  const [showMapControls, setShowMapControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Data state
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>([]);
  const [pois, setPOIs] = useState<POI[]>([]);
  
  // Refs
  const mapRef = useRef<MapView>(null);
  const animationRef = useRef<any>(null);
  
  // Animations - Optimized with single values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fabScale = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(0)).current;
  
  // Custom hooks
  const { 
    events: geofenceEvents, 
    activeZones, 
    getZoneStatus 
  } = useGeofencing(geofenceZones);
  
  const { 
    alerts: proximityAlerts, 
    settings: alertSettings,
    unacknowledgedCount 
  } = useProximityAlerts();

  // Memoized calculations for performance
  const onlineFriends = useMemo(() => 
    friends.filter(f => f.status === 'online'), 
    [friends]
  );
  
  const activeGeofences = useMemo(() => 
    geofenceZones.filter(z => z.active), 
    [geofenceZones]
  );
  
  const nearbyFriends = useMemo(() => {
    if (!location) return [];
    return friends.filter(friend => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        friend.latitude,
        friend.longitude
      );
      return distance <= 1; // Within 1km
    });
  }, [location, friends]);

  // Optimized distance calculation
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Initialization
  useEffect(() => {
    initializeApp();
    return () => {
      // Cleanup animations
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  const initializeApp = async () => {
    setLoading(true);
    try {
      await Promise.all([
        initializeLocation(),
        initializeGeofences(),
        initializePOIs(),
        startAnimations()
      ]);
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Erreur', 'Erreur lors de l\'initialisation de l\'application');
    } finally {
      setLoading(false);
    }
  };

  const initializeLocation = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission requise',
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

  const initializeGeofences = async () => {
    // Simulate loading from storage/API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const demoGeofences: GeofenceZone[] = [
      {
        id: 'home',
        name: 'Domicile',
        latitude: 37.7849,
        longitude: -122.4094,
        radius: 200,
        type: 'safe',
        active: true,
      },
      {
        id: 'work',
        name: 'Bureau',
        latitude: 37.7849,
        longitude: -122.4194,
        radius: 150,
        type: 'custom',
        active: true,
      },
      {
        id: 'school',
        name: 'École',
        latitude: 37.7749,
        longitude: -122.4194,
        radius: 100,
        type: 'alert',
        active: true,
      },
    ];
    setGeofenceZones(demoGeofences);
  };

  const initializePOIs = async () => {
    // Simulate loading from API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const demoPOIs: POI[] = [
      {
        id: 'cafe1',
        name: 'Blue Bottle Coffee',
        latitude: 37.7849,
        longitude: -122.4124,
        type: 'cafe',
        rating: 4.5,
        description: 'Excellent café artisanal',
      },
      {
        id: 'restaurant1',
        name: 'Tartine Bakery',
        latitude: 37.7819,
        longitude: -122.4164,
        type: 'restaurant',
        rating: 4.8,
        description: 'Boulangerie française authentique',
      },
      {
        id: 'park1',
        name: 'Dolores Park',
        latitude: 37.7596,
        longitude: -122.4269,
        type: 'park',
        rating: 4.6,
        description: 'Parc urbain avec vue panoramique',
      },
    ];
    setPOIs(demoPOIs);
  };

  const startAnimations = async () => {
    // Optimized animation sequence
    animationRef.current = Animated.sequence([
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
      ]),
      Animated.stagger(100, [
        Animated.spring(fabScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]);
    
    animationRef.current.start();

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
  };

  // Location updates with throttling
  useEffect(() => {
    if (location && mapSettings.followUser) {
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: mapSettings.autoZoom ? 0.01 : mapRegion.latitudeDelta,
        longitudeDelta: mapSettings.autoZoom ? 0.01 : mapRegion.longitudeDelta,
      };
      
      // Throttle map updates
      const timeoutId = setTimeout(() => {
        setMapRegion(newRegion);
        if (mapRef.current && mapReady) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location, mapSettings.followUser, mapSettings.autoZoom, mapReady]);

  // Optimized map functions
  const toggleVisibility = useCallback(async () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

    // Haptic feedback
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
  }, [isVisible, isTracking, startTracking, stopTracking]);

  const toggleMapControls = useCallback(() => {
    const newValue = !showMapControls;
    setShowMapControls(newValue);
    
    Animated.timing(controlsAnim, {
      toValue: newValue ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showMapControls]);

  const centerOnCurrentLocation = useCallback(() => {
    if (location && mapRef.current && mapReady) {
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000);
      setMapRegion(region);
    }
  }, [location, mapReady]);

  const focusOnFriend = useCallback((friend: any) => {
    if (mapRef.current && mapReady) {
      setSelectedFriend(friend);
      const region = {
        latitude: friend.latitude,
        longitude: friend.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current.animateToRegion(region, 1000);
      setMapRegion(region);
    }
  }, [mapReady]);

  const createRouteToFriend = useCallback((friend: any) => {
    if (!location) return;

    const route = {
      coordinates: [
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        {
          latitude: friend.latitude,
          longitude: friend.longitude,
        },
      ],
      distance: calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        friend.latitude,
        friend.longitude
      ),
    };

    setRouteToFriend(route);
    setSelectedFriend(friend);

    // Focus on route
    if (mapRef.current && mapReady) {
      mapRef.current.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      });
    }
  }, [location, calculateDistance, mapReady]);

  const updateMapSetting = useCallback((key: keyof MapSettings, value: any) => {
    setMapSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Utility functions
  const getMarkerColor = useCallback((status: string) => {
    switch (status) {
      case 'online': return theme.success;
      case 'offline': return theme.textSecondary;
      case 'ghost': return theme.secondary;
      default: return theme.primary;
    }
  }, [theme]);

  const getGeofenceColor = useCallback((type: string) => {
    switch (type) {
      case 'safe': return theme.success;
      case 'alert': return theme.error;
      case 'custom': return theme.primary;
      default: return theme.secondary;
    }
  }, [theme]);

  const getPOIIcon = useCallback((type: string) => {
    switch (type) {
      case 'restaurant': return '🍽️';
      case 'cafe': return '☕';
      case 'park': return '🌳';
      case 'shop': return '🛍️';
      default: return '📍';
    }
  }, []);

  // Optimized components
  const QuickStats = React.memo(() => (
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
          {onlineFriends.length}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          En ligne
        </Text>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: `${theme.primary}20` }]}>
          <Target color={theme.primary} size={16} />
        </View>
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {activeGeofences.length}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          Zones
        </Text>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.statItem}>
        <View style={[styles.statIcon, { backgroundColor: `${theme.accent}20` }]}>
          <Bell color={theme.accent} size={16} />
        </View>
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {unacknowledgedCount}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          Alertes
        </Text>
      </View>
    </Animated.View>
  ));

  const MapControls = React.memo(() => (
    <Animated.View
      style={[
        styles.mapControls,
        {
          backgroundColor: `${theme.surface}F5`,
          opacity: controlsAnim,
          transform: [
            {
              translateX: controlsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-200, 0],
              }),
            },
          ],
        }
      ]}
    >
      <View style={styles.controlHeader}>
        <Text style={[styles.controlsTitle, { color: theme.text }]}>
          Contrôles
        </Text>
        <TouchableOpacity onPress={toggleMapControls}>
          <X color={theme.textSecondary} size={20} />
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>
            Affichage
          </Text>
          
          {[
            { key: 'showGeofences', icon: Target, label: 'Géofences' },
            { key: 'showPOIs', icon: Star, label: 'Points d\'intérêt' },
            { key: 'showClusters', icon: Users, label: 'Clusters' },
            { key: 'showTraffic', icon: Navigation, label: 'Trafic' },
            { key: 'showBuildings', icon: Shield, label: 'Bâtiments' },
          ].map(({ key, icon: Icon, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.controlItem, 
                { backgroundColor: mapSettings[key as keyof MapSettings] ? theme.primary : theme.surface }
              ]}
              onPress={() => updateMapSetting(key as keyof MapSettings, !mapSettings[key as keyof MapSettings])}
            >
              <Icon 
                color={mapSettings[key as keyof MapSettings] ? theme.surface : theme.text} 
                size={20} 
              />
              <Text style={[
                styles.controlText, 
                { color: mapSettings[key as keyof MapSettings] ? theme.surface : theme.text }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>
            Type de carte
          </Text>
          
          {['standard', 'satellite', 'hybrid'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.controlItem, 
                { backgroundColor: mapSettings.mapType === type ? theme.primary : theme.surface }
              ]}
              onPress={() => updateMapSetting('mapType', type)}
            >
              <Text style={[
                styles.controlText, 
                { color: mapSettings.mapType === type ? theme.surface : theme.text }
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.controlGroup}>
          <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>
            Navigation
          </Text>
          
          {[
            { key: 'followUser', label: 'Suivre ma position' },
            { key: 'autoZoom', label: 'Zoom automatique' },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.controlItem, 
                { backgroundColor: mapSettings[key as keyof MapSettings] ? theme.primary : theme.surface }
              ]}
              onPress={() => updateMapSetting(key as keyof MapSettings, !mapSettings[key as keyof MapSettings])}
            >
              <Text style={[
                styles.controlText, 
                { color: mapSettings[key as keyof MapSettings] ? theme.surface : theme.text }
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  ));

  const FloatingActionButton = React.memo(({ 
    icon, 
    onPress, 
    backgroundColor, 
    style = {},
    delay = 0,
    disabled = false
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
            backgroundColor: disabled ? theme.textSecondary : backgroundColor,
            transform: [{ scale: buttonScale }],
          },
          style,
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={onPress}
          activeOpacity={0.8}
          disabled={disabled}
        >
          {icon}
        </TouchableOpacity>
      </Animated.View>
    );
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Initialisation...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
                Explorer 🗺️
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {nearbyFriends.length} ami{nearbyFriends.length !== 1 ? 's' : ''} à proximité
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.surface }]}
                onPress={() => setShowSettings(true)}
              >
                <Settings color={theme.text} size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: theme.primary }]}
                onPress={toggleMapControls}
              >
                <Filter color={theme.surface} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Quick Stats */}
      <QuickStats />

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          onMapReady={() => setMapReady(true)}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsUserLocation={isVisible}
          showsMyLocationButton={false}
          followsUserLocation={mapSettings.followUser}
          showsTraffic={mapSettings.showTraffic}
          showsBuildings={mapSettings.showBuildings}
          mapType={mapSettings.mapType}
          customMapStyle={isDark ? darkMapStyle : []}
          loadingEnabled={true}
          loadingIndicatorColor={theme.primary}
          loadingBackgroundColor={theme.background}
        >
          {/* Current user location marker */}
          {location && isVisible && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Vous"
              description="Votre position actuelle"
            >
              <View style={[styles.userMarker, { backgroundColor: theme.primary }]}>
                <View style={[styles.userMarkerInner, { backgroundColor: theme.surface }]} />
              </View>
            </Marker>
          )}

          {/* Friend markers with clustering */}
          {mapSettings.showClusters ? (
            <MapClusters
              friends={friends}
              region={mapRegion}
              onFriendPress={focusOnFriend}
              onClusterPress={(cluster) => {
                if (mapRef.current && mapReady) {
                  mapRef.current.fitToCoordinates(
                    cluster.friends.map(f => ({ latitude: f.latitude, longitude: f.longitude })),
                    { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true }
                  );
                }
              }}
            />
          ) : (
            friends.map((friend) => (
              <Marker
                key={friend.id}
                coordinate={{
                  latitude: friend.latitude,
                  longitude: friend.longitude,
                }}
                title={friend.name}
                description={`${friend.status} • Vu: ${new Date(friend.last_seen).toLocaleTimeString()}`}
                onPress={() => focusOnFriend(friend)}
              >
                <View style={[styles.friendMarker, { backgroundColor: getMarkerColor(friend.status) }]}>
                  <Text style={[styles.friendMarkerText, { color: theme.surface }]}>
                    {friend.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </Marker>
            ))
          )}

          {/* Geofence zones */}
          {mapSettings.showGeofences && geofenceZones.map((zone) => (
            <Circle
              key={zone.id}
              center={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              radius={zone.radius}
              fillColor={`${getGeofenceColor(zone.type)}20`}
              strokeColor={getGeofenceColor(zone.type)}
              strokeWidth={2}
            />
          ))}

          {/* Points of Interest */}
          {mapSettings.showPOIs && pois.map((poi) => (
            <Marker
              key={poi.id}
              coordinate={{
                latitude: poi.latitude,
                longitude: poi.longitude,
              }}
              title={`${getPOIIcon(poi.type)} ${poi.name}`}
              description={`⭐ ${poi.rating} - ${poi.description}`}
            />
          ))}

          {/* Route to friend */}
          {routeToFriend && (
            <Polyline
              coordinates={routeToFriend.coordinates}
              strokeColor={theme.primary}
              strokeWidth={4}
              lineDashPattern={[5, 5]}
            />
          )}
        </MapView>

        {/* Map Overlay */}
        <LinearGradient
          colors={['transparent', `${theme.background}40`]}
          style={styles.mapOverlay}
          pointerEvents="none"
        />
      </View>

      {/* Map Controls */}
      {showMapControls && <MapControls />}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <FloatingActionButton
          icon={isVisible ? <Eye color="white" size={24} /> : <EyeOff color="white" size={24} />}
          onPress={toggleVisibility}
          backgroundColor={isVisible ? theme.success : theme.secondary}
          delay={0}
        />

        <FloatingActionButton
          icon={<Compass color="white" size={24} />}
          onPress={centerOnCurrentLocation}
          backgroundColor={theme.primary}
          delay={100}
          disabled={!location}
        />

        <FloatingActionButton
          icon={<RefreshCw color="white" size={24} />}
          onPress={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1000);
          }}
          backgroundColor={theme.accent}
          delay={200}
        />
      </View>

      {/* Friend Details Modal */}
      {selectedFriend && (
        <Modal
          visible={!!selectedFriend}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedFriend(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.friendModal, { backgroundColor: theme.surface }]}>
              <LinearGradient
                colors={[theme.primary, theme.secondary]}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={[styles.modalAvatarText, { color: theme.surface }]}>
                      {selectedFriend.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalInfo}>
                    <Text style={[styles.modalName, { color: theme.surface }]}>
                      {selectedFriend.name}
                    </Text>
                    <Text style={[styles.modalStatus, { color: `${theme.surface}CC` }]}>
                      {selectedFriend.status === 'online' ? 'En ligne' : 
                       selectedFriend.status === 'ghost' ? 'Mode fantôme' : 'Hors ligne'}
                    </Text>
                    <Text style={[styles.modalDistance, { color: `${theme.surface}CC` }]}>
                      {location && `${calculateDistance(
                        location.coords.latitude,
                        location.coords.longitude,
                        selectedFriend.latitude,
                        selectedFriend.longitude
                      ).toFixed(1)} km`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedFriend(null)}
                  >
                    <X color={theme.surface} size={24} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={[styles.modalAction, { backgroundColor: `${theme.primary}20` }]}
                  onPress={() => createRouteToFriend(selectedFriend)}
                >
                  <Route color={theme.primary} size={24} />
                  <Text style={[styles.modalActionText, { color: theme.primary }]}>
                    Créer un itinéraire
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalAction, { backgroundColor: `${theme.success}20` }]}
                  onPress={() => focusOnFriend(selectedFriend)}
                >
                  <Target color={theme.success} size={24} />
                  <Text style={[styles.modalActionText, { color: theme.success }]}>
                    Centrer sur la carte
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalAction, { backgroundColor: `${theme.accent}20` }]}
                  onPress={() => {
                    setSelectedFriend(null);
                    // Navigate to chat
                  }}
                >
                  <Bell color={theme.accent} size={24} />
                  <Text style={[styles.modalActionText, { color: theme.accent }]}>
                    Envoyer un message
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

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
            <MapPin color={theme.primary} size={16} />
            <Text style={[styles.statusText, { color: theme.text }]}>
              {friends.length} ami{friends.length !== 1 ? 's' : ''} • {activeGeofences.length} zone{activeGeofences.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {unacknowledgedCount > 0 && (
            <>
              <View style={styles.statusDivider} />
              <View style={styles.statusItem}>
                <Bell color={theme.error} size={16} />
                <Text style={[styles.statusText, { color: theme.error }]}>
                  {unacknowledgedCount} alerte{unacknowledgedCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  friendMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  friendMarkerText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  mapControls: {
    position: 'absolute',
    left: 24,
    top: 140,
    bottom: 140,
    width: 220,
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 15,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  controlGroup: {
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  controlText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  friendModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  modalInfo: {
    flex: 1,
  },
  modalName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  modalStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  modalDistance: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 24,
    gap: 16,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  modalActionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
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