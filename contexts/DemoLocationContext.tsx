import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface DemoLocationContextType {
  location: Location.LocationObject | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  isTracking: boolean;
}

const DemoLocationContext = createContext<DemoLocationContextType>({} as DemoLocationContextType);

export function DemoLocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hasPermission, setHasPermission] = useState(true); // Auto-grant for demo
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Set demo location (San Francisco)
    const demoLocation: Location.LocationObject = {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: null,
        accuracy: 10,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };
    
    setLocation(demoLocation);
    setIsTracking(true);
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    setHasPermission(true);
    return true;
  };

  const startTracking = async () => {
    setIsTracking(true);
    
    // Simulate location updates
    const updateLocation = () => {
      const baseLocation = {
        coords: {
          latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };
      
      setLocation(baseLocation);
    };

    // Update location every 30 seconds for demo
    const interval = setInterval(updateLocation, 30000);
    
    return () => clearInterval(interval);
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  return (
    <DemoLocationContext.Provider
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
    </DemoLocationContext.Provider>
  );
}

export const useDemoLocation = () => {
  const context = useContext(DemoLocationContext);
  if (!context) {
    throw new Error('useDemoLocation must be used within DemoLocationProvider');
  }
  return context;
};