import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  SectionList,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import apiClient from '../../src/api/client';
import { useLanguage } from '../context/LanguageContext';

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

interface ManageProfileProps {
  user: any;
  onBack: () => void;
  refreshProfile: () => void;
}

export default function ManageProfile({ user, onBack, refreshProfile }: ManageProfileProps) {
  const { isRTL, t } = useLanguage();
  // Personal Field Editing State
  const [editingField, setEditingField] = useState<'name' | 'email' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingField, setSavingField] = useState(false);

  // Address Modal State
  const [isAddressModalVisible, setAddressModalVisible] = useState(false);
  const [isAreaModalVisible, setAreaModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Address Form States
  const [selectedArea, setSelectedArea] = useState<{en: string, ar: string} | null>(null);
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [apt, setApt] = useState('');
  const [addressPhone, setAddressPhone] = useState(user?.phone || '');
  const [savingAddress, setSavingAddress] = useState(false);

  const addressCount = user?.addresses?.length || 0;
  const canAddAddress = addressCount < 3;

  // --- Profile Field Methods ---
  const handleEditClick = (field: 'name' | 'email' | 'phone', currentValue: string) => {
    setEditValue(currentValue);
    setEditingField(field);
  };

  const handleSaveField = async () => {
    if (!editValue.trim()) {
      Alert.alert(t('profile.fieldRequired'), t('profile.fieldEmpty'));
      return;
    }

    try {
      setSavingField(true);
      const payload = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        [editingField as string]: editValue.trim()
      };

      await apiClient.put('/users/profile', payload);
      await refreshProfile();
      setEditingField(null);
      Alert.alert(t('profile.success'), t('profile.profileUpdated'));
    } catch (err: any) {
      Alert.alert(t('profile.error'), err?.response?.data?.message || t('profile.fieldUpdateFailed'));
    } finally {
      setSavingField(false);
    }
  };

  // --- Address Methods ---
  const resetAddressForm = () => {
    setSelectedArea(null);
    setStreet('');
    setBuilding('');
    setFloor('');
    setApt('');
    setAddressPhone(user?.phone || '');
    setEditingAddressId(null);
  };

  const openAddAddress = () => {
    resetAddressForm();
    setAddressModalVisible(true);
  };

  const openEditAddress = (addr: any) => {
    setEditingAddressId(addr._id);
    setAddressPhone(addr.phone || '');
    setApt(addr.aptNumber !== 'N/A' ? addr.aptNumber : '');

    try {
      const parts = addr.street.split(', ');
      const areaAndStreet = parts[0] || '';
      const areaEndIndex = areaAndStreet.indexOf(' - ');

      if (areaEndIndex !== -1) {
        const areaEn = areaAndStreet.substring(0, areaEndIndex);
        setStreet(areaAndStreet.substring(areaEndIndex + 3));

        let foundArea = null;
        for (const district of rawAreaJSON) {
          const match = district.areas.find(a => a.en === areaEn);
          if (match) {
            foundArea = match;
            break;
          }
        }
        setSelectedArea(foundArea);
      } else {
        setStreet(areaAndStreet);
      }

      const bldgPart = parts.find((p: string) => p.startsWith('Bldg: '));
      if (bldgPart) setBuilding(bldgPart.replace('Bldg: ', ''));

      const floorPart = parts.find((p: string) => p.startsWith('Floor: '));
      if (floorPart) setFloor(floorPart.replace('Floor: ', ''));

    } catch (e) {
      setStreet(addr.street);
    }

    setAddressModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!selectedArea || !street.trim() || !building.trim() || !addressPhone.trim()) {
      Alert.alert(t('profile.fieldRequired'), t('profile.addressFieldsRequired'));
      return;
    }

    try {
      setSavingAddress(true);
      const formattedStreet = `${selectedArea.en} - ${street.trim()}, Bldg: ${building.trim()}, Floor: ${floor.trim() || 'Ground'}`;

      const payload = {
        city: 'Alexandria',
        street: formattedStreet,
        aptNumber: apt.trim() || 'N/A',
        phone: addressPhone.trim(),
      };

      if (editingAddressId) {
        await apiClient.put(`/users/address/${editingAddressId}`, payload);
        Alert.alert(t('profile.success'), t('profile.addressUpdated'));
      } else {
        await apiClient.post('/users/address', payload);
        Alert.alert(t('profile.success'), t('profile.addressAdded'));
      }
      
      await refreshProfile();
      setAddressModalVisible(false);
      resetAddressForm();
    } catch (err: any) {
      Alert.alert(t('profile.error'), err?.response?.data?.message || t('profile.addressSaveFailed'));
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <View>
      <Pressable style={[styles.backBtn, isRTL && styles.rowRTL]} onPress={onBack} hitSlop={15}>
        <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={Colors.ink} />
        <Text style={styles.backBtnText}>{t('common.backToMenu')}</Text>
      </Pressable>

      <Text style={[styles.pageTitle, isRTL && styles.textRTL]}>{t('profile.manageProfile')}</Text>

      {/* --- Personal Information Card --- */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('profile.personalDetails')}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.fieldRow}>
          <View style={styles.fieldInfo}>
            <Text style={styles.fieldLabel}>{t('profile.fullName')}</Text>
            <Text style={styles.fieldValue}>{user?.name}</Text>
          </View>
          <Pressable style={styles.editBtn} onPress={() => handleEditClick('name', user?.name)} hitSlop={15}>
            <Text style={styles.editBtnText}>{t('profile.edit')}</Text>
          </Pressable>
        </View>
        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <View style={styles.fieldInfo}>
            <Text style={styles.fieldLabel}>{t('auth.emailAddress')}</Text>
            <Text style={styles.fieldValue}>{user?.email}</Text>
          </View>
          <Pressable style={styles.editBtn} onPress={() => handleEditClick('email', user?.email)} hitSlop={15}>
            <Text style={styles.editBtnText}>{t('profile.edit')}</Text>
          </Pressable>
        </View>
        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <View style={styles.fieldInfo}>
            <Text style={styles.fieldLabel}>{t('profile.phoneNumber')}</Text>
            <Text style={styles.fieldValue}>{user?.phone || t('common.notProvided')}</Text>
          </View>
          <Pressable style={styles.editBtn} onPress={() => handleEditClick('phone', user?.phone || '')} hitSlop={15}>
            <Text style={styles.editBtnText}>{t('profile.edit')}</Text>
          </Pressable>
        </View>
      </View>

      {/* --- Addresses Card --- */}
      <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
        <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('profile.registeredAddresses')}</Text>
        <Text style={styles.addressCountBadge}>{addressCount}/3 {t('profile.max')}</Text>
      </View>

      <View style={styles.card}>
        {addressCount > 0 ? (
          user?.addresses.map((addr: any, index: number) => (
            <View key={addr._id} style={[styles.addressItem, index === addressCount - 1 && { borderBottomWidth: 0 }]}>
              <Ionicons name="location" size={24} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.addressStreet}>{addr.street} {addr.aptNumber && addr.aptNumber !== 'N/A' ? `(Apt ${addr.aptNumber})` : ''}</Text>
                <Text style={styles.addressMeta}>{addr.city} • {addr.phone}</Text>
              </View>
              <Pressable style={styles.editBtn} onPress={() => openEditAddress(addr)} hitSlop={15}>
                <Text style={styles.editBtnText}>{t('profile.edit')}</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyNote}>{t('profile.noAddresses')}</Text>
        )}
      </View>

      {canAddAddress ? (
        <Pressable style={styles.addAddressBtn} onPress={openAddAddress}>
          <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
          <Text style={styles.addAddressBtnText}>{t('profile.addAddress')}</Text>
        </Pressable>
      ) : (
        <Text style={[styles.limitReachedText, isRTL && styles.textRTL]}>{t('profile.addressLimit')}</Text>
      )}

      {/* --- Inline Field Edit Modal --- */}
      <Modal visible={editingField !== null} animationType="fade" transparent={true}>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editModalContent}>
            <Text style={styles.modalTitle}>
              {t('profile.updateProfile', { field: editingField === 'name' ? t('auth.name') : editingField === 'email' ? t('auth.email') : t('auth.phone') })}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType={editingField === 'phone' ? 'phone-pad' : editingField === 'email' ? 'email-address' : 'default'}
              autoCapitalize={editingField === 'name' ? 'words' : 'none'}
              autoFocus={true}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setEditingField(null)} disabled={savingField}>
                <Text style={styles.modalCancelBtnText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveField} disabled={savingField}>
                {savingField ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveBtnText}>{t('profile.save')}</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- Add / Edit Address Modal --- */}
      <Modal visible={isAddressModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddressModalVisible(false)}>
        <SafeAreaView style={styles.fullModalContainer}>
          <View style={styles.fullModalHeader}>
            <Text style={styles.modalTitle}>
              {editingAddressId ? t('profile.updateAddress') : t('profile.createAddress')}
            </Text>
            <Pressable onPress={() => { setAddressModalVisible(false); resetAddressForm(); }} hitSlop={20}>
              <Ionicons name="close" size={28} color={Colors.ink} />
            </Pressable>
          </View>

          {/* UX Fix: KeyboardAvoidingView and ScrollView wrapped around the form fields */}
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView 
              contentContainerStyle={styles.fullModalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled" 
            >
              <Text style={styles.inputLabel}>{t('auth.area')} *</Text>
              <Pressable style={styles.selectorButton} onPress={() => setAreaModalVisible(true)}>
                <Text style={[styles.selectorText, !selectedArea && { color: Colors.muted }]}>
                  {selectedArea ? `${selectedArea.en} - ${selectedArea.ar}` : t('auth.selectArea')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.secondary} />
              </Pressable>

              <Text style={styles.inputLabel}>{t('auth.street')} *</Text>
              <TextInput style={[styles.input, isRTL && styles.textRTL]} placeholder={isRTL ? 'مثال: شارع خالد بن الوليد ٤٥' : 'e.g. 45 Khalid Ibn El Walid St.'} placeholderTextColor={Colors.muted} value={street} onChangeText={setStreet} />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>{t('auth.building')} *</Text>
                  <TextInput style={[styles.input, isRTL && styles.textRTL]} placeholder={isRTL ? 'الرقم أو الاسم' : 'Num/Name'} placeholderTextColor={Colors.muted} value={building} onChangeText={setBuilding} />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>{t('auth.floor')}</Text>
                  <TextInput style={[styles.input, isRTL && styles.textRTL]} placeholder={isRTL ? 'مثال: ٣' : 'e.g. 3'} keyboardType="numeric" placeholderTextColor={Colors.muted} value={floor} onChangeText={setFloor} />
                </View>
              </View>

              <Text style={styles.inputLabel}>{t('auth.apartment')}</Text>
              <TextInput style={[styles.input, isRTL && styles.textRTL]} placeholder={isRTL ? 'مثال: ١٢' : 'e.g. 12 (Leave blank if villa)'} placeholderTextColor={Colors.muted} value={apt} onChangeText={setApt} />

              <Text style={styles.inputLabel}>{t('profile.contactPhone')} *</Text>
              <TextInput style={[styles.input, isRTL && styles.textRTL]} placeholder="01XXXXXXXXX" placeholderTextColor={Colors.muted} keyboardType="phone-pad" maxLength={11} value={addressPhone} onChangeText={setAddressPhone} />

              <Pressable style={[styles.primaryButton, savingAddress && { backgroundColor: Colors.secondary }]} onPress={handleSaveAddress} disabled={savingAddress}>
                {savingAddress ? <ActivityIndicator color={Colors.surface} /> : <Text style={styles.primaryButtonText}>{t('profile.saveAddress')}</Text>}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* --- Area Selector Modal --- */}
      <Modal visible={isAreaModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.fullModalContainer}>
          <View style={styles.fullModalHeader}>
            <Text style={styles.modalTitle}>{t('auth.selectAreaTitle')}</Text>
            <Pressable onPress={() => setAreaModalVisible(false)} hitSlop={20}>
              <Ionicons name="close" size={28} color={Colors.ink} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  textRTL: { textAlign: 'right' },
  rowRTL: { flexDirection: 'row-reverse' },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 16, gap: 8 },
  backBtnText: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.ink, marginBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  addressCountBadge: { fontSize: 13, fontWeight: '800', color: Colors.primary, backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: 20 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  fieldInfo: { flex: 1 },
  fieldLabel: { fontSize: 13, color: Colors.secondary, fontWeight: '700', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: Colors.ink, fontWeight: '600' },
  editBtn: { backgroundColor: Colors.pageBase, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.borderSubtle },
  editBtnText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: 20 },
  addressItem: { flexDirection: 'row', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, alignItems: 'center' },
  addressStreet: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  addressMeta: { fontSize: 13, color: Colors.secondary, marginTop: 4 },
  emptyNote: { padding: 24, textAlign: 'center', color: Colors.muted, fontSize: 15 },
  addAddressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, paddingVertical: 18, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', gap: 8 },
  addAddressBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
  limitReachedText: { textAlign: 'center', color: Colors.error, fontSize: 14, fontWeight: '600', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  editModalContent: { width: '100%', backgroundColor: Colors.surface, borderRadius: 20, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.ink, marginBottom: 20 },
  modalInput: { backgroundColor: Colors.pageBase, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.ink, marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: Colors.pageBase },
  modalCancelBtnText: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  modalSaveBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: Colors.primary },
  modalSaveBtnText: { fontSize: 15, fontWeight: '800', color: Colors.surface },
  fullModalContainer: { flex: 1, backgroundColor: Colors.surface },
  fullModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  fullModalScrollContent: { padding: 20, paddingBottom: 80 }, // Critical Fix: Padding bottom ensures button isn't trapped
  inputLabel: { fontSize: 14, fontWeight: '700', color: Colors.ink, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: Colors.pageBase, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.ink },
  selectorButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.pageBase, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 16, minHeight: 54 },
  selectorText: { fontSize: 16, color: Colors.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  primaryButtonText: { color: Colors.surface, fontSize: 16, fontWeight: '800' },
  sectionHeader: { backgroundColor: Colors.pageBase, paddingVertical: 12, paddingHorizontal: 20 },
  sectionHeaderText: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  areaItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  areaItemText: { fontSize: 16, color: Colors.ink, fontWeight: '600' },
  areaItemTextAr: { fontSize: 16, color: Colors.secondary },
});