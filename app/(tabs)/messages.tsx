import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, Search, Plus, Clock, Check, CheckCheck, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  senderId: string;
  senderName: string;
  type: 'text' | 'location' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  friendId: string;
  friendName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  status: 'online' | 'offline' | 'ghost';
  isTyping?: boolean;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user, friends } = useDemoAuth();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refs
  const searchInputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  // Memoized filtered conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    return conversations.filter(conv =>
      conv.friendName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  // Memoized stats
  const stats = useMemo(() => ({
    total: conversations.length,
    unread: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
    online: conversations.filter(conv => conv.isOnline).length,
  }), [conversations]);

  useEffect(() => {
    initializeConversations();
    startAnimations();
  }, [friends]);

  const initializeConversations = useCallback(async () => {
    setLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Create demo conversations from friends
    const demoConversations: Conversation[] = friends.map((friend, index) => ({
      id: `conv-${friend.id}`,
      friendId: friend.id,
      friendName: friend.name,
      lastMessage: getDemoMessage(index),
      lastMessageTime: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
      unreadCount: Math.floor(Math.random() * 5),
      isOnline: friend.status === 'online',
      status: friend.status,
      isTyping: Math.random() > 0.8 && friend.status === 'online', // 20% chance of typing
    }));

    // Sort by last message time
    demoConversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
    setConversations(demoConversations);
    setLoading(false);
  }, [friends]);

  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getDemoMessage = useCallback((index: number) => {
    const messages = [
      "Salut ! Tu es où en ce moment ? 📍",
      "On se retrouve au café habituel ? ☕",
      "J'arrive dans 10 minutes ! 🚗",
      "Super soirée hier ! Merci 🎉",
      "Tu as vu le nouveau restaurant ? 🍕",
      "Rendez-vous à 18h ? ⏰",
      "Comment ça va aujourd'hui ?",
      "Tu veux qu'on se voie ce weekend ?",
      "J'ai une surprise pour toi ! 🎁",
      "Merci pour ton aide hier 🙏",
    ];
    return messages[index % messages.length];
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const toggleSearch = useCallback(() => {
    const newSearching = !isSearching;
    setIsSearching(newSearching);
    
    Animated.timing(searchAnim, {
      toValue: newSearching ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (newSearching) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    } else {
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  }, [isSearching]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeConversations();
    setRefreshing(false);
  }, [initializeConversations]);

  const markAsRead = useCallback((conversationId: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'online': return theme.success;
      case 'offline': return theme.textSecondary;
      case 'ghost': return theme.secondary;
      default: return theme.primary;
    }
  }, [theme]);

  const formatTime = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes < 1 ? 'À l\'instant' : `${minutes}min`;
    } else if (hours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  }, []);

  const ConversationCard = React.memo(({ item, index }: { item: Conversation; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    const swipeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }, []);

    const handlePress = useCallback(() => {
      markAsRead(item.id);
      router.push(`/chat/${item.friendId}` as any);
    }, [item.id, item.friendId]);

    const handleLongPress = useCallback(() => {
      // Show action sheet or context menu
    }, []);

    return (
      <Animated.View
        style={[
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.conversationCard, { backgroundColor: theme.surface }]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={isDark ? [`${theme.primary}05`, `${theme.secondary}05`] : [`${theme.primary}02`, `${theme.secondary}02`]}
            style={styles.cardGradient}
          >
            <View style={styles.conversationContent}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.avatarText, { color: theme.surface }]}>
                    {item.friendName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View 
                  style={[
                    styles.statusIndicator, 
                    { backgroundColor: getStatusColor(item.status) }
                  ]} 
                />
              </View>
              
              <View style={styles.messageInfo}>
                <View style={styles.messageHeader}>
                  <Text style={[styles.friendName, { color: theme.text }]} numberOfLines={1}>
                    {item.friendName}
                  </Text>
                  <Text style={[styles.messageTime, { color: theme.textSecondary }]}>
                    {formatTime(item.lastMessageTime)}
                  </Text>
                </View>
                
                <View style={styles.messagePreview}>
                  <View style={styles.messageTextContainer}>
                    {item.isTyping ? (
                      <View style={styles.typingIndicator}>
                        <Text style={[styles.typingText, { color: theme.primary }]}>
                          En train d'écrire...
                        </Text>
                        <View style={styles.typingDots}>
                          <Animated.View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
                          <Animated.View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
                          <Animated.View style={[styles.typingDot, { backgroundColor: theme.primary }]} />
                        </View>
                      </View>
                    ) : (
                      <Text 
                        style={[
                          styles.lastMessage, 
                          { 
                            color: item.unreadCount > 0 ? theme.text : theme.textSecondary,
                            fontFamily: item.unreadCount > 0 ? 'Inter-SemiBold' : 'Inter-Regular'
                          }
                        ]} 
                        numberOfLines={1}
                      >
                        {item.lastMessage}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.messageActions}>
                    {item.unreadCount > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.unreadCount, { color: theme.surface }]}>
                          {item.unreadCount > 9 ? '9+' : item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  const EmptyState = React.memo(() => (
    <Animated.View 
      style={[
        styles.emptyState,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}20` }]}>
        <MessageCircle color={theme.primary} size={48} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {searchQuery 
          ? 'Essayez avec d\'autres mots-clés'
          : 'Commencez à discuter avec vos amis pour voir vos conversations ici'
        }
      </Text>
    </Animated.View>
  ));

  const SearchBar = React.memo(() => (
    <Animated.View 
      style={[
        styles.searchContainer,
        { 
          backgroundColor: theme.surface,
          height: searchAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 60],
          }),
          opacity: searchAnim,
        }
      ]}
    >
      <Search color={theme.textSecondary} size={20} />
      <TextInput
        ref={searchInputRef}
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Rechercher une conversation..."
        placeholderTextColor={theme.textSecondary}
        value={searchQuery}
        onChangeText={handleSearch}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => handleSearch('')}>
          <X color={theme.textSecondary} size={20} />
        </TouchableOpacity>
      )}
    </Animated.View>
  ));

  const StatsBar = React.memo(() => (
    <View style={[styles.statsBar, { backgroundColor: `${theme.primary}10` }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.total}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Conversations</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.success }]}>{stats.online}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>En ligne</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.error }]}>{stats.unread}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Non lus</Text>
      </View>
    </View>
  ));

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Chargement des conversations...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? [theme.background, 'transparent'] : [`${theme.primary}10`, 'transparent']}
        style={styles.headerGradient}
      >
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.title, { color: theme.text }]}>
                Messages
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {stats.total} conversation{stats.total !== 1 ? 's' : ''}
                {stats.unread > 0 && ` • ${stats.unread} non lu${stats.unread !== 1 ? 's' : ''}`}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[
                  styles.headerButton, 
                  { backgroundColor: isSearching ? theme.primary : theme.surface }
                ]}
                onPress={toggleSearch}
              >
                <Search color={isSearching ? theme.surface : theme.text} size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: theme.primary }]}
                onPress={() => {}}
              >
                <Plus color={theme.surface} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Search Bar */}
      <SearchBar />

      {/* Stats Bar */}
      {!isSearching && <StatsBar />}

      {/* Conversations List */}
      <View style={styles.content}>
        {filteredConversations.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            ref={listRef}
            data={filteredConversations}
            renderItem={({ item, index }) => <ConversationCard item={item} index={index} />}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={8}
            getItemLayout={(data, index) => ({
              length: 88,
              offset: 88 * index,
              index,
            })}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 12,
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listContainer: {
    paddingBottom: 100,
  },
  conversationCard: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardGradient: {
    padding: 20,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'white',
  },
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  friendName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  messageActions: {
    alignItems: 'flex-end',
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
});