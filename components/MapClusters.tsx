import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';

interface Friend {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'online' | 'offline' | 'ghost';
}

interface ClusterData {
  id: string;
  latitude: number;
  longitude: number;
  friends: Friend[];
  count: number;
}

interface MapClustersProps {
  friends: Friend[];
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onClusterPress?: (cluster: ClusterData) => void;
  onFriendPress?: (friend: Friend) => void;
  clusterRadius?: number;
  minClusterSize?: number;
  maxZoom?: number;
}

export default function MapClusters({
  friends,
  region,
  onClusterPress,
  onFriendPress,
  clusterRadius = 0.01, // Degrees
  minClusterSize = 2,
  maxZoom = 0.01,
}: MapClustersProps) {
  const { theme } = useTheme();

  // Memoized clustering algorithm for performance
  const clusters = useMemo(() => {
    if (friends.length === 0) return [];

    // Don't cluster if zoomed in too much
    if (region.latitudeDelta < maxZoom) {
      return friends.map(friend => ({
        id: friend.id,
        latitude: friend.latitude,
        longitude: friend.longitude,
        friends: [friend],
        count: 1,
      }));
    }

    const clustered: ClusterData[] = [];
    const processed = new Set<string>();

    // Adjust cluster radius based on zoom level
    const adjustedRadius = clusterRadius * (region.latitudeDelta / 0.1);

    friends.forEach(friend => {
      if (processed.has(friend.id)) return;

      const nearbyFriends = friends.filter(otherFriend => {
        if (otherFriend.id === friend.id || processed.has(otherFriend.id)) {
          return false;
        }

        const distance = Math.sqrt(
          Math.pow(friend.latitude - otherFriend.latitude, 2) +
          Math.pow(friend.longitude - otherFriend.longitude, 2)
        );

        return distance <= adjustedRadius;
      });

      if (nearbyFriends.length >= minClusterSize - 1) {
        // Create cluster
        const clusterFriends = [friend, ...nearbyFriends];
        const centerLat = clusterFriends.reduce((sum, f) => sum + f.latitude, 0) / clusterFriends.length;
        const centerLng = clusterFriends.reduce((sum, f) => sum + f.longitude, 0) / clusterFriends.length;

        clustered.push({
          id: `cluster-${friend.id}`,
          latitude: centerLat,
          longitude: centerLng,
          friends: clusterFriends,
          count: clusterFriends.length,
        });

        // Mark all friends in this cluster as processed
        clusterFriends.forEach(f => processed.add(f.id));
      } else {
        // Single friend marker
        clustered.push({
          id: friend.id,
          latitude: friend.latitude,
          longitude: friend.longitude,
          friends: [friend],
          count: 1,
        });
        processed.add(friend.id);
      }
    });

    return clustered;
  }, [friends, region, clusterRadius, minClusterSize, maxZoom]);

  const getClusterColor = useCallback((cluster: ClusterData) => {
    if (cluster.count === 1) {
      const friend = cluster.friends[0];
      switch (friend.status) {
        case 'online':
          return theme.success;
        case 'offline':
          return theme.textSecondary;
        case 'ghost':
          return theme.secondary;
        default:
          return theme.primary;
      }
    }

    // Multi-friend cluster - determine dominant status
    const statusCounts = cluster.friends.reduce((acc, friend) => {
      acc[friend.status] = (acc[friend.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantStatus = Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    switch (dominantStatus) {
      case 'online':
        return theme.success;
      case 'ghost':
        return theme.secondary;
      case 'offline':
        return theme.textSecondary;
      default:
        return theme.primary;
    }
  }, [theme]);

  const getClusterSize = useCallback((count: number) => {
    if (count === 1) return 40;
    if (count <= 5) return 50;
    if (count <= 10) return 60;
    if (count <= 20) return 70;
    return 80;
  }, []);

  const getClusterTextSize = useCallback((count: number) => {
    if (count === 1) return 14;
    if (count <= 5) return 16;
    if (count <= 10) return 18;
    return 20;
  }, []);

  const ClusterMarker = React.memo(({ cluster }: { cluster: ClusterData }) => {
    const size = getClusterSize(cluster.count);
    const textSize = getClusterTextSize(cluster.count);
    const color = getClusterColor(cluster);

    const handlePress = useCallback(() => {
      if (cluster.count === 1) {
        onFriendPress?.(cluster.friends[0]);
      } else {
        onClusterPress?.(cluster);
      }
    }, [cluster]);

    if (cluster.count === 1) {
      const friend = cluster.friends[0];
      return (
        <Marker
          coordinate={{
            latitude: cluster.latitude,
            longitude: cluster.longitude,
          }}
          onPress={handlePress}
          tracksViewChanges={false} // Optimize performance
        >
          <View style={[
            styles.singleMarker,
            {
              backgroundColor: color,
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: theme.surface,
            }
          ]}>
            <Text style={[
              styles.singleMarkerText, 
              { 
                color: theme.surface,
                fontSize: textSize,
              }
            ]}>
              {friend.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </Marker>
      );
    }

    return (
      <Marker
        coordinate={{
          latitude: cluster.latitude,
          longitude: cluster.longitude,
        }}
        onPress={handlePress}
        tracksViewChanges={false} // Optimize performance
      >
        <View style={[
          styles.clusterMarker,
          {
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.surface,
          }
        ]}>
          <Text style={[
            styles.clusterText, 
            { 
              color: theme.surface,
              fontSize: textSize,
            }
          ]}>
            {cluster.count}
          </Text>
          
          {/* Status indicators for cluster */}
          <View style={styles.statusIndicators}>
            {cluster.friends.slice(0, 3).map((friend, index) => (
              <View
                key={friend.id}
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: getClusterColor({ ...cluster, friends: [friend], count: 1 }),
                    left: index * 4,
                  }
                ]}
              />
            ))}
          </View>
        </View>
      </Marker>
    );
  });

  return (
    <>
      {clusters.map(cluster => (
        <ClusterMarker key={cluster.id} cluster={cluster} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  singleMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 3,
  },
  singleMarkerText: {
    fontFamily: 'Inter-Bold',
  },
  clusterMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    position: 'relative',
  },
  clusterText: {
    fontFamily: 'Inter-Bold',
  },
  statusIndicators: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -6,
    flexDirection: 'row',
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
});