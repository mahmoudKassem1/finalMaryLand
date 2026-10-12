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
  Modal,
  SectionList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';

// --- Data Preparation for SectionList Modal ---
const rawAreaJSON = [
  { district: "Montaza", district_ar: "المنتزه", areas: [{ en: "Miami", ar: "ميامي" }, { en: "Sidi Bishr", ar: "سيدي بشر" }, { en: "Victoria", ar: "فيكتوريا" }, { en: "Asafra", ar: "العصافرة" }, { en: "Mandara", ar: "المندرة" }, { en: "Maamoura", ar: "المعمورة" }, { en: "Abu Qir", ar: "أبو قير" }, { en: "El Awaid", ar: "العوايد" }] },
  { district: "Sharq (East)", district_ar: "شرق", areas: [{ en: "Smouha", ar: "سموحة" }, { en: "Sidi Gaber", ar: "سيدي جابر" }, { en: "San Stefano", ar: "سان ستيفانو" }, { en: "Glim", ar: "جليم" }, { en: "Stanley", ar: "ستانلي" }, { en: "Rushdy", ar: "رشدي" }, { en: "Zizinia", ar: "زيزينيا" }, { en: "Laurent", ar: "لوران" }, { en: "Fleming", ar: "فلمنج" }, { en: "Bacchus", ar: "باكوس" }, { en: "Bolkeley", ar: "بولكلي" }, { en: "Sporting", ar: "سبورتنج" }, { en: "Cleopatra", ar: "كليوباترا" }] },
  { district: "Wassat (Central)", district_ar: "وسط", areas: [{ en: "Raml Station", ar: "محطة الرمل" }, { en: "Shatby", ar: "الشاطبي" }, { en: "Azarita", ar: "الأزاريطة" }, { en: "Ibrahimia", ar: "الإبراهيمية" }, { en: "Camp Caesar", ar: "كامب شيزار" }, { en: "Kom El Dikka", ar: "كوم الدكة" }, { en: "Bab Sharq", ar: "باب شرق" }] },
  { district: "Gomrok", district_ar: "الجمرك", areas: [{ en: "Mansheya", ar: "المنشية" }, { en: "Bahary", ar: "بحري" }, { en: "Anfoushi", ar: "الأنفوشي" }, { en: "Ras El Tin", ar: "رأس التين" }] },
  { district: "Gharb (West)", district_ar: "غرب", areas: [{ en: "Karmouz", ar: "كرموز" }, { en: "Qabbary", ar: "القباري" }, { en: "Wardian", ar: "الورديان" }, { en: "Mina El Basal", ar: "مينا البصل" }] },
  { district: "Agamy", district_ar: "العجمي", areas: [{ en: "Hanoville", ar: "الهانوفيل" }, { en: "Bietash", ar: "البيطاش" }, { en: "Dekheila", ar: "الدخيلة" }, { en: "El Max", ar: "المكس" }] },
  { district: "Amreya", district_ar: "العامرية", areas: [{ en: "King Mariout", ar: "كينج مريوط" }, { en: "Borg El Arab", ar: "برج العرب" }, { en: "New Borg El Arab", ar: "برج العرب الجديدة" }, { en: "Merghem", ar: "مرغم" }] }
];

const areaSections = rawAreaJSON.map(d => ({
  title: `${d.district} (${d.district_ar})`,
  data: d.areas
}));

export default function RegisterScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const { isRTL, t } = useLanguage();

  // Personal Info State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Address State
  const [selectedArea, setSelectedArea] = useState<{en: string, ar: string} | null>(null);
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [apt, setApt] = useState('');
  const [isAreaModalVisible, setAreaModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);

  // Smart Validation for Egyptian Numbers
  const validatePhone = (val: string) => {
    setPhone(val);
    const isValid = /^01\d{9}$/.test(val);
    if (val.length > 0 && val.length < 11) {
      setPhoneError(t('auth.phoneDigits'));
    } else if (val.length === 11 && !isValid) {
      setPhoneError(t('auth.phonePrefix'));
    } else {
      setPhoneError('');
    }
  };

  const handleSignup = async () => {
    // 1. Validate Form
    if (!name.trim() || !email.trim() || !password || !phone.trim() || !street.trim() || !building.trim() || !selectedArea) {
      Alert.alert(t('auth.missingFields'), t('auth.fillRequired'));
      return;
    }
    if (!/^01\d{9}$/.test(phone)) {
      Alert.alert(t('auth.invalidPhone'), t('auth.invalidPhone'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('auth.weakPassword'), t('auth.passwordLength'));
      return;
    }

    try {
      setLoading(true);

      // 2. Format Address Payload to match MongoDB Schema
      const formattedStreet = `${selectedArea.en} - ${street.trim()}, Bldg: ${building.trim()}, Floor: ${floor.trim() || 'Ground'}`;
      
      const payload = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            phone: phone.trim(),
            // Send these directly at the root level for your backend validator
            city: 'Alexandria',
            street: formattedStreet,
            aptNumber: apt.trim() || 'N/A',
        };

      await signup(payload);

      Alert.alert(t('auth.accountCreated'), t('auth.addressSavedWelcome'), [
        {
          text: t('common.continue'),
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)');
          },
        },
      ]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || t('auth.registrationError');
      Alert.alert(t('auth.registrationFailed'), errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.pageBase }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.brandHeader}>
            <Text style={[styles.title, isRTL && styles.textRTL]}>{t('auth.createAccount')}</Text>
            <Text style={[styles.subtitle, isRTL && styles.textRTL]}>{t('auth.registerSubtitle')}</Text>
          </View>

          <View style={styles.card}>
            {/* --- PERSONAL INFO SECTION --- */}
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>١. {t('auth.personalInformation')}</Text>

            <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('auth.name')} *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={Colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isRTL && styles.textRTL]}
                placeholder={t('auth.name')}
                placeholderTextColor={Colors.muted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('auth.emailAddress')} *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isRTL && styles.textRTL]}
                placeholder="name@example.com"
                placeholderTextColor={Colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('auth.phone')} *</Text>
            <View style={[styles.inputWrapper, phoneError ? styles.inputErrorBorder : null]}>
              <Ionicons name="call-outline" size={20} color={phoneError ? '#DC2626' : Colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isRTL && styles.textRTL]}
                placeholder="01XXXXXXXXX"
                placeholderTextColor={Colors.muted}
                keyboardType="phone-pad"
                maxLength={11}
                value={phone}
                onChangeText={validatePhone}
              />
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

            <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('auth.password')} *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isRTL && styles.textRTL]}
                placeholder={t('auth.passwordLength')}
                placeholderTextColor={Colors.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)} hitSlop={15}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={Colors.secondary}
                />
              </Pressable>
            </View>

            {/* --- ADDRESS SECTION --- */}
            <View style={styles.divider} />
            <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>٢. {t('auth.deliveryAddress')}</Text>

            <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('auth.area')} *</Text>
            <Pressable 
              style={styles.selectorButton} 
              onPress={() => setAreaModalVisible(true)}
            >
              <Text style={[styles.selectorText, !selectedArea && { color: Colors.muted }]}>
                {selectedArea ? `${selectedArea.en} - ${selectedArea.ar}` : t('auth.selectArea')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.secondary} />
            </Pressable>

            <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('auth.street')} *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                  style={[styles.input, isRTL && styles.textRTL]}
                placeholder={isRTL ? 'مثال: شارع خالد بن الوليد ٤٥' : 'e.g. 45 Khalid Ibn El Walid St.'}
                placeholderTextColor={Colors.muted}
                value={street}
                onChangeText={setStreet}
              />
            </View>

            {/* Row for Building and Floor to save vertical space but keep targets large */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('auth.building')} *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder={isRTL ? 'الرقم أو الاسم' : 'Num/Name'}
                    placeholderTextColor={Colors.muted}
                    value={building}
                    onChangeText={setBuilding}
                  />
                </View>
              </View>
              <View style={styles.halfWidth}>
                <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('auth.floor')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, isRTL && styles.textRTL]}
                    placeholder={isRTL ? 'مثال: ٣' : 'e.g. 3'}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.muted}
                    value={floor}
                    onChangeText={setFloor}
                  />
                </View>
              </View>
            </View>

          <Text style={[styles.inputLabel, isRTL && styles.textRTL]}>{t('auth.apartment')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, isRTL && styles.textRTL]}
                placeholder={isRTL ? 'مثال: ١٢' : 'e.g. 12 (Leave blank if villa/house)'}
                placeholderTextColor={Colors.muted}
                value={apt}
                onChangeText={setApt}
              />
            </View>

            {/* Submit */}
            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              hitSlop={8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>{t('auth.registerAccount')}</Text>
              )}
            </Pressable>
          </View>

          {/* Switch to Sign In */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t('auth.alreadyRegistered')} </Text>
            <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={15}>
              <Text style={styles.footerLink}>{t('common.signIn')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- Accessible Area Selector Modal --- */}
      <Modal visible={isAreaModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isRTL && styles.textRTL]}>{t('auth.selectAreaTitle')}</Text>
            <Pressable onPress={() => setAreaModalVisible(false)} hitSlop={20}>
              <Ionicons name="close-circle" size={28} color={Colors.secondary} />
            </Pressable>
          </View>
          <SectionList
            sections={areaSections}
            keyExtractor={(item) => item.en}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <Pressable
                style={styles.areaItem}
                onPress={() => {
                  setSelectedArea(item);
                  setAreaModalVisible(false);
                }}
              >
                <Text style={styles.areaItemText}>{item.en}</Text>
                <Text style={styles.areaItemTextAr}>{item.ar}</Text>
              </Pressable>
            )}
            stickySectionHeadersEnabled={false}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  textRTL: { textAlign: 'right' },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.secondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 20,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 8,
    marginTop: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pageBase,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginBottom: 12,
    minHeight: 52, // Large touch target
  },
  inputErrorBorder: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.ink,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.pageBase,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 12,
  },
  selectorText: {
    fontSize: 15,
    color: Colors.ink,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16, // Extra padding for 60+ touch
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.secondary,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.secondary,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.ink,
  },
  sectionHeader: {
    backgroundColor: Colors.pageBase,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  areaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  areaItemText: {
    fontSize: 16,
    color: Colors.ink,
    fontWeight: '600',
  },
  areaItemTextAr: {
    fontSize: 16,
    color: Colors.secondary,
  },
});