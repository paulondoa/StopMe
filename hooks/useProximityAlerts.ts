import { useState, useEffect, useCallback } from 'react';
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
}

export function useProximityAlerts() {
  const { location } = useDemoLocation();
  const { friends } = useDemoAuth();
  const [alerts, setAlerts] = useState<ProximityAlert[]>([]);
  const [settings, setSettings] = useState<ProximitySettings>({
    enabled: true,
    radius: 500, // 500 meters
    cooldownPeriod: 30, // 30 minutes
  });

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
    const lastAlert = alerts
      .filter(alert => alert.friendId === friendId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!lastAlert) return false;

    const cooldownMs = settings.cooldownPeriod * 60 * 1000;
    const timeSinceLastAlert = Date.now() - lastAlert.timestamp.getTime();
    
    return timeSinceLastAlert < cooldownMs;
  }, [alerts, settings.cooldownPeriod]);

  const checkProximity = useCallback(() => {
    if (!location || !settings.enabled) return;

    friends.forEach(friend => {
      // Only check for online friends
      if (friend.status !== 'online') return;

      // Skip if in cooldown period
      if (isInCooldown(friend.id)) return;

      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        friend.latitude,
        friend.longitude
      );

      if (distance <= settings.radius) {
        const newAlert: ProximityAlert = {
          id: Date.now().toString() + friend.id,
          friendId: friend.id,
          friendName: friend.name,
          distance: Math.round(distance),
          timestamp: new Date(),
          acknowledged: false,
        };

        setAlerts(prev => [...prev, newAlert]);
        triggerProximityNotification(newAlert);
      }
    });
  }, [location, friends, settings, isInCooldown, calculateDistance]);

  const triggerProximityNotification = (alert: ProximityAlert) => {
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
  };

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

  useEffect(() => {
    const interval = setInterval(checkProximity, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [checkProximity]);

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
    unacknowledgedCount: getUnacknowledgedAlerts().length,
  };
}