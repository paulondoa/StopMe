import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Location, User } from '@/types/database';

interface FriendLocation extends Location {
  user: User;
}

export function useFriendLocations() {
  const { user } = useAuth();
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchFriendLocations();

    // Subscribe to location changes
    const subscription = supabase
      .channel('friend_locations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'locations'
        }, 
        () => {
          fetchFriendLocations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchFriendLocations = async () => {
    if (!user) return;

    try {
      // Get accepted friends
      const { data: friends, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        return;
      }

      if (!friends || friends.length === 0) {
        setFriendLocations([]);
        setLoading(false);
        return;
      }

      const friendIds = friends.map(f => f.friend_id);

      // Get locations for visible friends
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select(`
          *,
          user:users(*)
        `)
        .in('user_id', friendIds)
        .not('user.visible', 'eq', false)
        .not('user.status', 'eq', 'ghost');

      if (locationsError) {
        console.error('Error fetching friend locations:', locationsError);
      } else {
        // Filter out locations older than 1 hour
        const recentLocations = (locations as FriendLocation[]).filter(location => {
          const locationTime = new Date(location.updated_at).getTime();
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          return locationTime > oneHourAgo;
        });

        setFriendLocations(recentLocations);
      }
    } catch (error) {
      console.error('Error in fetchFriendLocations:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    friendLocations,
    loading,
    refreshLocations: fetchFriendLocations,
  };
}