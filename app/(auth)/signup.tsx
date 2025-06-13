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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join SpotMe and stay connected</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff color="#9CA3AF" size={20} />
                  ) : (
                    <Eye color="#9CA3AF" size={20} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>
                Password must be at least 6 characters
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signUpButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/signin')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    padding: 16,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#F9FAFB',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  eyeButton: {
    padding: 16,
  },
  passwordHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  signUpButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
});