import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDemoLocation } from '@/contexts/DemoLocationContext';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Eye, EyeOff, RefreshCw, Navigation, MapPin, Users, Zap, Shield, 
  Target, Layers, Route, Bell, Settings, Plus, Minus, Compass,
  AlertTriangle, Clock, Star, Filter
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  
  // Advanced features state
  const [showGeofences, setShowGeofences] = useState(true);
  const [showPOIs, setShowPOIs] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [routeToFriend, setRouteToFriend] = useState<any>(null);
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>([]);
  const [pois, setPOIs] = useState<POI[]>([]);
  const [showMapControls, setShowMapControls] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [proximityAlerts, setProximityAlerts] = useState<any[]>([]);

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(-50);
  const pulseAnim = new Animated.Value(1);
  const fabScale = new Animated.Value(0);
  const controlsAnim = new Animated.Value(0);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    initializeLocation();
    initializeGeofences();
    initializePOIs();
    
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
      checkProximityAlerts();
    }
  }, [location]);

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

  const initializeGeofences = () => {
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

  const initializePOIs = () => {
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

  const checkProximityAlerts = () => {
    if (!location) return;

    friends.forEach(friend => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        friend.latitude,
        friend.longitude
      );

      if (distance < 0.5 && friend.status === 'online') { // 500m
        const existingAlert = proximityAlerts.find(alert => alert.friendId === friend.id);
        if (!existingAlert) {
          const newAlert = {
            id: Date.now().toString(),
            friendId: friend.id,
            friendName: friend.name,
            distance: Math.round(distance * 1000),
            timestamp: new Date(),
          };
          setProximityAlerts(prev => [...prev, newAlert]);
          
          // Show notification
          Alert.alert(
            '👋 Ami à proximité !',
            `${friend.name} est à ${Math.round(distance * 1000)}m de vous`,
            [
              { text: 'Ignorer', style: 'cancel' },
              { text: 'Voir sur la carte', onPress: () => focusOnFriend(friend) },
            ]
          );
        }
      }
    });
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

  const focusOnFriend = (friend: any) => {
    setSelectedFriend(friend);
    mapRef.current?.animateToRegion({
      latitude: friend.latitude,
      longitude: friend.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 1000);
  };

  const createRouteToFriend = (friend: any) => {
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
    mapRef.current?.fitToCoordinates(route.coordinates, {
      edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
      animated: true,
    });
  };

  const toggleVisibility = async () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

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

  const toggleMapControls = () => {
    const newValue = !showMapControls;
    setShowMapControls(newValue);
    
    Animated.timing(controlsAnim, {
      toValue: newValue ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const centerOnCurrentLocation = () => {
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
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

  const getGeofenceColor = (type: string) => {
    switch (type) {
      case 'safe':
        return theme.success;
      case 'alert':
        return theme.error;
      case 'custom':
        return theme.primary;
      default:
        return theme.secondary;
    }
  };

  const getPOIIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return '🍽️';
      case 'cafe':
        return '☕';
      case 'park':
        return '🌳';
      case 'shop':
        return '🛍️';
      default:
        return '📍';
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
          <Target color={theme.primary} size={16} />
        </View>
        <Text style={[styles.statNumber, { color: theme.text }]}>
          {geofenceZones.filter(z => z.active).length}
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
          {proximityAlerts.length}
        </Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
          Alertes
        </Text>
      </View>
    </Animated.View>
  );

  const MapControls = () => (
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
      <Text style={[styles.controlsTitle, { color: theme.text }]}>
        Contrôles de la carte
      </Text>
      
      <View style={styles.controlGroup}>
        <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>
          Affichage
        </Text>
        
        <TouchableOpacity
          style={[styles.controlItem, { backgroundColor: showGeofences ? theme.primary : theme.surface }]}
          onPress={() => setShowGeofences(!showGeofences)}
        >
          <Target color={showGeofences ? theme.surface : theme.text} size={20} />
          <Text style={[styles.controlText, { color: showGeofences ? theme.surface : theme.text }]}>
            Géofences
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlItem, { backgroundColor: showPOIs ? theme.primary : theme.surface }]}
          onPress={() => setShowPOIs(!showPOIs)}
        >
          <Star color={showPOIs ? theme.surface : theme.text} size={20} />
          <Text style={[styles.controlText, { color: showPOIs ? theme.surface : theme.text }]}>
            Points d'intérêt
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlItem, { backgroundColor: showClusters ? theme.primary : theme.surface }]}
          onPress={() => setShowClusters(!showClusters)}
        >
          <Layers color={showClusters ? theme.surface : theme.text} size={20} />
          <Text style={[styles.controlText, { color: showClusters ? theme.surface : theme.text }]}>
            Clusters
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlGroup}>
        <Text style={[styles.controlLabel, { color: theme.textSecondary }]}>
          Type de carte
        </Text>
        
        {['standard', 'satellite', 'hybrid'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.controlItem, { backgroundColor: mapType === type ? theme.primary : theme.surface }]}
            onPress={() => setMapType(type as any)}
          >
            <Text style={[styles.controlText, { color: mapType === type ? theme.surface : theme.text }]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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
                Explorer 🗺️
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Carte avancée avec géofencing
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: theme.surface }]}
              onPress={toggleMapControls}
            >
              <Settings color={theme.text} size={20} />
            </TouchableOpacity>
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
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={false}
          mapType={mapType}
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
              onPress={() => setSelectedFriend(friend)}
            />
          ))}

          {/* Geofence zones */}
          {showGeofences && geofenceZones.map((zone) => (
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
          {showPOIs && pois.map((poi) => (
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
        />

        <FloatingActionButton
          icon={<Filter color="white" size={24} />}
          onPress={toggleMapControls}
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
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedFriend(null)}
                  >
                    <Text style={[styles.closeButtonText, { color: theme.surface }]}>×</Text>
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
                    Alert.alert('Message', `Envoyer un message à ${selectedFriend.name}`);
                    setSelectedFriend(null);
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
              {friends.length} {friends.length === 1 ? 'ami' : 'amis'} • {geofenceZones.length} zones
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
  settingsButton: {
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
  mapControls: {
    position: 'absolute',
    left: 24,
    top: 140,
    bottom: 140,
    width: 200,
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 15,
  },
  controlsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
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
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
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