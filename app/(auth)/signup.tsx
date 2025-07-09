import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDemoAuth } from '@/contexts/DemoAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useDemoAuth();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError(t('fillAllFields'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await signUp(email, password, name);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const getInputStyle = (fieldName: string) => [
    styles.input,
    {
      backgroundColor: theme.surface,
      borderColor: focusedField === fieldName ? theme.primary : theme.border,
      color: theme.text,
    }
  ];

  const getPasswordStrength = () => {
    if (password.length === 0) return { strength: 0, color: theme.textSecondary, text: '' };
    if (password.length < 6) return { strength: 1, color: theme.error, text: 'Faible' };
    if (password.length < 8) return { strength: 2, color: theme.warning, text: 'Moyen' };
    return { strength: 3, color: theme.success, text: 'Fort' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : ['#F8FAFC', '#E2E8F0']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.surface }]}
              onPress={() => router.back()}
            >
              <ArrowLeft color={theme.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <View style={[styles.logoContainer, { backgroundColor: theme.secondary }]}>
                  <User color={theme.surface} size={32} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {t('createAccount')}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {t('joinSpotMe')}
                </Text>
              </View>

              {/* Error Message */}
              {error ? (
                <Animated.View style={[styles.errorContainer, { backgroundColor: `${theme.error}20`, borderColor: `${theme.error}40` }]}>
                  <AlertCircle color={theme.error} size={20} />
                  <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
                </Animated.View>
              ) : null}

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    {t('name')}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <User color={theme.textSecondary} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={getInputStyle('name')}
                      value={name}
                      onChangeText={setName}
                      placeholder={t('enterFullName')}
                      placeholderTextColor={theme.textSecondary}
                      autoComplete="name"
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    {t('email')}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Mail color={theme.textSecondary} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={getInputStyle('email')}
                      value={email}
                      onChangeText={setEmail}
                      placeholder={t('enterEmail')}
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    {t('password')}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <Lock color={theme.textSecondary} size={20} style={styles.inputIcon} />
                    <TextInput
                      style={[getInputStyle('password'), styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('createPassword')}
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff color={theme.textSecondary} size={20} />
                      ) : (
                        <Eye color={theme.textSecondary} size={20} />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <View style={styles.passwordStrength}>
                      <View style={styles.strengthBar}>
                        <View 
                          style={[
                            styles.strengthFill,
                            { 
                              width: `${(passwordStrength.strength / 3) * 100}%`,
                              backgroundColor: passwordStrength.color 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                        {passwordStrength.text}
                      </Text>
                    </View>
                  )}
                  
                  <Text style={[styles.passwordHint, { color: theme.textSecondary }]}>
                    {t('passwordMinLength')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.signUpButton,
                    { backgroundColor: theme.secondary },
                    loading && styles.buttonDisabled
                  ]}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[theme.secondary, theme.primary]}
                    style={styles.buttonGradient}
                  >
                    <Text style={[styles.signUpButtonText, { color: theme.surface }]}>
                      {loading ? t('creatingAccount') : t('createAccount')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  {t('alreadyHaveAccount')} 
                </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/signin')}>
                  <Text style={[styles.footerLink, { color: theme.primary }]}>
                    {t('signIn')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
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
  content: {
    padding: 24,
    paddingTop: 0,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  form: {
    gap: 24,
    marginBottom: 32,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 50,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    minWidth: 40,
  },
  passwordHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginLeft: 4,
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  footerLink: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});