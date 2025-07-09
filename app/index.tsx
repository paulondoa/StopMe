import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { user, loading } = useDemoAuth();
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/demo');
      }
    }
  }, [user, loading]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}