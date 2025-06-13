import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface LocationContextType {
  location: Location.LocationObject | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  isTracking: boolean;
}

const LocationContext = createContext<LocationContextType>({} as LocationContextType);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS === 'web') {
      setHasPermission(true);
      return;
    }

    const { status } = await Location.getForegroundPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    return granted;
  };

  const updateLocationInDatabase = async (locationData: Location.LocationObject) => {
    if (!user) return;

    const { error } = await supabase
      .from('locations')
      .upsert({
        user_id: user.id,
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating location:', error);
    }
  };

  const startTracking = async () => {
    if (!hasPermission || isTracking) return;

    try {
      setIsTracking(true);

      if (Platform.OS === 'web') {
        // Web location tracking
        const webLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(webLocation);
        await updateLocationInDatabase(webLocation);
        
        // Update every 30 seconds for web
        const interval = setInterval(async () => {
          try {
            const newLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            setLocation(newLocation);
            await updateLocationInDatabase(newLocation);
          } catch (error) {
            console.error('Error getting web location:', error);
          }
        }, 30000);

        // Store interval reference for cleanup
        return () => clearInterval(interval);
      } else {
        // Native location tracking
        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 30000, // Update every 30 seconds
            distanceInterval: 10, // Or when moved 10 meters
          },
          async (locationData) => {
            setLocation(locationData);
            await updateLocationInDatabase(locationData);
          }
        );

        setSubscription(locationSubscription);
      }
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
    setIsTracking(false);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        hasPermission,
        requestPermission,
        startTracking,
        stopTracking,
        isTracking,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};