import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { isRTL, t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('auth.missingFields'), t('auth.loginRequiredFields'));
      return;
    }

    try {
      setLoading(true);
      await login(email.trim().toLowerCase(), password);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || t('auth.invalidCredentials');
      Alert.alert(t('auth.signInFailed'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Ionicons name="medkit" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{isRTL ? 'صيدلية ميريلاند' : 'Maryland Pharmacy'}</Text>
          <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>{t('auth.emailAddress')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.secondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isRTL && styles.textRTL]}
              placeholder={t('auth.enterEmail')}
              placeholderTextColor={Colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.inputLabel}>{t('auth.password')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.secondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isRTL && styles.textRTL]}
              placeholder={t('auth.enterPassword')}
              placeholderTextColor={Colors.muted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={10}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.secondary}
              />
            </Pressable>
          </View>

          <Pressable
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.footerLink}>{t('auth.forgotPasswordQuestion')}</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>{t('common.signIn')}</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>{t('auth.createAccount')}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.backButtonText}>{t('auth.continueAsGuest')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  textRTL: { textAlign: 'right' },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: Colors.pageBase,
    justifyContent: 'center',
    padding: 24,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.secondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pageBase,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.ink,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  buttonDisabled: {
    backgroundColor: Colors.secondary,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: Colors.secondary,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
});
