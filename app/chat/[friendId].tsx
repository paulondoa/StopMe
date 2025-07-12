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
  Alert,
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
  MoreVertical,
  MapPin,
  Camera,
  Mic,
  Plus,
  Smile,
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

export default function ChatScreen() {
  const router = useRouter();
  const { friendId } = useLocalSearchParams();
  const { user, friends } = useDemoAuth();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [friend, setFriend] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);
  const inputAnim = new Animated.Value(0);

  useEffect(() => {
    initializeChat();
    
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
  }, [friendId]);

  useEffect(() => {
    // Animate input when text changes
    Animated.spring(inputAnim, {
      toValue: inputText.length > 0 ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [inputText]);

  const initializeChat = () => {
    // Find friend
    const currentFriend = friends.find(f => f.id === friendId);
    if (currentFriend) {
      setFriend(currentFriend);
      generateDemoMessages(currentFriend);
    }
  };

  const generateDemoMessages = (friend: any) => {
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
  };

  const sendMessage = () => {
    if (!inputText.trim() || !user || !friend) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date(),
      senderId: user.id,
      senderName: user.name,
      type: 'text',
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    }, 1000);

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
      }, 2000);
    }, 1500);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const MessageBubble = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.id;
    const bubbleAnim = new Animated.Value(0);

    useEffect(() => {
      Animated.timing(bubbleAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
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
                  <View style={[styles.statusDot, { backgroundColor: `${theme.surface}60` }]} />
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
  };

  const TypingIndicator = () => (
    <Animated.View style={[styles.typingContainer, { opacity: fadeAnim }]}>
      <View style={[styles.typingBubble, { backgroundColor: theme.surface }]}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
          <Animated.View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
          <Animated.View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
        </View>
      </View>
    </Animated.View>
  );

  if (!friend) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: theme.text }}>Ami introuvable</Text>
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
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft color={theme.text} size={24} />
            </TouchableOpacity>
            
            <View style={styles.friendInfo}>
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
                  {friend.status === 'online' ? 'En ligne' : 
                   friend.status === 'ghost' ? 'Mode fantôme' : 'Hors ligne'}
                </Text>
              </View>
            </View>
            
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
        />
        
        {isTyping && <TypingIndicator />}
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
              style={[styles.textInput, { color: theme.text }]}
              placeholder="Tapez votre message..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity style={styles.inputAction}>
              <Smile color={theme.textSecondary} size={24} />
            </TouchableOpacity>
            
            <Animated.View
              style={[
                styles.sendButtonContainer,
                {
                  transform: [
                    {
                      scale: inputAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
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
                disabled={!inputText.trim()}
              >
                <Send color={theme.surface} size={20} />
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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