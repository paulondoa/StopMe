import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ArrowLeft, 
  Send, 
  Phone, 
  Video, 
  MapPin, 
  Camera, 
  Mic, 
  Plus, 
  Smile, 
  Check, 
  CheckCheck,
  MoreHorizontal,
  Info
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

export default function ChatScreen() {
  const router = useRouter();
  const { friendId } = useLocalSearchParams();
  const { user, friends } = useDemoAuth();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [friend, setFriend] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const inputAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(0.8)).current;

  // Memoized friend data
  const friendData = useMemo(() => 
    friends.find(f => f.id === friendId), 
    [friends, friendId]
  );

  useEffect(() => {
    if (friendData) {
      setFriend(friendData);
      initializeChat();
    }
  }, [friendData]);

  useEffect(() => {
    // Animate input when text changes
    Animated.spring(inputAnim, {
      toValue: inputText.length > 0 ? 1 : 0,
      useNativeDriver: true,
    }).start();

    // Animate send button
    Animated.spring(sendButtonScale, {
      toValue: inputText.trim().length > 0 ? 1 : 0.8,
      useNativeDriver: true,
    }).start();
  }, [inputText]);

  const initializeChat = useCallback(async () => {
    setLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (friendData) {
      generateDemoMessages(friendData);
      startAnimations();
    }
    
    setLoading(false);
  }, [friendData]);

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

  const generateDemoMessages = useCallback((friend: any) => {
    const demoMessages: Message[] = [
      {
        id: '1',
        text: `Salut ${user?.name?.split(' ')[0]} ! Comment ça va ? 😊`,
        timestamp: new Date(Date.now() - 3600000),
        senderId: friend.id,
        senderName: friend.name,
        type: 'text',
        status: 'read',
      },
      {
        id: '2',
        text: 'Salut ! Ça va bien merci, et toi ?',
        timestamp: new Date(Date.now() - 3500000),
        senderId: user?.id || '',
        senderName: user?.name || '',
        type: 'text',
        status: 'read',
      },
      {
        id: '3',
        text: 'Super ! Tu es libre ce soir pour aller au cinéma ? 🎬',
        timestamp: new Date(Date.now() - 3400000),
        senderId: friend.id,
        senderName: friend.name,
        type: 'text',
        status: 'read',
      },
      {
        id: '4',
        text: 'Excellente idée ! Quel film tu veux voir ?',
        timestamp: new Date(Date.now() - 3300000),
        senderId: user?.id || '',
        senderName: user?.name || '',
        type: 'text',
        status: 'read',
      },
      {
        id: '5',
        text: 'Je pensais au nouveau film d\'action qui vient de sortir 🍿',
        timestamp: new Date(Date.now() - 1800000),
        senderId: friend.id,
        senderName: friend.name,
        type: 'text',
        status: 'delivered',
      },
    ];

    setMessages(demoMessages);
  }, [user]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !user || !friend || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date(),
      senderId: user.id,
      senderName: user.name,
      type: 'text',
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Simulate message sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update message status to delivered
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );

      // Simulate friend typing and response
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const responses = [
            'C\'est parfait ! 👍',
            'Super idée ! 😄',
            'J\'ai hâte ! ⭐',
            'Génial ! À tout à l\'heure 🚀',
            'Parfait, on se retrouve là-bas !',
            'Merci pour l\'info ! 🙏',
          ];
          
          const response: Message = {
            id: (Date.now() + 1).toString(),
            text: responses[Math.floor(Math.random() * responses.length)],
            timestamp: new Date(),
            senderId: friend.id,
            senderName: friend.name,
            type: 'text',
            status: 'sent',
          };
          
          setMessages(prev => [...prev, response]);
          
          // Scroll to bottom after response
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, 2000);
      }, 1500);

    } catch (error) {
      // Handle error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  }, [inputText, user, friend, sending]);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing indicator
    }, 1000);
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
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const MessageBubble = React.memo(({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.id;
    const bubbleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(bubbleAnim, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 50, 500),
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.friendMessage,
          {
            opacity: bubbleAnim,
            transform: [
              {
                translateY: bubbleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage 
              ? [styles.ownBubble, { backgroundColor: theme.primary }]
              : [styles.friendBubble, { backgroundColor: theme.surface }]
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isOwnMessage ? theme.surface : theme.text }
            ]}
          >
            {item.text}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                { color: isOwnMessage ? `${theme.surface}CC` : theme.textSecondary }
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
            
            {isOwnMessage && (
              <View style={styles.messageStatus}>
                {item.status === 'sending' && (
                  <ActivityIndicator size="small" color={`${theme.surface}CC`} />
                )}
                {item.status === 'sent' && (
                  <Check color={`${theme.surface}CC`} size={14} />
                )}
                {(item.status === 'delivered' || item.status === 'read') && (
                  <CheckCheck 
                    color={item.status === 'read' ? theme.success : `${theme.surface}CC`} 
                    size={14} 
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  });

  const TypingIndicator = React.memo(() => {
    const typingAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isTyping) {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(typingAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(typingAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        animation.start();
        return () => animation.stop();
      }
    }, [isTyping]);

    if (!isTyping) return null;

    return (
      <Animated.View 
        style={[
          styles.typingContainer,
          { opacity: fadeAnim }
        ]}
      >
        <View style={[styles.typingBubble, { backgroundColor: theme.surface }]}>
          <View style={styles.typingDots}>
            <Animated.View 
              style={[
                styles.typingDot, 
                { 
                  backgroundColor: theme.textSecondary,
                  opacity: typingAnim,
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.typingDot, 
                { 
                  backgroundColor: theme.textSecondary,
                  opacity: typingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.typingDot, 
                { 
                  backgroundColor: theme.textSecondary,
                  opacity: typingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }
              ]} 
            />
          </View>
        </View>
      </Animated.View>
    );
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Chargement de la conversation...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!friend) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>Ami introuvable</Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.surface }]}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? [theme.surface, theme.background] : [`${theme.primary}10`, theme.background]}
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
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color={theme.text} size={24} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.friendInfo} onPress={() => {}}>
              <View style={styles.friendAvatar}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.avatarText, { color: theme.surface }]}>
                    {friend.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View 
                  style={[
                    styles.statusIndicator, 
                    { backgroundColor: getStatusColor(friend.status) }
                  ]} 
                />
              </View>
              
              <View style={styles.friendDetails}>
                <Text style={[styles.friendName, { color: theme.text }]}>
                  {friend.name}
                </Text>
                <Text style={[styles.friendStatus, { color: theme.textSecondary }]}>
                  {isTyping ? 'En train d\'écrire...' :
                   friend.status === 'online' ? 'En ligne' : 
                   friend.status === 'ghost' ? 'Mode fantôme' : 'Hors ligne'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: `${theme.success}20` }]}
                onPress={() => Alert.alert('Appel', 'Fonctionnalité d\'appel à venir')}
              >
                <Phone color={theme.success} size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: `${theme.primary}20` }]}
                onPress={() => Alert.alert('Vidéo', 'Fonctionnalité vidéo à venir')}
              >
                <Video color={theme.primary} size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: `${theme.textSecondary}20` }]}
                onPress={() => {}}
              >
                <MoreHorizontal color={theme.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item, index }) => <MessageBubble item={item} index={index} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={20}
          windowSize={10}
          initialNumToRender={15}
        />
        
        <TypingIndicator />
      </View>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <LinearGradient
          colors={isDark ? [theme.background, theme.surface] : [theme.background, `${theme.primary}05`]}
          style={styles.inputGradient}
        >
          <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={styles.inputAction}>
              <Plus color={theme.textSecondary} size={24} />
            </TouchableOpacity>
            
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: theme.text }]}
              placeholder="Tapez votre message..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            
            <TouchableOpacity style={styles.inputAction}>
              <Smile color={theme.textSecondary} size={24} />
            </TouchableOpacity>
            
            <Animated.View
              style={[
                styles.sendButtonContainer,
                {
                  transform: [{ scale: sendButtonScale }],
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { 
                    backgroundColor: inputText.trim() ? theme.primary : theme.textSecondary,
                  }
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={theme.surface} />
                ) : (
                  <Send color={theme.surface} size={20} />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  headerGradient: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerBackButton: {
    padding: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  friendAvatar: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'white',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  friendMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ownBubble: {
    borderBottomRightRadius: 6,
  },
  friendBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  messageStatus: {
    marginLeft: 4,
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  typingBubble: {
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputContainer: {
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
  },
  inputGradient: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputAction: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButtonContainer: {
    marginLeft: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});