import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Plus, 
  MoreVertical,
  Phone,
  Video,
  MapPin,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react-native';
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
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user, friends } = useDemoAuth();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    initializeConversations();
    
    // Animate in
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
  }, [friends]);

  const initializeConversations = () => {
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
    }));

    // Sort by last message time
    demoConversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
    setConversations(demoConversations);
  };

  const getDemoMessage = (index: number) => {
    const messages = [
      "Salut ! Tu es où en ce moment ? 📍",
      "On se retrouve au café habituel ? ☕",
      "J'arrive dans 10 minutes ! 🚗",
      "Super soirée hier ! Merci 🎉",
      "Tu as vu le nouveau restaurant ? 🍕",
      "Rendez-vous à 18h ? ⏰",
    ];
    return messages[index % messages.length];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return theme.success;
      case 'offline':
        return theme.textSecondary;
      case 'ghost':
        return theme.secondary;
      default:
        return theme.primary;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) {
      return 'À l\'instant';
    } else if (hours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.friendName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ConversationCard = ({ item, index }: { item: Conversation; index: number }) => {
    const cardAnim = new Animated.Value(0);

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
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
          onPress={() => router.push(`/chat/${item.friendId}` as any)}
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
                  <Text 
                    style={[
                      styles.lastMessage, 
                      { color: item.unreadCount > 0 ? theme.text : theme.textSecondary }
                    ]} 
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
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
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
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
        Aucune conversation
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Commencez à discuter avec vos amis pour voir vos conversations ici
      </Text>
    </Animated.View>
  );

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
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.headerButton, { backgroundColor: theme.surface }]}
                onPress={() => setIsSearching(!isSearching)}
              >
                <Search color={theme.text} size={20} />
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
      {isSearching && (
        <Animated.View 
          style={[
            styles.searchContainer,
            { backgroundColor: theme.surface }
          ]}
        >
          <Search color={theme.textSecondary} size={20} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Rechercher une conversation..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearButton, { color: theme.primary }]}>
                Effacer
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Conversations List */}
      <View style={styles.content}>
        {filteredConversations.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={filteredConversations}
            renderItem={({ item, index }) => <ConversationCard item={item} index={index} />}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
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
    marginBottom: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  clearButton: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
    marginRight: 8,
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