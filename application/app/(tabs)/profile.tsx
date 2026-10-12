// ProfileScreen.tsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import apiClient from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { useTabBar } from '../../src/context/TabBarContext';
import { LanguageContext } from '../../src/context/LanguageContext';
import ManageProfile from '../../src/components/ManageProfile'; // Import the new component
import { formatPrice } from '../../src/utils/formatPrice';

const PHARMACY_WHATSAPP = '+201000686866';

interface OrderItem {
  _id: string;
  createdAt: string;
  status: string;
  orderItems: {
    product: {
      _id: string;
      title: string;
      price?: number;
    };
    quantity?: number;
    qty?: number;
    name?: string;
    price?: number;
  }[];
  shippingAddress?: {
    street?: string;
    city?: string;
    phone?: string;
  };
}

type ProfileView = 'main' | 'orders' | 'info' | 'manage';

export default function ProfileScreen() {
  const router = useRouter();
  const { handleScroll } = useTabBar();
  const { user, token, logout, refreshProfile } = useAuth();
  const { language, isRTL, setLanguage, t } = useContext(LanguageContext);
  const toggleLanguage = async () => {
    await setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const [currentView, setCurrentView] = useState<ProfileView>('main');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchMyOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingOrders(true);
      const res = await apiClient.get('/orders/myorders');
      setOrders(res.data || []);
    } catch (err) {
      console.warn('Failed to load orders', err);
    } finally {
      setLoadingOrders(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      if (!token) return;

      try {
        setLoadingOrders(true);
        const res = await apiClient.get('/orders/myorders');
        if (!active) return;
        setOrders(res.data || []);
      } catch (err) {
        if (!active) return;
        console.warn('Failed to load orders', err);
      } finally {
        if (active) {
          setLoadingOrders(false);
          setRefreshing(false);
        }
      }
    };

    void loadOrders();

    return () => {
      active = false;
    };
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshProfile();
    fetchMyOrders();
  };

  const handleSignOut = () => {
    Alert.alert(t('profile.signOut'), t('profile.confirmSignOut'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.signOut'),
        style: 'destructive',
        onPress: () => {
          setCurrentView('main');
          logout();
        },
      },
    ]);
  };

  const handleWhatsAppSupport = () => {
    const cleanNumber = PHARMACY_WHATSAPP.replace(/[^0-9]/g, '');
    const message = t('profile.pharmacyWhatsAppMessage');
    const url = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => Linking.openURL(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`))
      .catch(() => Alert.alert(t('profile.error'), t('profile.installWhatsApp')));
  };

  const followUpOrder = async (order: OrderItem) => {
    const cleanNumber = PHARMACY_WHATSAPP.replace(/[^0-9]/g, '');
    const items = Array.isArray(order.orderItems) ? order.orderItems : [];
    const orderLines = items.map((item) => {
      const name = item.product?.title || item.name || 'منتج';
      const quantity = Number(item.quantity ?? item.qty) || 0;
      const unitPrice = Number(item.price ?? item.product?.price);
      const lineTotal = Number.isFinite(unitPrice) && unitPrice >= 0
        ? formatPrice(unitPrice * quantity, 'ar')
        : 'السعر غير متاح';
      return `• ${name} — الكمية: ${quantity} — الإجمالي: ${lineTotal}`;
    }).join('\n');
    const totalPrice = items.reduce((sum, item) => {
      const unitPrice = Number(item.price ?? item.product?.price);
      const quantity = Number(item.quantity ?? item.qty) || 0;
      return Number.isFinite(unitPrice) && unitPrice >= 0 ? sum + unitPrice * quantity : sum;
    }, 0);
    const hasCompletePrices = items.every((item) => {
      const unitPrice = Number(item.price ?? item.product?.price);
      return Number.isFinite(unitPrice) && unitPrice >= 0;
    });
    const message = [
      'مرحباً صيدلية ميريلاند، أود متابعة طلبي.',
      `الاسم: ${user?.name || 'العميل'}`,
      'تفاصيل المنتجات:',
      orderLines || 'لا توجد تفاصيل للمنتجات.',
      `إجمالي الطلب: ${hasCompletePrices ? formatPrice(totalPrice, 'ar') : 'السعر غير متاح'}`,
      'برجاء إفادتي بحالة الطلب. شكراً لكم.',
    ].join('\n');
    try {
      await Linking.openURL(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`);
    } catch {
      Alert.alert(t('profile.error'), t('profile.installWhatsApp'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return Colors.whatsapp;
      case 'Out for Delivery': return Colors.info;
      case 'Confirmed via WhatsApp': return Colors.whatsapp;
      case 'Cancelled': return Colors.error;
      default: return Colors.warning;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Delivered': return t('profile.statusDelivered');
      case 'Out for Delivery': return t('profile.statusOutForDelivery');
      case 'Confirmed via WhatsApp': return t('profile.statusConfirmed');
      case 'Cancelled': return t('profile.statusCancelled');
      default: return status || t('profile.inquiryReceived');
    }
  };

  if (!token) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestIconCircle}>
          <Ionicons name="person-circle-outline" size={68} color={Colors.muted} />
        </View>
        <Text style={[styles.guestTitle, isRTL && styles.textRTL]}>{t('profile.welcome')}</Text>
        <Text style={[styles.guestSubtitle, isRTL && styles.textRTL]}>
          {t('profile.guestSubtitle')}
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.primaryButtonText}>{t('common.signInRegister')}</Text>
        </Pressable>
        <Pressable style={styles.supportButton} onPress={handleWhatsAppSupport}>
          <Ionicons name="logo-whatsapp" size={18} color={Colors.whatsapp} />
          <Text style={styles.supportButtonText}>{t('common.contactSupport')}</Text>
        </Pressable>
        <Pressable style={[styles.guestLanguageRow, isRTL && styles.rowRTL]} onPress={toggleLanguage}>
          <Ionicons name="language-outline" size={21} color={Colors.primary} />
          <Text style={[styles.guestLanguageLabel, isRTL && styles.textRTL]}>{t('profile.language')}</Text>
          <Text style={styles.languageValue}>{language === 'en' ? t('profile.english') : t('profile.arabic')}</Text>
        </Pressable>
      </View>
    );
  }

  const renderMainMenu = () => (
    <View>
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={28} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, isRTL && styles.textRTL]}>{t('profile.hello', { name: user?.name?.split(' ')[0] || t('common.customer') })}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>{t('profile.accountMenu')}</Text>

      <View style={styles.menuContainer}>
        <Pressable style={[styles.menuItem, isRTL && styles.rowRTL]} onPress={() => setCurrentView('orders')}>
          <View style={styles.menuIconBox}><Ionicons name="receipt-outline" size={22} color={Colors.primary} /></View>
          <View style={styles.menuTextCol}>
            <Text style={[styles.menuItemTitle, isRTL && styles.textRTL]}>{t('profile.myOrders')}</Text>
            <Text style={[styles.menuItemSub, isRTL && styles.textRTL]}>{t('profile.trackOrders')}</Text>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={Colors.muted} />
        </Pressable>

        <Pressable style={[styles.menuItem, isRTL && styles.rowRTL]} onPress={() => setCurrentView('info')}>
          <View style={styles.menuIconBox}><Ionicons name="information-circle-outline" size={22} color={Colors.primary} /></View>
          <View style={styles.menuTextCol}>
            <Text style={[styles.menuItemTitle, isRTL && styles.textRTL]}>{t('profile.accountInfo')}</Text>
            <Text style={[styles.menuItemSub, isRTL && styles.textRTL]}>{t('profile.accountInfoSub')}</Text>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={Colors.muted} />
        </Pressable>

        <Pressable style={[styles.menuItem, isRTL && styles.rowRTL]} onPress={() => setCurrentView('manage')}>
          <View style={styles.menuIconBox}><Ionicons name="settings-outline" size={22} color={Colors.primary} /></View>
          <View style={styles.menuTextCol}>
            <Text style={[styles.menuItemTitle, isRTL && styles.textRTL]}>{t('profile.manageProfile')}</Text>
            <Text style={[styles.menuItemSub, isRTL && styles.textRTL]}>{t('profile.manageProfileSub')}</Text>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={Colors.muted} />
        </Pressable>

        <Pressable
          style={[styles.menuItem, isRTL && styles.rowRTL]}
          onPress={() => router.push('/contact-us' as any)}
        >
          <View style={styles.menuIconBox}><Ionicons name="headset-outline" size={22} color={Colors.primary} /></View>
          <View style={styles.menuTextCol}>
            <Text style={[styles.menuItemTitle, isRTL && styles.textRTL]}>{t('profile.contactUs')}</Text>
            <Text style={[styles.menuItemSub, isRTL && styles.textRTL]}>{t('profile.contactUsSub')}</Text>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={Colors.muted} />
        </Pressable>

        <Pressable style={[styles.menuItem, { borderBottomWidth: 0 }, isRTL && styles.rowRTL]} onPress={toggleLanguage}>
          <View style={styles.menuIconBox}><Ionicons name="language-outline" size={22} color={Colors.primary} /></View>
          <View style={styles.menuTextCol}>
            <Text style={[styles.menuItemTitle, isRTL && styles.textRTL]}>{t('profile.language')}</Text>
            <Text style={[styles.menuItemSub, isRTL && styles.textRTL]}>{t('profile.languageDescription')}</Text>
          </View>
          <Text style={styles.languageValue}>{language === 'en' ? t('profile.english') : t('profile.arabic')}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.pharmacistCard} onPress={handleWhatsAppSupport}>
        <View style={styles.pharmacistIcon}>
          <Ionicons name="logo-whatsapp" size={24} color={Colors.surface} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pharmacistTitle, isRTL && styles.textRTL]}>{t('profile.needPharmacist')}</Text>
          <Text style={[styles.pharmacistSub, isRTL && styles.textRTL]}>{t('profile.pharmacistSub')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={handleSignOut} hitSlop={15}>
        <Ionicons name="log-out-outline" size={24} color="#DC2626" />
        <Text style={styles.signOutButtonText}>{t('profile.signOut')}</Text>
      </Pressable>
    </View>
  );

  const renderAccountInfo = () => (
    <View>
      <Pressable style={styles.backBtn} onPress={() => setCurrentView('main')} hitSlop={15}>
        <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        <Text style={styles.backBtnText}>{t('common.backToMenu')}</Text>
      </Pressable>

      <Text style={[styles.pageTitle, isRTL && styles.textRTL]}>{t('profile.accountInformation')}</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.fullName')}</Text>
          <Text style={styles.infoValue}>{user?.name}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.email')}</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.phoneNumber')}</Text>
          <Text style={styles.infoValue}>{user?.phone || t('common.notProvided')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('profile.accountRole')}</Text>
          <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{user?.role || t('profile.client')}</Text>
        </View>
      </View>
    </View>
  );

  const renderOrders = () => (
    <View>
      <Pressable style={styles.backBtn} onPress={() => setCurrentView('main')} hitSlop={15}>
        <Ionicons name="arrow-back" size={24} color={Colors.ink} />
        <Text style={styles.backBtnText}>{t('common.backToMenu')}</Text>
      </Pressable>

      <Text style={[styles.pageTitle, isRTL && styles.textRTL]}>{t('profile.myOrders')}</Text>

      {loadingOrders ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 30 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={36} color={Colors.muted} />
          <Text style={styles.emptyCardText}>{t('profile.noOrders')}</Text>
        </View>
      ) : (
        orders.map((order) => {
          const items = Array.isArray(order.orderItems) ? order.orderItems : [];
          const totalUnits = items.reduce((acc, item) => acc + (Number(item.quantity ?? item.qty) || 0), 0);
          const totalPrice = items.reduce((sum, item) => {
            const unitPrice = Number(item.price ?? item.product?.price);
            const quantity = Number(item.quantity ?? item.qty) || 0;
            return Number.isFinite(unitPrice) && unitPrice >= 0 ? sum + unitPrice * quantity : sum;
          }, 0);
          const dateFormatted = new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });

          return (
            <View key={order._id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderRef}>#{order._id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>{dateFormatted}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.orderItemsList}>
                {items.map((item, index) => {
                  const quantity = Number(item.quantity ?? item.qty) || 0;
                  const unitPrice = Number(item.price ?? item.product?.price);
                  const hasPrice = Number.isFinite(unitPrice) && unitPrice >= 0;
                  const name = item.product?.title || item.name || 'Product';
                  return (
                    <View key={`${item.product?._id || name}-${index}`} style={[styles.orderProductRow, isRTL && styles.rowRTL]}>
                      <View style={styles.orderProductInfo}>
                        <Text style={[styles.orderProductName, isRTL && styles.textRTL]} numberOfLines={2}>{name}</Text>
                        <Text style={[styles.orderProductQuantity, isRTL && styles.textRTL]}>{quantity} × {hasPrice ? formatPrice(unitPrice, language) : t('product.priceUnavailable')}</Text>
                      </View>
                      <Text style={styles.orderProductLinePrice}>{hasPrice ? formatPrice(unitPrice * quantity, language) : t('product.priceUnavailable')}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={[styles.orderSummaryRow, isRTL && styles.rowRTL]}>
                <Text style={[styles.orderItemsCount, isRTL && styles.textRTL]}>{t('profile.orderProductsUnits', { products: items.length, units: totalUnits })}</Text>
                <View style={styles.orderTotalBlock}>
                  <Text style={styles.orderTotalLabel}>{language === 'ar' ? 'الإجمالي' : 'Total'}</Text>
                  <Text style={styles.orderTotalValue}>{formatPrice(totalPrice, language)}</Text>
                </View>
              </View>

              <Pressable
                style={styles.orderWhatsAppBtn}
                onPress={() => followUpOrder(order)}
              >
                <Ionicons name="logo-whatsapp" size={16} color={Colors.whatsapp} />
                <Text style={styles.orderWhatsAppBtnText}>{t('profile.followUpWhatsApp')}</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {currentView === 'main' && renderMainMenu()}
        {currentView === 'info' && renderAccountInfo()}
        {currentView === 'manage' && (
          <ManageProfile user={user} onBack={() => setCurrentView('main')} refreshProfile={refreshProfile} />
        )}
        {currentView === 'orders' && renderOrders()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.pageBase },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  guestLanguageRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderSubtle, borderRadius: 12, padding: 14, marginTop: 8 },
  guestLanguageLabel: { flex: 1, color: Colors.ink, fontSize: 15, fontWeight: '700' },
  guestIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  guestTitle: { fontSize: 22, fontWeight: '900', color: Colors.ink, marginBottom: 8 },
  guestSubtitle: { fontSize: 15, color: Colors.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  primaryButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', width: '100%' },
  primaryButtonText: { color: Colors.surface, fontSize: 16, fontWeight: '800' },
  supportButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  supportButtonText: { color: Colors.whatsapp, fontSize: 15, fontWeight: '700' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: 24, gap: 16 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 18, fontWeight: '900', color: Colors.ink },
  userEmail: { fontSize: 14, color: Colors.secondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.secondary, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuContainer: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderSubtle, overflow: 'hidden', marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle, minHeight: 64 },
  menuIconBox: { width: 36, alignItems: 'center', justifyContent: 'center' },
  menuTextCol: { flex: 1, marginLeft: 8 },
  languageValue: { color: Colors.primary, fontSize: 14, fontWeight: '800', paddingHorizontal: 8 },
  rowRTL: { flexDirection: 'row-reverse' },
  textRTL: { textAlign: 'right' },
  menuItemTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  menuItemSub: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  pharmacistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.borderSubtle, gap: 14, marginBottom: 32 },
  pharmacistIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.whatsapp, alignItems: 'center', justifyContent: 'center' },
  pharmacistTitle: { fontSize: 15, fontWeight: '800', color: Colors.ink },
  pharmacistSub: { fontSize: 13, color: Colors.secondary, marginTop: 2 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 18, borderWidth: 1.5, borderColor: '#FECACA', gap: 10 },
  signOutButtonText: { color: '#DC2626', fontSize: 16, fontWeight: '800' },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 16, gap: 8 },
  backBtnText: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  pageTitle: { fontSize: 26, fontWeight: '900', color: Colors.ink, marginBottom: 24 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.borderSubtle },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel: { fontSize: 15, color: Colors.secondary, fontWeight: '600' },
  infoValue: { fontSize: 15, color: Colors.ink, fontWeight: '800' },
  orderCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.borderSubtle, marginBottom: 16 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderRef: { fontSize: 15, fontWeight: '900', color: Colors.ink },
  orderDate: { fontSize: 13, color: Colors.secondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '800' },
  divider: { height: 1, backgroundColor: Colors.borderSubtle, marginVertical: 16 },
  orderSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItemsCount: { fontSize: 14, fontWeight: '700', color: Colors.ink },
  orderItemsList: { gap: 10, marginBottom: 16 },
  orderProductRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.pageBase },
  orderProductInfo: { flex: 1, gap: 4 },
  orderProductName: { color: Colors.ink, fontSize: 14, fontWeight: '700' },
  orderProductQuantity: { color: Colors.secondary, fontSize: 12, fontWeight: '600' },
  orderProductLinePrice: { color: Colors.ink, fontSize: 13, fontWeight: '800' },
  orderTotalBlock: { alignItems: 'flex-end', gap: 2 },
  orderTotalLabel: { color: Colors.secondary, fontSize: 11, fontWeight: '600' },
  orderTotalValue: { color: Colors.primary, fontSize: 15, fontWeight: '900' },
  orderWhatsAppBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.whatsappBg, borderRadius: 10, paddingVertical: 12, marginTop: 16, gap: 8 },
  orderWhatsAppBtnText: { fontSize: 14, fontWeight: '800', color: Colors.whatsapp },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderSubtle, gap: 12 },
  emptyCardText: { fontSize: 15, color: Colors.muted, fontWeight: '600' },
});
