import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
}

export default function MapClusters({
  friends,
  region,
  onClusterPress,
  onFriendPress,
  clusterRadius = 0.01, // Degrees
  minClusterSize = 2,
}: MapClustersProps) {
  const { theme } = useTheme();

  const clusters = useMemo(() => {
    if (friends.length === 0) return [];

    const clustered: ClusterData[] = [];
    const processed = new Set<string>();

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

        return distance <= clusterRadius;
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
  }, [friends, clusterRadius, minClusterSize]);

  const getClusterColor = (cluster: ClusterData) => {
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

    // Multi-friend cluster
    const onlineCount = cluster.friends.filter(f => f.status === 'online').length;
    if (onlineCount === cluster.count) {
      return theme.success;
    } else if (onlineCount > 0) {
      return theme.warning;
    } else {
      return theme.textSecondary;
    }
  };

  const getClusterSize = (count: number) => {
    if (count === 1) return 40;
    if (count <= 5) return 50;
    if (count <= 10) return 60;
    return 70;
  };

  const ClusterMarker = ({ cluster }: { cluster: ClusterData }) => {
    const size = getClusterSize(cluster.count);
    const color = getClusterColor(cluster);

    if (cluster.count === 1) {
      const friend = cluster.friends[0];
      return (
        <Marker
          coordinate={{
            latitude: cluster.latitude,
            longitude: cluster.longitude,
          }}
          onPress={() => onFriendPress?.(friend)}
        >
          <View style={[
            styles.singleMarker,
            {
              backgroundColor: color,
              width: size,
              height: size,
              borderRadius: size / 2,
            }
          ]}>
            <Text style={[styles.singleMarkerText, { color: theme.surface }]}>
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
        onPress={() => onClusterPress?.(cluster)}
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
          <Text style={[styles.clusterText, { color: theme.surface }]}>
            {cluster.count}
          </Text>
        </View>
      </Marker>
    );
  };

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
  },
  singleMarkerText: {
    fontSize: 16,
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
  },
  clusterText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});