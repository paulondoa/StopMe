import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocation } from '@/contexts/LocationContext';
import { useFriendLocations } from '@/hooks/useFriendLocations';
import { Eye, EyeOff, RefreshCw, Navigation, MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function MapScreen() {
  const { user } = useAuth();
  const { location, hasPermission, requestPermission, startTracking, stopTracking, isTracking } = useLocation();
  const { friendLocations, loading, refreshLocations } = useFriendLocations();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    initializeLocation();
  }, []);

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

  const getStatusColor = (status: string) => {
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
      {/* Web Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <MapPin color="#9CA3AF" size={64} />
        <Text style={styles.placeholderTitle}>Map View</Text>
        <Text style={styles.placeholderSubtitle}>
          Interactive map is available on mobile devices
        </Text>
        
        {/* Current Location Info */}
        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Your Location</Text>
            <Text style={styles.locationText}>
              Lat: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Lng: {location.coords.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Friends List */}
        {friendLocations.length > 0 && (
          <View style={styles.friendsList}>
            <Text style={styles.friendsTitle}>Friends Nearby</Text>
            {friendLocations.map((friendLocation) => (
              <View key={friendLocation.user.id} style={styles.friendItem}>
                <View style={styles.friendInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {friendLocation.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.friendDetails}>
                    <Text style={styles.friendName}>{friendLocation.user.name}</Text>
                    <Text style={styles.friendLocation}>
                      Lat: {friendLocation.latitude.toFixed(4)}, Lng: {friendLocation.longitude.toFixed(4)}
                    </Text>
                    <Text style={styles.friendTime}>
                      Last seen: {new Date(friendLocation.updated_at).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View 
                    style={[
                      styles.statusIndicator, 
                      { backgroundColor: getStatusColor(friendLocation.user.status) }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

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
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginTop: 16,
  },
  placeholderSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  locationInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  locationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  friendsList: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  friendsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  friendItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  friendLocation: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  friendTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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