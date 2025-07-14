import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useDemoLocation } from '@/contexts/DemoLocationContext';
import { useDemoAuth } from '@/contexts/DemoAuthContext';

interface ProximityAlert {
  id: string;
  friendId: string;
  friendName: string;
  distance: number;
  timestamp: Date;
  acknowledged: boolean;
}

interface ProximitySettings {
  enabled: boolean;
  radius: number; // in meters
  cooldownPeriod: number; // in minutes
  onlineOnly: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export function useProximityAlerts() {
  const { location } = useDemoLocation();
  const { friends } = useDemoAuth();
  const [alerts, setAlerts] = useState<ProximityAlert[]>([]);
  const [settings, setSettings] = useState<ProximitySettings>({
    enabled: true,
    radius: 500, // 500 meters
    cooldownPeriod: 30, // 30 minutes
    onlineOnly: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  // Refs for optimization
  const lastCheckTimeRef = useRef<number>(0);
  const previousLocationRef = useRef<any>(null);
  const alertCooldownRef = useRef<Map<string, number>>(new Map());

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

  const isInCooldown = useCallback((friendId: string) => {
    const lastAlertTime = alertCooldownRef.current.get(friendId);
    if (!lastAlertTime) return false;

    const cooldownMs = settings.cooldownPeriod * 60 * 1000;
    const timeSinceLastAlert = Date.now() - lastAlertTime;
    
    return timeSinceLastAlert < cooldownMs;
  }, [settings.cooldownPeriod]);

  const checkProximity = useCallback(async () => {
    if (!location || !settings.enabled || friends.length === 0) return;

    // Throttle checks to avoid excessive processing
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 10000) return; // Check at most every 10 seconds

    const previousLocation = previousLocationRef.current;
    if (previousLocation && 
        Math.abs(location.coords.latitude - previousLocation.latitude) < 0.0001 &&
        Math.abs(location.coords.longitude - previousLocation.longitude) < 0.0001) {
      return; // Location hasn't changed significantly
    }

    lastCheckTimeRef.current = now;
    previousLocationRef.current = location.coords;

    try {
      const newAlerts: ProximityAlert[] = [];

      for (const friend of friends) {
        // Skip if only checking online friends and friend is not online
        if (settings.onlineOnly && friend.status !== 'online') continue;

        // Skip if in cooldown period
        if (isInCooldown(friend.id)) continue;

        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          friend.latitude,
          friend.longitude
        );

        if (distance <= settings.radius) {
          const newAlert: ProximityAlert = {
            id: `${Date.now()}-${friend.id}`,
            friendId: friend.id,
            friendName: friend.name,
            distance: Math.round(distance),
            timestamp: new Date(),
            acknowledged: false,
          };

          newAlerts.push(newAlert);
          alertCooldownRef.current.set(friend.id, now);
          triggerProximityNotification(newAlert);
        }
      }

      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts].slice(-100)); // Keep only last 100 alerts
      }
    } catch (error) {
      console.error('Error checking proximity:', error);
    }
  }, [location, friends, settings, isInCooldown, calculateDistance]);

  const triggerProximityNotification = useCallback((alert: ProximityAlert) => {
    const distanceText = alert.distance < 100 
      ? `${alert.distance}m` 
      : `${Math.round(alert.distance / 100) * 100}m`;

    Alert.alert(
      '👋 Ami à proximité !',
      `${alert.friendName} est à ${distanceText} de vous`,
      [
        { 
          text: 'Ignorer', 
          style: 'cancel',
          onPress: () => acknowledgeAlert(alert.id)
        },
        { 
          text: 'Voir sur la carte', 
          onPress: () => {
            acknowledgeAlert(alert.id);
            // This would navigate to the map and focus on the friend
            console.log(`Focus on friend: ${alert.friendId}`);
          }
        },
        {
          text: 'Envoyer un message',
          onPress: () => {
            acknowledgeAlert(alert.id);
            // This would open the chat with the friend
            console.log(`Open chat with: ${alert.friendId}`);
          }
        }
      ]
    );
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  }, []);

  const clearAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    alertCooldownRef.current.clear();
  }, []);

  const updateSettings = useCallback((newSettings: Partial<ProximitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const getUnacknowledgedAlerts = useCallback(() => {
    return alerts.filter(alert => !alert.acknowledged);
  }, [alerts]);

  const getRecentAlerts = useCallback((limit: number = 10) => {
    return alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }, [alerts]);

  const getFriendProximityHistory = useCallback((friendId: string) => {
    return alerts
      .filter(alert => alert.friendId === friendId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [alerts]);

  const getProximityStats = useCallback(() => {
    const now = Date.now();
    const last24Hours = alerts.filter(alert => 
      now - alert.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    return {
      total: alerts.length,
      last24Hours: last24Hours.length,
      unacknowledged: getUnacknowledgedAlerts().length,
      averageDistance: alerts.length > 0 
        ? Math.round(alerts.reduce((sum, alert) => sum + alert.distance, 0) / alerts.length)
        : 0,
    };
  }, [alerts, getUnacknowledgedAlerts]);

  // Optimized effect with proper cleanup
  useEffect(() => {
    if (!settings.enabled) return;

    const timeoutId = setTimeout(() => {
      checkProximity();
    }, 2000); // Debounce location changes

    return () => clearTimeout(timeoutId);
  }, [checkProximity, settings.enabled]);

  // Cleanup old alerts periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      setAlerts(prev => prev.filter(alert => 
        now - alert.timestamp.getTime() < maxAge
      ));
      
      // Clean up cooldown map
      for (const [friendId, timestamp] of alertCooldownRef.current.entries()) {
        if (now - timestamp > maxAge) {
          alertCooldownRef.current.delete(friendId);
        }
      }
    }, 60 * 60 * 1000); // Run every hour

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    alerts,
    settings,
    acknowledgeAlert,
    clearAlert,
    clearAllAlerts,
    updateSettings,
    getUnacknowledgedAlerts,
    getRecentAlerts,
    getFriendProximityHistory,
    getProximityStats,
    unacknowledgedCount: getUnacknowledgedAlerts().length,
    isEnabled: settings.enabled,
  };
}