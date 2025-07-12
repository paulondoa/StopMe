import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserPlus, Check, X, Search, Users, MessageCircle, MapPin, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function FriendsScreen() {
  const router = useRouter();
  const { friends } = useDemoAuth();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  
  const [pendingRequests] = useState([]);
  const [sentRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent'>('friends');

  // Animations
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  React.useEffect(() => {
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

  const handleSendRequest = async () => {
    if (!searchEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email');
      return;
    }

    Alert.alert('Mode Démo', 'Les demandes d\'amis sont simulées en mode démo');
    setSearchEmail('');
  };

  const handleAcceptRequest = async (requestId: string) => {
    Alert.alert('Mode Démo', 'Ceci est une démo - les demandes sont simulées');
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert('Mode Démo', 'Ceci est une démo - les demandes sont simulées');
  };

  const handleRemoveFriend = (friendshipId: string, friendName: string) => {
    Alert.alert(
      'Supprimer l\'ami',
      `Êtes-vous sûr de vouloir supprimer ${friendName} de vos amis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Mode Démo', 'Ceci est une démo - la suppression d\'ami est simulée');
          },
        },
      ]
    );
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

  const getStatusText = (status: string, lastSeen: string) => {
    switch (status) {
      case 'online':
        return 'En ligne maintenant';
      case 'ghost':
        return 'Mode fantôme';
      default:
        return `Vu ${new Date(lastSeen).toLocaleDateString()}`;
    }
  };

  const FriendCard = ({ item, index }: { item: any; index: number }) => {
    const cardAnim = new Animated.Value(0);

    React.useEffect(() => {
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
          styles.friendCard,
          { 
            backgroundColor: theme.surface,
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
        <LinearGradient
          colors={isDark ? [`${theme.primary}10`, `${theme.secondary}10`] : [`${theme.primary}05`, `${theme.secondary}05`]}
          style={styles.cardGradient}
        >
          <View style={styles.friendInfo}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={[styles.avatarText, { color: theme.surface }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View 
                style={[
                  styles.statusIndicator, 
                  { backgroundColor: getStatusColor(item.status) }
                ]} 
              />
            </View>
            
            <View style={styles.friendDetails}>
              <Text style={[styles.friendName, { color: theme.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.friendEmail, { color: theme.textSecondary }]}>
                {item.email}
              </Text>
              <View style={styles.statusContainer}>
                <Clock color={theme.textSecondary} size={12} />
                <Text style={[styles.friendStatus, { color: theme.textSecondary }]}>
                  {getStatusText(item.status, item.last_seen)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.friendActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${theme.primary}20` }]}
              onPress={() => router.push(`/chat/${item.id}` as any)}
            >
              <MessageCircle color={theme.primary} size={18} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${theme.accent}20` }]}
              onPress={() => {}}
            >
              <MapPin color={theme.accent} size={18} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${theme.error}20` }]}
              onPress={() => handleRemoveFriend(item.id, item.name)}
            >
              <X color={theme.error} size={18} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const TabButton = ({ 
    title, 
    count, 
    isActive, 
    onPress 
  }: {
    title: string;
    count: number;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.tab,
        isActive && [styles.activeTab, { backgroundColor: theme.primary }]
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.tabText,
        { color: isActive ? theme.surface : theme.textSecondary },
        isActive && styles.activeTabText
      ]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
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
          <Text style={[styles.title, { color: theme.text }]}>
            Mes Amis
          </Text>
          <View style={styles.headerStats}>
            <View style={[styles.statBadge, { backgroundColor: `${theme.success}20` }]}>
              <Text style={[styles.statText, { color: theme.success }]}>
                {friends.filter(f => f.status === 'online').length} en ligne
              </Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Search Section */}
      <Animated.View 
        style={[
          styles.searchSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
          <Search color={theme.textSecondary} size={20} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Rechercher par email..."
            placeholderTextColor={theme.textSecondary}
            value={searchEmail}
            onChangeText={setSearchEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.primary }]} 
            onPress={handleSendRequest}
          >
            <UserPlus color={theme.surface} size={20} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Tabs */}
      <Animated.View 
        style={[
          styles.tabContainer,
          { 
            backgroundColor: theme.surface,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TabButton
          title="Amis"
          count={friends.length}
          isActive={activeTab === 'friends'}
          onPress={() => setActiveTab('friends')}
        />
        <TabButton
          title="Demandes"
          count={pendingRequests.length}
          isActive={activeTab === 'pending'}
          onPress={() => setActiveTab('pending')}
        />
        <TabButton
          title="Envoyées"
          count={sentRequests.length}
          isActive={activeTab === 'sent'}
          onPress={() => setActiveTab('sent')}
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
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
                  <Users color={theme.primary} size={48} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  Aucun ami pour le moment
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  Ajoutez des amis en saisissant leur adresse email ci-dessus
                </Text>
              </Animated.View>
            ) : (
              <FlatList
                data={friends}
                renderItem={({ item, index }) => <FriendCard item={item} index={index} />}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </>
        )}

        {activeTab === 'pending' && (
          <Animated.View 
            style={[
              styles.emptyState,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aucune demande en attente
            </Text>
          </Animated.View>
        )}

        {activeTab === 'sent' && (
          <Animated.View 
            style={[
              styles.emptyState,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aucune demande envoyée
            </Text>
          </Animated.View>
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
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  addButton: {
    padding: 12,
    borderRadius: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  activeTabText: {
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listContainer: {
    paddingBottom: 100,
  },
  friendCard: {
    borderRadius: 20,
    marginBottom: 16,
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
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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