import { Tabs } from 'expo-router';
import { MapPin, Users, Settings, Home, Compass } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  const TabIcon = ({ 
    icon: Icon, 
    color, 
    size, 
    focused, 
    label 
  }: {
    icon: any;
    color: string;
    size: number;
    focused: boolean;
    label: string;
  }) => (
    <View style={styles.tabIconContainer}>
      {focused && (
        <LinearGradient
          colors={[`${theme.primary}20`, `${theme.secondary}20`]}
          style={styles.tabIconBackground}
        />
      )}
      <Icon 
        color={focused ? theme.primary : color} 
        size={focused ? size + 2 : size}
        strokeWidth={focused ? 2.5 : 2}
      />
      <Text 
        style={[
          styles.tabLabel,
          { 
            color: focused ? theme.primary : color,
            fontFamily: focused ? 'Inter-SemiBold' : 'Inter-Regular',
          }
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? `${theme.surface}F0` : `${theme.surface}F5`,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 12,
          height: Platform.OS === 'ios' ? 88 : 72,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon
              icon={Compass}
              color={color}
              size={size}
              focused={focused}
              label="Explorer"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon
              icon={Users}
              color={color}
              size={size}
              focused={focused}
              label={t('friends')}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon
              icon={Settings}
              color={color}
              size={size}
              focused={focused}
              label={t('profile')}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
    paddingHorizontal: 12,
    minWidth: 60,
  },
  tabIconBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});