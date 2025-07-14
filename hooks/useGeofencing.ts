import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useDemoLocation } from '@/contexts/DemoLocationContext';

interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: 'safe' | 'alert' | 'custom';
  active: boolean;
}

interface GeofenceEvent {
  id: string;
  zoneId: string;
  zoneName: string;
  type: 'enter' | 'exit';
  timestamp: Date;
  latitude: number;
  longitude: number;
}

export function useGeofencing(zones: GeofenceZone[]) {
  const { location } = useDemoLocation();
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [activeZones, setActiveZones] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use ref to store previous location to avoid unnecessary calculations
  const previousLocationRef = useRef<any>(null);
  const lastCheckTimeRef = useRef<number>(0);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const checkGeofences = useCallback(async () => {
    if (!location || isProcessing || zones.length === 0) return;

    // Throttle checks to avoid excessive processing
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 5000) return; // Check at most every 5 seconds
    
    const previousLocation = previousLocationRef.current;
    if (previousLocation && 
        Math.abs(location.coords.latitude - previousLocation.latitude) < 0.0001 &&
        Math.abs(location.coords.longitude - previousLocation.longitude) < 0.0001) {
      return; // Location hasn't changed significantly
    }

    setIsProcessing(true);
    lastCheckTimeRef.current = now;
    previousLocationRef.current = location.coords;

    try {
      const currentlyInZones: string[] = [];
      const newEvents: GeofenceEvent[] = [];

      for (const zone of zones) {
        if (!zone.active) continue;

        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          zone.latitude,
          zone.longitude
        );

        const isInZone = distance <= zone.radius;
        const wasInZone = activeZones.includes(zone.id);

        if (isInZone) {
          currentlyInZones.push(zone.id);
        }

        // Zone entry
        if (isInZone && !wasInZone) {
          const event: GeofenceEvent = {
            id: `${Date.now()}-${zone.id}-enter`,
            zoneId: zone.id,
            zoneName: zone.name,
            type: 'enter',
            timestamp: new Date(),
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          newEvents.push(event);
          triggerGeofenceAlert(zone, 'enter');
        }

        // Zone exit
        if (!isInZone && wasInZone) {
          const event: GeofenceEvent = {
            id: `${Date.now()}-${zone.id}-exit`,
            zoneId: zone.id,
            zoneName: zone.name,
            type: 'exit',
            timestamp: new Date(),
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          newEvents.push(event);
          triggerGeofenceAlert(zone, 'exit');
        }
      }

      if (newEvents.length > 0) {
        setEvents(prev => [...prev, ...newEvents].slice(-50)); // Keep only last 50 events
      }
      
      setActiveZones(currentlyInZones);
    } catch (error) {
      console.error('Error checking geofences:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [location, zones, activeZones, calculateDistance, isProcessing]);

  const triggerGeofenceAlert = useCallback((zone: GeofenceZone, eventType: 'enter' | 'exit') => {
    const emoji = zone.type === 'safe' ? '🏠' : zone.type === 'alert' ? '⚠️' : '📍';
    const action = eventType === 'enter' ? 'Entrée dans' : 'Sortie de';
    
    Alert.alert(
      `${emoji} Géofence`,
      `${action} la zone "${zone.name}"`,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Voir sur la carte', 
          onPress: () => {
            // This would navigate to the map and focus on the zone
            console.log(`Focus on zone: ${zone.id}`);
          }
        },
      ]
    );
  }, []);

  // Optimized effect with proper cleanup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkGeofences();
    }, 1000); // Debounce location changes

    return () => clearTimeout(timeoutId);
  }, [checkGeofences]);

  const addGeofence = useCallback((zone: Omit<GeofenceZone, 'id'>) => {
    const newZone: GeofenceZone = {
      ...zone,
      id: `zone-${Date.now()}`,
    };
    return newZone;
  }, []);

  const removeGeofence = useCallback((zoneId: string) => {
    setActiveZones(prev => prev.filter(id => id !== zoneId));
    setEvents(prev => prev.filter(event => event.zoneId !== zoneId));
  }, []);

  const getZoneStatus = useCallback((zoneId: string) => {
    return activeZones.includes(zoneId) ? 'inside' : 'outside';
  }, [activeZones]);

  const getRecentEvents = useCallback((limit: number = 10) => {
    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }, [events]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const getEventsByZone = useCallback((zoneId: string) => {
    return events.filter(event => event.zoneId === zoneId);
  }, [events]);

  return {
    events,
    activeZones,
    isProcessing,
    addGeofence,
    removeGeofence,
    getZoneStatus,
    getRecentEvents,
    clearEvents,
    getEventsByZone,
    isInZone: (zoneId: string) => activeZones.includes(zoneId),
    eventsCount: events.length,
    activeZonesCount: activeZones.length,
  };
}