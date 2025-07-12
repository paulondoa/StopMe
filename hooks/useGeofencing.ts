import { useState, useEffect, useCallback } from 'react';
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

  const checkGeofences = useCallback(() => {
    if (!location) return;

    const currentlyInZones: string[] = [];

    zones.forEach(zone => {
      if (!zone.active) return;

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
          id: Date.now().toString(),
          zoneId: zone.id,
          zoneName: zone.name,
          type: 'enter',
          timestamp: new Date(),
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setEvents(prev => [...prev, event]);
        triggerGeofenceAlert(zone, 'enter');
      }

      // Zone exit
      if (!isInZone && wasInZone) {
        const event: GeofenceEvent = {
          id: Date.now().toString(),
          zoneId: zone.id,
          zoneName: zone.name,
          type: 'exit',
          timestamp: new Date(),
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setEvents(prev => [...prev, event]);
        triggerGeofenceAlert(zone, 'exit');
      }
    });

    setActiveZones(currentlyInZones);
  }, [location, zones, activeZones, calculateDistance]);

  const triggerGeofenceAlert = (zone: GeofenceZone, eventType: 'enter' | 'exit') => {
    const emoji = zone.type === 'safe' ? '🏠' : zone.type === 'alert' ? '⚠️' : '📍';
    const action = eventType === 'enter' ? 'Entrée dans' : 'Sortie de';
    
    Alert.alert(
      `${emoji} Géofence`,
      `${action} la zone "${zone.name}"`,
      [
        { text: 'OK', style: 'default' },
        { text: 'Voir sur la carte', onPress: () => {
          // This would navigate to the map and focus on the zone
          console.log(`Focus on zone: ${zone.id}`);
        }},
      ]
    );
  };

  useEffect(() => {
    checkGeofences();
  }, [checkGeofences]);

  const addGeofence = useCallback((zone: Omit<GeofenceZone, 'id'>) => {
    const newZone: GeofenceZone = {
      ...zone,
      id: Date.now().toString(),
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

  return {
    events,
    activeZones,
    addGeofence,
    removeGeofence,
    getZoneStatus,
    getRecentEvents,
    isInZone: (zoneId: string) => activeZones.includes(zoneId),
  };
}