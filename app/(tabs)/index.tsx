import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocation } from '@/contexts/LocationContext';
import { useFriendLocations } from '@/hooks/useFriendLocations';
import { Eye, EyeOff, RefreshCw, Navigation } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function MapScreen() {
  const { user } = useAuth();
  const { location, hasPermission, requestPermission, startTracking, stopTracking, isTracking } = useLocation();
  const { friendLocations, loading, refreshLocations } = useFriendLocations();
  const [isVisible, setIsVisible] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    initializeLocation();
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
    if (!user) return;

    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

    const { error } = await supabase
      .from('users')
      .update({ 
        visible: newVisibility,
        status: newVisibility ? 'online' : 'ghost'
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating visibility:', error);
      setIsVisible(!newVisibility); // Revert on error
    }

    if (newVisibility && !isTracking) {
      await startTracking();
    } else if (!newVisibility && isTracking) {
      stopTracking();
    }
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
        return '#10B981'; // Green
      case 'offline':
        return '#9CA3AF'; // Gray
      case 'ghost':
        return '#8B5CF6'; // Purple
      default:
        return '#3B82F6'; // Blue
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
      >
        {/* Current user location */}
        {location && isVisible && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="You"
            pinColor="#3B82F6"
          />
        )}

        {/* Friend locations */}
        {friendLocations.map((friendLocation) => (
          <Marker
            key={friendLocation.user.id}
            coordinate={{
              latitude: friendLocation.latitude,
              longitude: friendLocation.longitude,
            }}
            title={friendLocation.user.name}
            description={`Last seen: ${new Date(friendLocation.updated_at).toLocaleTimeString()}`}
            pinColor={getMarkerColor(friendLocation.user.status)}
          />
        ))}
      </MapView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.visibilityFab]}
          onPress={toggleVisibility}
        >
          {isVisible ? (
            <Eye color="white" size={24} />
          ) : (
            <EyeOff color="white" size={24} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, styles.refreshFab]}
          onPress={refreshLocations}
        >
          <RefreshCw color="white" size={24} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, styles.locationFab]}
          onPress={centerOnCurrentLocation}
        >
          <Navigation color="white" size={24} />
        </TouchableOpacity>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View 
            style={[
              styles.statusDot, 
              { backgroundColor: isVisible ? '#10B981' : '#9CA3AF' }
            ]} 
          />
          <Text style={styles.statusText}>
            {isVisible ? 'Visible' : 'Hidden'}
          </Text>
        </View>
        
        <View style={styles.statusItem}>
          <Text style={styles.statusText}>
            {friendLocations.length} friends nearby
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  map: {
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    gap: 12,
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
  visibilityFab: {
    backgroundColor: '#8B5CF6',
  },
  refreshFab: {
    backgroundColor: '#10B981',
  },
  locationFab: {
    backgroundColor: '#3B82F6',
  },
  statusBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
});