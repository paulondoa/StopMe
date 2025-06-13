import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User, Friend } from '@/types/database';

interface FriendWithUser extends Friend {
  friend_user: User;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithUser[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchFriends();
    fetchPendingRequests();
    fetchSentRequests();

    // Subscribe to friend changes
    const subscription = supabase
      .channel('friends_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friends',
          filter: `user_id=eq.${user.id}` 
        }, 
        () => {
          fetchFriends();
          fetchPendingRequests();
          fetchSentRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend_user:users!friends_friend_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching friends:', error);
    } else {
      setFriends(data as FriendWithUser[]);
    }
    setLoading(false);
  };

  const fetchPendingRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend_user:users!friends_user_id_fkey(*)
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending requests:', error);
    } else {
      setPendingRequests(data as FriendWithUser[]);
    }
  };

  const fetchSentRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend_user:users!friends_friend_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching sent requests:', error);
    } else {
      setSentRequests(data as FriendWithUser[]);
    }
  };

  const sendFriendRequest = async (friendEmail: string) => {
    if (!user) return { error: 'User not authenticated' };

    // First, find the user by email
    const { data: friendUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', friendEmail)
      .single();

    if (userError || !friendUser) {
      return { error: 'User not found' };
    }

    if (friendUser.id === user.id) {
      return { error: 'Cannot add yourself as a friend' };
    }

    // Check if friendship already exists
    const { data: existingFriend, error: existingError } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendUser.id}),and(user_id.eq.${friendUser.id},friend_id.eq.${user.id})`)
      .single();

    if (existingFriend) {
      return { error: 'Friend request already exists' };
    }

    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: user.id,
        friend_id: friendUser.id,
        status: 'pending',
      });

    if (error) {
      return { error: error.message };
    }

    await fetchSentRequests();
    return { error: null };
  };

  const acceptFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      return { error: error.message };
    }

    await fetchFriends();
    await fetchPendingRequests();
    return { error: null };
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId);

    if (error) {
      return { error: error.message };
    }

    await fetchPendingRequests();
    return { error: null };
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      return { error: error.message };
    }

    await fetchFriends();
    return { error: null };
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  };
}