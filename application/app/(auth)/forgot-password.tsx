import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import authApi from '../../src/api/auth';
import { useLanguage } from '../../src/context/LanguageContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isRTL, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const sendResetLink = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert(t('auth.emailRequired'), t('auth.resetEmailRequired'));
      return;
    }

    try {
      setLoading(true);
      await authApi.forgotPassword(normalizedEmail);
      setEmail('');
      Alert.alert(
        t('auth.checkEmail'),
        t('auth.resetEmailSent'),
        [{ text: t('common.ok'), onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert(
        t('auth.unableToSendReset'),
        error?.response?.data?.message || t('auth.connectionRetry')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.iconBadge}>
          <Ionicons name="key-outline" size={30} color={Colors.primary} />
        </View>
        <Text style={styles.title}>{t('auth.forgotPasswordQuestion')}</Text>
        <Text style={styles.subtitle}>{t('auth.forgotSubtitle')}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>{t('auth.emailAddress')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.secondary} />
            <TextInput
              style={[styles.input, isRTL && { textAlign: 'right' }]}
              placeholder={t('auth.enterEmail')}
              placeholderTextColor={Colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              returnKeyType="send"
              onSubmitEditing={sendResetLink}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={sendResetLink}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>{t('auth.sendResetLink')}</Text>
            )}
          </Pressable>
        </View>

        <Pressable style={styles.backLink} onPress={() => router.replace('/(auth)/login')}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={17} color={Colors.primary} />
          <Text style={styles.backLinkText}>{t('auth.backToSignIn')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.pageBase },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  iconBadge: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    marginBottom: 18,
  },
  title: { color: Colors.ink, fontSize: 25, fontWeight: '900', textAlign: 'center' },
  subtitle: {
    color: Colors.secondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  label: { color: Colors.ink, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  inputWrapper: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.pageBase,
  },
  input: { flex: 1, paddingVertical: 12, color: Colors.ink, fontSize: 14 },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: Colors.surface, fontSize: 15, fontWeight: '800' },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 22,
    padding: 8,
  },
  backLinkText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
});
