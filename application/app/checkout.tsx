import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TextInputProps,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Modal,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ColorsPalette from '../src/constants/Colors';
import apiClient from '../src/api/client';
import { useAuth } from '../src/context/AuthContext';
import { CartItem, useCart } from '../src/context/CartContext';
import { useLanguage } from '../src/context/LanguageContext';
import { formatPrice } from '../src/utils/formatPrice';

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

const WHATSAPP_NUMBER = '201000076890';

const PAYMENT_INFO = {
  InstaPay: {
    title: { en: 'InstaPay', ar: 'انستا باي' },
    link: 'https://ipn.eg/S/yousry360218/instapay/6xwQ60',
    textLink: 'yousry360218@instapay',
    number: '01000000685',
    poweredBy: 'Powered by InstaPay',
  },
  VodafoneCash: {
    title: { en: 'Vodafone Cash', ar: 'فودافون كاش' },
    link: 'http://vf.eg/vfcash?id=mt&qrId=hvSwTd',
    number: '01000000685',
  },
};

// Tailwind palette values used by the web page.
const P = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
  emerald50: '#ECFDF5',
  emerald200: '#A7F3D0',
  emerald300: '#6EE7B7',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065F46',
  emerald900: '#064E3B',
  emerald950: '#022C22',
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red200: '#FECACA',
  red600: '#DC2626',
  red700: '#B91C1C',
  red950: '#450A0A',
  purple50: '#FAF5FF',
  purple200: '#E9D5FF',
  purple600: '#9333EA',
  purple700: '#7E22CE',
  purple900: '#581C87',
  purple950: '#3B0764',
  amber50: '#FFFBEB',
  amber200: '#FDE68A',
  amber300: '#FCD34D',
  amber500: '#F59E0B',
  amber600: '#D97706',
  amber700: '#B45309',
  amber900: '#78350F',
  blue50: '#EFF6FF',
  blue200: '#BFDBFE',
  blue600: '#2563EB',
  blue950: '#172554',
};
const RED = P.red600;

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

const SHADOW = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 },
} as const;

const itemTitle = (i: any): string => i?.title ?? i?.name ?? '';

/* ------------------------------------------------------------------ */
/*  Small animation + UI primitives                                   */
/* ------------------------------------------------------------------ */

// animate-fade-in / animate-scale-up
function Entrance({
  children,
  style,
  variant = 'fade',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'fade' | 'scale';
}) {
  const [v] = useState(() => new Animated.Value(0));
  
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: variant === 'scale' ? 220 : 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, variant]);

  const transform =
    variant === 'scale'
      ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }]
      : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }];

  return <Animated.View style={[style, { opacity: v, transform }]}>{children}</Animated.View>;
}

// animate-pulse / animate-bounce (native-driven loops)
function Loop({
  kind,
  active = true,
  style,
  children,
}: {
  kind: 'pulse' | 'bounce';
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const [v] = useState(() => new Animated.Value(kind === 'pulse' ? 1 : 0));

  useEffect(() => {
    if (!active) {
      v.setValue(kind === 'pulse' ? 1 : 0);
      return;
    }
    const seq =
      kind === 'pulse'
        ? Animated.sequence([
            Animated.timing(v, { toValue: 0.5, duration: 1000, easing: Easing.bezier(0.4, 0, 0.6, 1), useNativeDriver: true }),
            Animated.timing(v, { toValue: 1, duration: 1000, easing: Easing.bezier(0.4, 0, 0.6, 1), useNativeDriver: true }),
          ])
        : Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: 500, easing: Easing.bezier(0, 0, 0.2, 1), useNativeDriver: true }),
            Animated.timing(v, { toValue: 0, duration: 500, easing: Easing.bezier(0.8, 0, 1, 1), useNativeDriver: true }),
          ]);
    const loop = Animated.loop(seq);
    loop.start();
    return () => loop.stop();
  }, [active, kind, v]);

  const animStyle =
    kind === 'pulse'
      ? { opacity: v }
      : { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] };

  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

// SquircleButton (primary) with active:scale-95
function PrimaryButton({
  label,
  onPress,
  icon,
  loading,
  disabled,
  fullWidth,
  compact,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: (color: string) => React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, speed: 40, bounciness: 0, useNativeDriver: true }).start();
  const textColor = disabled ? P.slate500 : P.white;

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth && { alignSelf: 'stretch' },
        !disabled && { ...SHADOW.md, shadowColor: 'rgba(220,38,38,0.35)' },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => !disabled && to(0.95)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled, busy: !!loading }}
        style={[st.btn, compact ? st.btnCompact : st.btnLarge, disabled && st.btnDisabled, style]}
      >
        {loading ? (
          <ActivityIndicator color={P.white} />
        ) : (
          <>
            {icon ? icon(textColor) : null}
            <Text style={[st.btnText, compact && { fontSize: 12 }, { color: textColor }]} numberOfLines={2}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Text input with focus:border-[#DC2626]
function Field({ style, rtl, onFocus, onBlur, ...props }: TextInputProps & { rtl?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      placeholderTextColor={P.slate400}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[st.input, rtl && { textAlign: 'right' }, focused && { borderColor: RED }, style]}
    />
  );
}

/* ---------------------------- Toasts ------------------------------ */

type ToastState = { id: number; kind: 'success' | 'error'; text: string } | null;

function useToast() {
  const [toastState, setToastState] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((kind: 'success' | 'error', text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToastState({ id: Date.now(), kind, text });
    timer.current = setTimeout(() => setToastState(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const toast = useMemo(
    () => ({
      success: (m: string) => show('success', m),
      error: (m: string) => show('error', m),
    }),
    [show]
  );

  return { toast, toastState };
}

function ToastView({ toast, topInset }: { toast: ToastState; topInset: number }) {
  const [v] = useState(() => new Animated.Value(0));
  const id = toast?.id;

  useEffect(() => {
    if (!id) return;
    v.setValue(0);
    Animated.spring(v, { toValue: 1, speed: 14, bounciness: 6, useNativeDriver: true }).start();
  }, [id, v]);

  if (!toast) return null;
  const ok = toast.kind === 'success';

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        st.toastWrap,
        {
          top: topInset + 8,
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        },
      ]}
    >
      <View style={[st.toast, SHADOW.lg]}>
        <View style={[st.toastIcon, { backgroundColor: ok ? '#61D345' : '#FF4B4B' }]}>
          <Feather name={ok ? 'check' : 'x'} size={12} color={P.white} />
        </View>
        <Text style={st.toastText}>{toast.text}</Text>
      </View>
    </Animated.View>
  );
}

/* --------------------- Payment instruction bits -------------------- */

function NumCircle({ n, color }: { n: string; color: string }) {
  return (
    <View style={[st.numCircle, { backgroundColor: color }]}>
      <Text style={st.numCircleText}>{n}</Text>
    </View>
  );
}

function ReturnStep({ text }: { text: string }) {
  return (
    <View style={st.returnStep}>
      <View style={st.returnIcon}>
        <Feather name="corner-up-left" size={12} color={P.white} />
      </View>
      <Text style={st.returnText}>{text}</Text>
    </View>
  );
}

function CopyBox({
  label,
  value,
  accent,
  border,
  onCopy,
  copyLabel,
  strong,
  style,
}: {
  label: string;
  value: string;
  accent: string;
  border: string;
  onCopy: () => void;
  copyLabel: string;
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[st.copyBox, { borderColor: border }, SHADOW.sm, style]}>
      <View style={{ flex: 1 }}>
        <Text style={st.copyLabel}>{label}</Text>
        <Text
          style={[
            st.copyValue,
            strong
              ? { color: P.slate900, fontWeight: '900', fontSize: 16, letterSpacing: 1.2 }
              : { color: P.purple950, fontWeight: '700', fontSize: 14 },
          ]}
        >
          {value}
        </Text>
      </View>
      <Pressable onPress={onCopy} hitSlop={6} style={({ pressed }) => [st.copyBtn, pressed && { opacity: 0.6 }]}>
        <Feather name="copy" size={strong ? 15 : 14} color={accent} />
        <Text style={[st.copyBtnText, { color: accent }]}>{copyLabel}</Text>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Checkout content                                                  */
/* ------------------------------------------------------------------ */

function CheckoutContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const auth = useAuth() as any;
  const { user, token, setUser } = auth;
  const { cart: cartItems, clearCart, totalItems: totalUnits, totalPrice } = useCart();

  const { language: lang, t } = useLanguage();
  const isAr = !lang || String(lang).toLowerCase().startsWith('ar');
  const { toast, toastState } = useToast();

  // Tailwind breakpoints used by the web page
  const isSm = width >= 640;
  const isMd = width >= 768;
  const isLg = width >= 1024;

  const getInitialAddresses = (currentUser: any): any[] => {
    if (!currentUser) return [];
    if (currentUser.addresses && currentUser.addresses.length > 0) {
      return currentUser.addresses;
    }
    if (currentUser.address && currentUser.address.street) {
      return [{ ...currentUser.address, _id: currentUser.address._id || 'legacy_primary' }];
    }
    return [];
  };

  // --- STATE ---
  const [addresses, setAddresses] = useState<any[]>(() => getInitialAddresses(user));
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(() => getInitialAddresses(user)[0]?._id ?? null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  // Address UI modes
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [form, setForm] = useState({ street: '', building: '', city: 'Alexandria' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Set once the WhatsApp message is sent so the user stays on Checkout with options
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: any;
    selectedAddr: any;
    items: CartItem[];
    subtotal: number;
    totalUnits: number;
  } | null>(null);

  // --- 2. ADDRESS HANDLERS ---
  const handleSaveAddress = async () => {
    if (!form.street.trim() || !form.building.trim()) {
      return toast.error(isAr ? 'يرجى كتابة اسم الشارع ورقم المبنى' : 'Please fill street and building');
    }
    try {
      setIsProcessing(true);
      const { data } = await apiClient.post('/users/address', {
        street: form.street,
        aptNumber: form.building,
        city: 'Alexandria',
      });
      const updatedUser = { ...user, addresses: data };
      if (setUser) setUser(updatedUser);
      setAddresses(data);
      if (!selectedAddrId && data.length > 0) {
        setSelectedAddrId(data[data.length - 1]._id);
      }
      setMode('list');
      setForm({ street: '', building: '', city: 'Alexandria' });
      toast.success(isAr ? 'تم حفظ العنوان بنجاح' : 'Address added successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || (isAr ? 'فشل حفظ العنوان' : 'Failed to save address'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateAddress = async () => {
    try {
      setIsProcessing(true);
      const { data } = await apiClient.put(`/users/address/${editingId}`, {
        street: form.street,
        aptNumber: form.building,
        city: 'Alexandria',
      });
      const updatedUser = { ...user, addresses: data };
      if (setUser) setUser(updatedUser);
      setAddresses(data);
      setMode('list');
      setEditingId(null);
      toast.success(isAr ? 'تم تحديث العنوان' : 'Address updated');
    } catch (error) {
      console.error('Update Address Error:', error);
      toast.error(isAr ? 'فشل تحديث العنوان' : 'Failed to update address');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      setIsProcessing(true);
      const { data } = await apiClient.delete(`/users/address/${addressToDelete}`);
      const updatedUser = { ...user, addresses: data };
      if (setUser) setUser(updatedUser);
      setAddresses(data);
      if (selectedAddrId === addressToDelete) {
        setSelectedAddrId(data.length > 0 ? data[0]._id : null);
      }
      toast.success(isAr ? 'تم حذف العنوان' : 'Address deleted');
    } catch (error) {
      console.error('Delete Address Error:', error);
      toast.error(isAr ? 'فشل الحذف' : 'Failed to delete');
    } finally {
      setIsProcessing(false);
      setAddressToDelete(null);
    }
  };

  const startEdit = (addr: any) => {
    setForm({ street: addr.street, building: addr.aptNumber, city: addr.city });
    setEditingId(addr._id);
    setMode('edit');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      toast.success(isAr ? 'تم النسخ بنجاح!' : 'Copied to clipboard!');
    } catch {
      toast.error(isAr ? 'تعذر النسخ' : 'Could not copy');
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/cart' as any);
  };

  // --- 3. WHATSAPP DOSSIER GENERATOR ---
  const generateWhatsAppMessage = (orderId: any, addr: any) => {
    const itemsList = cartItems
      .map((item, index) => {
        const quantity = item.quantity || 1;
        const linePrice =
          typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice)
            ? formatPrice(item.unitPrice * quantity, lang)
            : (isAr ? 'غير متاح' : 'Unavailable');
        return `  ${index + 1}. *${itemTitle(item)}* × ${quantity} — ${linePrice}`;
      })
      .join('\n');
    const subtotal =
      totalPrice === null ? (isAr ? 'غير متاح' : 'Unavailable') : formatPrice(totalPrice, lang);

    const paymentLabel =
      ({
        CashOnDelivery: isAr ? 'الدفع نقداً عند الاستلام' : 'Cash on Delivery',
        InstaPay: isAr ? 'تحويل انستا باي (InstaPay)' : 'InstaPay Transfer',
        VodafoneCash: isAr ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash',
      } as Record<string, string>)[paymentMethod as string] || paymentMethod;

    if (isAr) {
      return encodeURIComponent(
`*طلب واستفسار جديد - صيدلية ماريلاند* 🏥
رقم المرجع: #${String(orderId).slice(-6).toUpperCase()}

👤 *بيانات العميل:*
• الاسم: ${user?.name || 'عميل ماريلاند'}
• الهاتف: ${user?.phone || 'غير مسجل'}

📍 *عنوان التوصيل:*
• الشارع: ${addr.street}
• المبنى/الشقة: ${addr.aptNumber}
• المدينة: الإسكندرية

💳 *طريقة الدفع المختارة:* ${paymentLabel}
${notes.trim() ? `📝 *ملاحظات العميل:* ${notes.trim()}\n` : ''}
📦 *الأصناف المطلوبة:*
${itemsList}

*المجموع الفرعي للأصناف:* ${subtotal}
رسوم التوصيل غير مشمولة، وسيتم تأكيدها بعد إرسال الطلب.
يرجى تأكيد رسوم التوصيل والإجمالي النهائي. شكراً لكم!`
      );
    }

    return encodeURIComponent(
`*New Order Request - Maryland Pharmacy* 🏥
Reference: #${String(orderId).slice(-6).toUpperCase()}

👤 *Customer Info:*
• Name: ${user?.name || 'Customer'}
• Phone: ${user?.phone || 'N/A'}

📍 *Delivery Address:*
• Street: ${addr.street}
• Building/Apt: ${addr.aptNumber}
• City: Alexandria

💳 *Payment Preference:* ${paymentLabel}
${notes.trim() ? `📝 *Notes:* ${notes.trim()}\n` : ''}
📦 *Requested Items:*
${itemsList}

*Items subtotal:* ${subtotal}
Delivery fee is not included and will be confirmed after the order is submitted.
Please confirm the delivery fee and final amount. Thank you!`
    );
  };

  const openWhatsApp = async (encodedText: string) => {
    try {
      await Linking.openURL(`whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodedText}`);
    } catch {
      try {
        await Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`);
      } catch {
        toast.error(isAr ? 'تعذر فتح واتساب' : 'Could not open WhatsApp');
      }
    }
  };

  // --- 4. PLACE ORDER & DISPATCH ---
  const handlePlaceOrder = async () => {
    const selectedAddr = addresses.find((a) => a._id === selectedAddrId);
    if (!selectedAddr) {
      toast.error(isAr ? 'يرجى اختيار عنوان التوصيل' : 'Please select a delivery address');
      return;
    }
    if (!paymentMethod) {
      toast.error(isAr ? 'يرجى تحديد طريقة الدفع المفضلة أولاً' : 'Please choose a payment method first');
      return;
    }
    if (cartItems.length === 0) {
      toast.error(isAr ? 'سلتك فارغة' : 'Your basket is empty');
      return;
    }
    if (totalPrice === null) {
      toast.error(
        isAr
          ? 'تعذر تحميل أسعار بعض المنتجات. يرجى العودة إلى السلة والمحاولة مرة أخرى.'
          : 'Some product prices could not be loaded. Return to the cart and try again.'
      );
      return;
    }

    setIsProcessing(true);

    const finalAddress = {
      street: selectedAddr.street,
      aptNumber: selectedAddr.aptNumber,
      city: selectedAddr.city || 'Alexandria',
      phone: user?.phone || '0000000000',
    };

    const payload = {
      orderItems: cartItems.map((item) => ({
        _id: item._id,
        product: item._id, // kept for backends that still read `product`
        quantity: item.quantity || 1,
        name: itemTitle(item),
      })),
      shippingAddress: finalAddress,
      paymentMethod,
      notes: notes.trim(),
    };

    try {
      const response = await apiClient.post('/orders', payload);
      const data = response?.data;
      const orderId = data?.order?._id || data?._id || data?.id || Date.now();
      const encoded = generateWhatsAppMessage(orderId, selectedAddr);

      // Save submitted order info so user remains on this page with all tools active
      setSubmittedOrder({
        orderId,
        selectedAddr,
        items: cartItems,
        subtotal: totalPrice,
        totalUnits,
      });

      toast.success(
        isAr ? 'تم إرسال الطلب! فتحنا لك محادثة واتساب.' : 'Order saved! WhatsApp conversation opened.'
      );

      // Bring the success banner into view for when the user returns from WhatsApp
      scrollRef.current?.scrollTo({ y: 0, animated: true });

      openWhatsApp(encoded);

      // Clear cart in background without redirecting
      if (clearCart) clearCart();
    } catch (err: any) {
      console.error('Checkout Error:', err);
      toast.error(
        err?.response?.data?.message ||
          (isAr ? 'حدث خطأ أثناء حفظ الطلب' : 'An error occurred during submission')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const isStep1Done = Boolean(selectedAddrId && paymentMethod);
  const shortRef = submittedOrder ? String(submittedOrder.orderId).slice(-6).toUpperCase() : '';
  const summaryItems = submittedOrder?.items ?? cartItems;
  const summaryTotalPrice = submittedOrder?.subtotal ?? totalPrice;
  const summaryTotalUnits = submittedOrder?.totalUnits ?? totalUnits;

  /* ----------------------- Unauthenticated gate ---------------------- */
  if (!token) {
    return (
      <View style={st.gate}>
        <Ionicons name="lock-closed-outline" size={48} color={ColorsPalette.muted} />
        <Text style={st.gateTitle}>{isAr ? 'سجّل الدخول للمتابعة' : 'Sign In to Proceed'}</Text>
        <Text style={st.gateSub}>
          {isAr
            ? 'يلزم وجود حساب لتسجيل عنوان التوصيل في الإسكندرية ومتابعة طلباتك.'
            : 'An account is required to register your Alexandria delivery address and track inquiry orders.'}
        </Text>
        <PrimaryButton
          compact
          label={isAr ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}
          onPress={() => router.push('/(auth)/login' as any)}
        />
      </View>
    );
  }

  /* ----------------------------- Payment options ---------------------------- */
  const paymentOptions = [
    {
      key: 'CashOnDelivery',
      accent: P.emerald600,
      bg: 'rgba(236,253,245,0.5)',
      ring: 'rgba(16,185,129,0.2)',
      icon: (c: string) => <Feather name="truck" size={24} color={c} />,
      title: isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery',
      sub: isAr ? 'كاش مع المندوب' : 'Pay cash to courier',
    },
    {
      key: 'InstaPay',
      accent: P.purple600,
      bg: 'rgba(250,245,255,0.5)',
      ring: 'rgba(168,85,247,0.2)',
      icon: (c: string) => <Feather name="smartphone" size={24} color={c} />,
      title: 'انستا باي (InstaPay)',
      sub: isAr ? 'تحويل لحظي بالاسم/الرقم' : 'Instant IPN Transfer',
    },
    {
      key: 'VodafoneCash',
      accent: RED,
      bg: 'rgba(254,242,242,0.5)',
      ring: 'rgba(239,68,68,0.2)',
      icon: (c: string) => <Ionicons name="wallet-outline" size={24} color={c} />,
      title: 'فودافون كاش (Vodafone Cash)',
      sub: isAr ? 'تحويل لمحفظة الصيدلية' : 'Mobile Wallet Transfer',
    },
  ];

  const sectionPad = isSm ? 24 : 20;
  const ctaDisabled = mode !== 'list' || !selectedAddrId || !paymentMethod || cartItems.length === 0;

  /* ------------------------------- Render ------------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: ColorsPalette.pageBase }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: isSm ? 24 : 12, paddingTop: 16, paddingBottom: 96 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Entrance style={[st.page, { direction: isAr ? 'rtl' : 'ltr' }]}>
            {/* Navigation top bar: breadcrumbs + back */}
            
              

            {/* Post-order WhatsApp success banner */}
            {submittedOrder && (
              <Entrance style={[st.successBanner, SHADOW.md, { padding: sectionPad }]}>
                <View style={[st.successHead, isSm && st.successHeadSm]}>
                  <View style={st.rowCenter12}>
                    <View style={st.successCheck}>
                      <Feather name="check" size={22} color={P.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[st.successTitle, { fontSize: isSm ? 18 : 16 }]}>
                        {isAr
                          ? 'تم تسجيل طلبك وإرساله عبر واتساب بنجاح!'
                          : 'Your order is recorded and sent via WhatsApp!'}
                      </Text>
                      <Text style={st.successRef}>
                        {isAr
                          ? `رقم المرجع: #${shortRef} — يمكنك متابعة الدفع أدناه فور رد الصيدلي.`
                          : `Ref #${shortRef} — Use the payment details below once quoted.`}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => router.push('/my-orders' as any)}
                    style={({ pressed }) => [st.ordersBtn, SHADOW.sm, pressed && { backgroundColor: '#D1FAE5' }]}
                  >
                    <Text style={st.ordersBtnText}>{isAr ? 'عرض سجل طلباتي' : 'View My Orders'}</Text>
                  </Pressable>
                </View>

                <Text style={st.successHint}>
                  {isAr
                    ? '💡 يمكنك البقاء في هذه الصفحة لاستخدام بيانات التحويل (انستا باي / فودافون كاش) ونسخ الأرقام بمجرد أن يخبرك الصيدلي بإجمالي المبلغ في المحادثة.'
                    : '💡 You can stay on this page to easily copy InstaPay / Vodafone Cash details once the pharmacist gives you the exact total.'}
                </Text>
              </Entrance>
            )}

            {/* Page header */}
            <View style={[st.header, isSm && st.headerSm]}>
              <View style={isSm ? { flex: 1 } : undefined}>
                <View style={st.rowCenter8}>
                  <Pressable onPress={goBack} hitSlop={8}>
                    <Feather name={isAr ? 'arrow-right' : 'arrow-left'} size={20} color={P.slate400} />
                  </Pressable>
                  <Text style={[st.h1, { fontSize: isSm ? 30 : 24, lineHeight: isSm ? 40 : 34 }]}>
                    {isAr ? 'تأكيد بيانات التوصيل والدفع' : 'Delivery & Payment Confirmation'}
                  </Text>
                </View>
                <Text style={[st.subtitle, { fontSize: isSm ? 14 : 12 }]}>
                  {isAr
                    ? 'خطوات بسيطة وسريعة لإرسال طلبك ومراجعته مع الصيدلي'
                    : 'Simple steps to register your details and confirm with the pharmacist'}
                </Text>
              </View>

              <View style={st.verified}>
                <Ionicons name="shield-checkmark" size={16} color={P.emerald700} />
                <Text style={st.verifiedText}>{isAr ? 'صيدلية ماريلاند المعتمدة' : 'Verified Maryland Pharmacy'}</Text>
              </View>
            </View>

            {/* 3-STEP ROADMAP */}
            <View style={[st.roadmap, SHADOW.sm, { padding: isSm ? 24 : 16 }]}>
              <View style={{ flexDirection: isMd ? 'row' : 'column', gap: 16 }}>
                {/* STEP 1 */}
                <View
                  style={[
                    st.stepCard,
                    isMd && { flex: 1 },
                    isStep1Done
                      ? { backgroundColor: 'rgba(236,253,245,0.8)', borderWidth: 1, borderColor: P.emerald200 }
                      : { backgroundColor: P.white, borderWidth: 2, borderColor: RED, ...SHADOW.md, shadowColor: '#EF4444' },
                  ]}
                >
                  <Loop kind="bounce" active={!isStep1Done} style={[st.stepBadge, { backgroundColor: isStep1Done ? P.emerald600 : RED }]}>
                    {isStep1Done ? (
                      <Feather name="check-circle" size={20} color={P.white} />
                    ) : (
                      <Text style={st.stepBadgeNum}>1</Text>
                    )}
                  </Loop>
                  <View style={{ flex: 1 }}>
                    <View style={st.rowCenter8}>
                      <Text style={st.stepEyebrow}>{isAr ? 'الخطوة الأولى' : 'Step 1'}</Text>
                      <Loop
                        kind="pulse"
                        active={!isStep1Done}
                        style={[
                          st.chip,
                          { backgroundColor: isStep1Done ? 'rgba(167,243,208,0.7)' : P.red100 },
                        ]}
                      >
                        <Text style={[st.chipText, { color: isStep1Done ? P.emerald900 : RED }]}>
                          {isStep1Done ? (isAr ? 'مكتملة ✓' : 'Done ✓') : isAr ? 'جاري الآن' : 'In Progress'}
                        </Text>
                      </Loop>
                    </View>
                    <Text style={st.stepTitle}>{isAr ? 'تحديد العنوان وطريقة الدفع' : 'Address & Payment Preference'}</Text>
                    <Text style={st.stepDesc}>
                      {isAr
                        ? 'اختر عنوانك، ثم اضغط على طريقة الدفع التي تناسبك من الثلاث طرق بالأسفل'
                        : 'Pick your address, then tap your preferred payment method from the 3 options below'}
                    </Text>
                  </View>
                </View>

                {/* STEP 2 */}
                <View
                  style={[
                    st.stepCard,
                    isMd && { flex: 1 },
                    {
                      borderWidth: 1,
                      backgroundColor: submittedOrder ? 'rgba(236,253,245,0.8)' : P.white,
                      borderColor: submittedOrder ? P.emerald200 : 'rgba(226,232,240,0.8)',
                    },
                  ]}
                >
                  <View style={[st.stepBadge, { backgroundColor: P.slate100 }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={P.emerald600} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.stepEyebrow, { color: P.slate700 }]}>{isAr ? 'الخطوة الثانية' : 'Step 2'}</Text>
                    <Text style={st.stepTitle}>
                      {isAr ? 'اضغط "تأكيد الطلب" — سيفتح واتساب' : 'Tap "Confirm Order" — WhatsApp will open'}
                    </Text>
                    <Text style={st.stepDesc}>
                      {isAr
                        ? 'أسعار المنتجات ظاهرة في ملخص الطلب، وسيؤكد الصيدلي رسوم التوصيل حسب منطقتك عبر واتساب بعد الإرسال.'
                        : 'Product prices are shown above. The pharmacist confirms your area-specific delivery fee on WhatsApp after submission.'}
                    </Text>
                  </View>
                </View>

                {/* STEP 3 — dynamic by payment method */}
                <View
                  style={[
                    st.stepCard,
                    isMd && { flex: 1 },
                    {
                      borderWidth: 1,
                      backgroundColor:
                        paymentMethod === 'CashOnDelivery'
                          ? 'rgba(236,253,245,0.8)'
                          : paymentMethod
                          ? 'rgba(255,251,235,0.8)'
                          : P.white,
                      borderColor:
                        paymentMethod === 'CashOnDelivery'
                          ? P.emerald200
                          : paymentMethod
                          ? P.amber300
                          : 'rgba(226,232,240,0.8)',
                    },
                  ]}
                >
                  <Loop
                    kind="pulse"
                    active={!!paymentMethod && paymentMethod !== 'CashOnDelivery'}
                    style={[
                      st.stepBadge,
                      {
                        backgroundColor:
                          paymentMethod === 'CashOnDelivery' ? P.emerald600 : paymentMethod ? P.amber500 : P.slate100,
                      },
                    ]}
                  >
                    {paymentMethod === 'CashOnDelivery' ? (
                      <Feather name="truck" size={20} color={P.white} />
                    ) : paymentMethod ? (
                      <Feather name="corner-up-left" size={20} color={P.white} />
                    ) : (
                      <Feather name="package" size={20} color={P.purple600} />
                    )}
                  </Loop>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.stepEyebrow, { color: P.slate700 }]}>{isAr ? 'الخطوة الثالثة' : 'Step 3'}</Text>
                    <Text style={st.stepTitle}>
                      {paymentMethod === 'CashOnDelivery'
                        ? isAr
                          ? 'استلام الدواء والدفع كاش — انتهيت! ✓'
                          : "Receive Order & Pay Cash — You're Done! ✓"
                        : paymentMethod
                        ? isAr
                          ? 'ارجع لهذه الصفحة لإتمام التحويل'
                          : 'Come Back to This Page to Pay'
                        : isAr
                        ? 'استلام الدواء والدفع'
                        : 'Delivery & Payment'}
                    </Text>
                    <Text style={st.stepDesc}>
                      {paymentMethod === 'CashOnDelivery'
                        ? isAr
                          ? 'ادفع نقداً للمندوب عند استلام الدواء على باب منزلك — لا حاجة لأي خطوات أخرى'
                          : 'Pay cash to the courier at your door when the order arrives — nothing else to do'
                        : paymentMethod
                        ? isAr
                          ? 'بعد تأكيد رسوم التوصيل مع الصيدلي عبر واتساب، ارجع هنا لتنفيذ التحويل، ثم أرسل صورة الإيصال في نفس محادثة الواتساب'
                          : 'After the pharmacist confirms the delivery fee on WhatsApp, return here to complete the transfer, then send the receipt screenshot in the same chat'
                        : isAr
                        ? 'توصيل سريع لباب منزلك بالإسكندرية'
                        : 'Doorstep delivery with receipt across Alexandria'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* DELIVERY FEE NOTICE */}
              <Entrance style={st.feeNotice}>
                <Loop kind="pulse" style={[st.feeIcon, { width: isSm ? 40 : 36, height: isSm ? 40 : 36 }]}>
                  <Feather name="truck" size={18} color={P.white} />
                </Loop>
                <Text style={[st.feeText, { fontSize: isSm ? 14 : 12, lineHeight: isSm ? 21 : 19 }]}>
                  {isAr
                    ? '🚚 رسوم التوصيل غير مشمولة في مجموع المنتجات، وسيؤكدها الصيدلي عبر واتساب بعد إرسال الطلب.'
                    : '🚚 The item subtotal excludes delivery. Your area-specific delivery fee will be confirmed by the pharmacist on WhatsApp after you submit the order.'}
                </Text>
              </Entrance>
            </View>

            {/* MAIN GRID */}
            <View style={isLg ? st.gridWide : st.gridNarrow}>
              {/* LEFT COLUMN */}
              <View style={[{ gap: 24 }, isLg && { flex: 2 }]}>
                {/* User contact pill */}
                <View style={[st.card, SHADOW.sm, { padding: 20 }, isSm ? st.contactRow : st.contactCol]}>
                  <View style={st.rowCenter14}>
                    <View style={[st.contactIcon, { backgroundColor: P.slate100 }]}>
                      <Feather name="user" size={20} color={P.slate700} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.microLabel}>{isAr ? 'اسم المستلم' : 'Recipient'}</Text>
                      <Text style={st.contactValue}>{user?.name || (isAr ? 'عميل' : 'Customer')}</Text>
                    </View>
                  </View>

                  <View style={[st.rowCenter14, !isSm && st.contactDivider]}>
                    <View style={[st.contactIcon, { backgroundColor: P.emerald50 }]}>
                      <Feather name="phone" size={19} color={P.emerald700} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.microLabel}>{isAr ? 'رقم الهاتف للتواصل' : 'Contact Phone'}</Text>
                      <Text style={st.contactValue}>{user?.phone || (isAr ? 'غير مسجل' : 'Not recorded')}</Text>
                    </View>
                  </View>
                </View>

                {/* 1. Address section */}
                <View style={[st.card, SHADOW.sm, { padding: sectionPad, gap: 16 }]}>
                  <View style={st.sectionHead}>
                    <View style={[st.rowCenter8, { flex: 1 }]}>
                      <Feather name="map-pin" size={20} color={RED} />
                      <Text style={[st.sectionTitle, { fontSize: isSm ? 18 : 16, flex: 1 }]}>
                        {isAr ? '١. عنوان التوصيل (الإسكندرية)' : '1. Delivery Address (Alexandria)'}
                      </Text>
                    </View>

                    {mode === 'list' && addresses.length > 0 && addresses.length < 3 && (
                      <Pressable
                        onPress={() => {
                          setMode('add');
                          setForm({ street: '', building: '', city: 'Alexandria' });
                        }}
                        hitSlop={8}
                        style={st.addLink}
                      >
                        <Feather name="plus" size={15} color={RED} />
                        <Text style={st.addLinkText}>{isAr ? 'إضافة عنوان جديد' : 'Add new address'}</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Address list */}
                  {mode === 'list' && (
                    <View style={{ gap: 12 }}>
                      {addresses.length === 0 ? (
                        <View style={st.emptyAddr}>
                          <Feather name="map-pin" size={30} color={P.slate300} style={{ marginBottom: 8 }} />
                          <Text style={st.emptyAddrText}>
                            {isAr ? 'لم تسجل عنوان توصيل بعد' : 'No saved delivery address yet'}
                          </Text>
                          <PrimaryButton
                            compact
                            label={isAr ? 'إضافة عنوان الآن' : 'Add Address Now'}
                            onPress={() => setMode('add')}
                          />
                        </View>
                      ) : (
                        addresses.map((addr) => {
                          const isSelected = selectedAddrId === addr._id;
                          return (
                            <Pressable
                              key={addr._id}
                              onPress={() => setSelectedAddrId(addr._id)}
                              accessibilityRole="radio"
                              accessibilityState={{ selected: isSelected }}
                              style={[
                                st.addrCard,
                                isSelected
                                  ? { borderColor: RED, backgroundColor: 'rgba(254,242,242,0.2)' }
                                  : { borderColor: 'rgba(226,232,240,0.8)', backgroundColor: P.white },
                              ]}
                            >
                              <View style={[st.rowCenter12, { flex: 1 }]}>
                                <View style={[st.radio, { borderColor: isSelected ? RED : P.slate300 }]}>
                                  {isSelected && <View style={st.radioDot} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={[st.addrStreet, { fontSize: isSm ? 16 : 14 }]}>{addr.street}</Text>
                                  <Text style={st.addrSub}>
                                    {isAr ? 'عمارة / رقم الشقة:' : 'Building/Flat:'} {addr.aptNumber} —{' '}
                                    <Text style={{ color: P.slate400 }}>{isAr ? 'الإسكندرية' : 'Alexandria'}</Text>
                                  </Text>
                                </View>
                              </View>

                              <View style={{ flexDirection: 'row', gap: 4 }}>
                                <Pressable
                                  onPress={() => startEdit(addr)}
                                  hitSlop={6}
                                  accessibilityLabel={isAr ? 'تعديل' : 'Edit'}
                                  style={({ pressed }) => [st.iconBtn, pressed && { backgroundColor: P.slate100 }]}
                                >
                                  <Feather name="edit-3" size={15} color={P.slate400} />
                                </Pressable>
                                <Pressable
                                  onPress={() => setAddressToDelete(addr._id)}
                                  hitSlop={6}
                                  accessibilityLabel={isAr ? 'حذف' : 'Delete'}
                                  style={({ pressed }) => [st.iconBtn, pressed && { backgroundColor: P.red50 }]}
                                >
                                  <Feather name="trash-2" size={15} color={P.slate400} />
                                </Pressable>
                              </View>
                            </Pressable>
                          );
                        })
                      )}
                    </View>
                  )}

                  {/* Address add / edit form */}
                  {(mode === 'add' || mode === 'edit') && (
                    <Entrance style={[st.addrForm, { padding: isSm ? 20 : 16 }]}>
                      <View style={st.addrFormHead}>
                        <Text style={[st.addrFormTitle, { fontSize: isSm ? 14 : 12 }]}>
                          {mode === 'add'
                            ? isAr
                              ? 'إضافة عنوان جديد للتوصيل'
                              : 'Add New Delivery Address'
                            : isAr
                            ? 'تعديل العنوان الحالي'
                            : 'Edit Address'}
                        </Text>
                        <Pressable onPress={() => setMode('list')} hitSlop={8}>
                          <Feather name="x" size={18} color={P.slate400} />
                        </Pressable>
                      </View>

                      <View style={{ gap: 12 }}>
                        <View>
                          <Text style={st.fieldLabel}>{isAr ? 'اسم الشارع والمنطقة *' : 'Street & District *'}</Text>
                          <Field
                            rtl={isAr}
                            placeholder={isAr ? 'مثال: شارع سوريا، رشدي' : 'e.g. Syria St, Roushdy'}
                            value={form.street}
                            onChangeText={(v) => setForm({ ...form, street: v })}
                          />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={st.fieldLabel}>{isAr ? 'رقم العمارة / الشقة *' : 'Building / Apt No. *'}</Text>
                            <Field
                              rtl={isAr}
                              placeholder={isAr ? 'عمارة 12 - شقة 4' : 'Bldg 12, Apt 4'}
                              value={form.building}
                              onChangeText={(v) => setForm({ ...form, building: v })}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={st.fieldLabel}>{isAr ? 'المدينة' : 'City'}</Text>
                            <TextInput
                              value={isAr ? 'الإسكندرية' : 'Alexandria'}
                              editable={false}
                              style={[st.input, st.inputReadonly, isAr && { textAlign: 'right' }]}
                            />
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                          <PrimaryButton
                            compact
                            loading={isProcessing}
                            label={isAr ? 'حفظ العنوان' : 'Save Address'}
                            icon={(c) => <Feather name="save" size={15} color={c} />}
                            onPress={mode === 'add' ? handleSaveAddress : handleUpdateAddress}
                          />
                          <Pressable
                            onPress={() => setMode('list')}
                            style={({ pressed }) => [st.cancelBtn, pressed && { backgroundColor: 'rgba(226,232,240,0.6)' }]}
                          >
                            <Text style={st.cancelBtnText}>{isAr ? 'إلغاء' : 'Cancel'}</Text>
                          </Pressable>
                        </View>
                      </View>
                    </Entrance>
                  )}
                </View>

                {/* 2. Payment method selection */}
                <View style={[st.card, SHADOW.sm, { padding: sectionPad, gap: 16 }]}>
                  <View style={st.sectionHead}>
                    <View style={[st.rowCenter8, { flex: 1 }]}>
                      <Feather name="credit-card" size={20} color={RED} />
                      <Text style={[st.sectionTitle, { fontSize: isSm ? 18 : 16, flex: 1 }]}>
                        {isAr ? '٢. طريقة الدفع المفضلة' : '2. Payment Preference'}
                      </Text>
                    </View>
                    {!paymentMethod && (
                      <View style={st.requiredChip}>
                        <Text style={st.requiredChipText}>{isAr ? 'مطلوب الاختيار' : 'Selection required'}</Text>
                      </View>
                    )}
                  </View>

                  {/* 3 payment options */}
                  <View style={{ flexDirection: isSm ? 'row' : 'column', gap: 12 }}>
                    {paymentOptions.map((opt) => {
                      const selected = paymentMethod === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => setPaymentMethod(opt.key)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          style={[
                            st.payOpt,
                            isSm && { flex: 1 },
                            selected
                              ? {
                                  borderColor: opt.accent,
                                  backgroundColor: opt.bg,
                                  ...SHADOW.md,
                                }
                              : { borderColor: P.slate200, backgroundColor: P.white },
                          ]}
                        >
                          <View style={[st.payOptIcon, { backgroundColor: selected ? opt.accent : P.slate100 }]}>
                            {opt.icon(selected ? P.white : P.slate600)}
                          </View>
                          <View style={{ alignItems: 'center' }}>
                            <Text style={[st.payOptTitle, { fontSize: isSm ? 14 : 12 }]}>{opt.title}</Text>
                            <Text style={st.payOptSub}>{opt.sub}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* PAYMENT INSTRUCTIONS */}
                  {paymentMethod === 'CashOnDelivery' && (
                    <Entrance key="cod" style={st.codPanel}>
                      <View style={st.rowCenter6}>
                        <Feather name="check-circle" size={16} color={P.emerald600} />
                        <Text style={st.codTitle}>{isAr ? 'طريقة سهلة ومباشرة:' : 'Simple & Direct:'}</Text>
                      </View>
                      <Text style={st.codText}>
                        {isAr
                          ? 'ادفع مجموع أسعار المنتجات المعروض بالإضافة إلى رسوم التوصيل للمندوب عند الاستلام. سيؤكد الصيدلي رسوم منطقتك عبر واتساب بعد إرسال الطلب.'
                          : 'Pay the order subtotal plus the delivery fee to the courier. The pharmacist will confirm the area-specific delivery fee on WhatsApp after submission.'}
                      </Text>
                    </Entrance>
                  )}

                  {paymentMethod === 'InstaPay' && (
                    <Entrance key="instapay" style={[st.transferPanel, st.instaPanel, { padding: isSm ? 20 : 16 }]}>
                      <View style={[st.panelHead, { borderBottomColor: 'rgba(233,213,255,0.8)' }]}>
                        <View style={[st.rowCenter8, { flex: 1 }]}>
                          <Feather name="smartphone" size={18} color={P.purple700} />
                          <Text style={[st.panelTitle, { color: P.purple900 }]}>
                            {isAr ? 'خطوات التحويل عبر انستا باي:' : 'InstaPay Transfer Details:'}
                          </Text>
                        </View>
                        <Text style={[st.panelSteps, { color: P.purple700 }]}>{isAr ? '4 خطوات' : '4 Steps'}</Text>
                      </View>

                      <View style={{ gap: 12 }}>
                        <View style={st.stepLine}>
                          <NumCircle n="1" color={P.purple600} />
                          <Text style={st.stepLineText}>
                            {isAr
                              ? 'أسعار المنتجات ظاهرة في ملخص الطلب. تواصل مع الصيدلي عبر واتساب لتأكيد رسوم التوصيل حسب منطقتك بعد الإرسال.'
                              : 'The item prices are shown in your order summary. Confirm the area-specific delivery fee with the pharmacist on WhatsApp after submission.'}
                          </Text>
                        </View>

                        <ReturnStep
                          text={
                            isAr
                              ? 'ارجع إلى هذه الصفحة (موقع صيدلية ماريلاند) لترى بيانات التحويل بالأسفل.'
                              : 'Return to this page (Maryland Pharmacy website) to see the transfer details below.'
                          }
                        />

                        <View style={st.stepLine}>
                          <NumCircle n="3" color={P.purple600} />
                          <View style={{ flex: 1 }}>
                            <Text style={[st.stepLineText, { marginBottom: 6 }]}>
                              {isAr
                                ? 'افتح تطبيق انستا باي وقم بالتحويل لمعرف الصيدلية أو رقم الهاتف:'
                                : 'Open InstaPay and transfer to our IPA or Phone:'}
                            </Text>

                            <View style={{ flexDirection: isSm ? 'row' : 'column', gap: 8, marginTop: 4 }}>
                              <CopyBox
                                style={isSm ? { flex: 1 } : undefined}
                                label="IPA المعرف:"
                                value={PAYMENT_INFO.InstaPay.textLink}
                                accent={P.purple700}
                                border={P.purple200}
                                copyLabel={isAr ? 'نسخ' : 'Copy'}
                                onCopy={() => copyToClipboard(PAYMENT_INFO.InstaPay.textLink)}
                              />
                              <CopyBox
                                style={isSm ? { flex: 1 } : undefined}
                                label={isAr ? 'رقم الهاتف:' : 'Phone:'}
                                value={PAYMENT_INFO.InstaPay.number}
                                accent={P.purple700}
                                border={P.purple200}
                                copyLabel={isAr ? 'نسخ' : 'Copy'}
                                onCopy={() => copyToClipboard(PAYMENT_INFO.InstaPay.number)}
                              />
                            </View>

                            <Pressable
                              onPress={() => Linking.openURL(PAYMENT_INFO.InstaPay.link)}
                              hitSlop={6}
                              style={[st.rowCenter6, { marginTop: 8, alignSelf: 'flex-start' }]}
                            >
                              <Feather name="external-link" size={13} color={P.purple700} />
                              <Text style={[st.linkText, { color: P.purple700 }]}>
                                {isAr
                                  ? 'أو افتح رابط الدفع المباشر لتطبيق انستا باي'
                                  : 'Or open direct InstaPay app link'}
                              </Text>
                            </Pressable>
                          </View>
                        </View>

                        <View style={st.stepLine}>
                          <NumCircle n="4" color={P.purple600} />
                          <Text style={st.stepLineText}>
                            {isAr
                              ? 'أرسل لقطة شاشة (Screenshot) لعملية التحويل للصيدلي على نفس محادثة الواتساب ليخرج الطلب فوراً.'
                              : 'Send the transfer screenshot to the pharmacist in WhatsApp for instant dispatch.'}
                          </Text>
                        </View>
                      </View>

                      <View style={[st.notice, { backgroundColor: 'rgba(243,232,255,0.7)' }]}>
                        <Feather name="help-circle" size={15} color={P.purple700} />
                        <Text style={[st.noticeText, { color: P.purple900 }]}>
                          {isAr
                            ? 'تنبيه: لا تقم بالتحويل الآن! انتظر حتى يؤكد الصيدلي رسوم التوصيل والإجمالي النهائي أولاً.'
                            : 'Notice: Do not transfer yet. Wait for the pharmacist to confirm the delivery fee and final amount.'}
                        </Text>
                      </View>
                    </Entrance>
                  )}

                  {paymentMethod === 'VodafoneCash' && (
                    <Entrance key="vodafone" style={[st.transferPanel, st.vodaPanel, { padding: isSm ? 20 : 16 }]}>
                      <View style={[st.panelHead, { borderBottomColor: 'rgba(254,202,202,0.8)' }]}>
                        <View style={[st.rowCenter8, { flex: 1 }]}>
                          <Ionicons name="wallet-outline" size={18} color={RED} />
                          <Text style={[st.panelTitle, { color: RED }]}>
                            {isAr ? 'خطوات التحويل عبر فودافون كاش:' : 'Vodafone Cash Instructions:'}
                          </Text>
                        </View>
                        <Text style={[st.panelSteps, { color: RED }]}>{isAr ? '4 خطوات' : '4 Steps'}</Text>
                      </View>

                      <View style={{ gap: 12 }}>
                        <View style={st.stepLine}>
                          <NumCircle n="1" color={RED} />
                          <Text style={st.stepLineText}>
                            {isAr
                              ? 'أرسل الطلب عبر واتساب لتأكيد رسوم التوصيل حسب منطقتك والتأكد من توافر المنتجات.'
                              : 'Send the order via WhatsApp to confirm the delivery fee for your area and product availability.'}
                          </Text>
                        </View>

                        <ReturnStep
                          text={
                            isAr
                              ? 'ارجع إلى هذه الصفحة (موقع صيدلية ماريلاند) لترى رقم المحفظة بالأسفل.'
                              : 'Return to this page (Maryland Pharmacy website) to see the wallet number below.'
                          }
                        />

                        <View style={st.stepLine}>
                          <NumCircle n="3" color={RED} />
                          <View style={{ flex: 1 }}>
                            <Text style={[st.stepLineText, { marginBottom: 6 }]}>
                              {isAr
                                ? 'حوّل المبلغ إلى رقم محفظة الصيدلية التالي:'
                                : 'Transfer the total to our official pharmacy wallet:'}
                            </Text>

                            <CopyBox
                              strong
                              style={{ maxWidth: 384 }}
                              label={isAr ? 'رقم محفظة فودافون كاش:' : 'Wallet Number:'}
                              value={PAYMENT_INFO.VodafoneCash.number}
                              accent={RED}
                              border={P.red200}
                              copyLabel={isAr ? 'نسخ الرقم' : 'Copy'}
                              onCopy={() => copyToClipboard(PAYMENT_INFO.VodafoneCash.number)}
                            />

                            <Pressable
                              onPress={() => Linking.openURL(PAYMENT_INFO.VodafoneCash.link)}
                              hitSlop={6}
                              style={[st.rowCenter6, { marginTop: 8, alignSelf: 'flex-start' }]}
                            >
                              <Feather name="external-link" size={13} color={RED} />
                              <Text style={[st.linkText, { color: RED }]}>
                                {isAr
                                  ? 'أو افتح رابط الدفع المباشر من فودافون'
                                  : 'Or open direct Vodafone Cash link'}
                              </Text>
                            </Pressable>
                          </View>
                        </View>

                        <View style={st.stepLine}>
                          <NumCircle n="4" color={RED} />
                          <Text style={st.stepLineText}>
                            {isAr
                              ? 'أرسل صورة رسالة التأكيد (SMS) للصيدلي عبر واتساب لتأكيد خروج الدواء.'
                              : 'Send the confirmation SMS screenshot to the pharmacist via WhatsApp to dispatch.'}
                          </Text>
                        </View>
                      </View>

                      <View style={[st.notice, { backgroundColor: 'rgba(254,226,226,0.7)' }]}>
                        <Feather name="help-circle" size={15} color={RED} />
                        <Text style={[st.noticeText, { color: P.red950 }]}>
                          {isAr
                            ? 'تنبيه: لا تقم بالتحويل الآن! انتظر رسالة الصيدلي أولاً لتحديد المبلغ.'
                            : 'Notice: Do not transfer now! Wait for the pharmacist message to know the total.'}
                        </Text>
                      </View>
                    </Entrance>
                  )}
                </View>
              </View>

              {/* RIGHT COLUMN: order summary + confirm */}
              <View style={isLg ? { flex: 1 } : undefined}>
                <View style={[st.card, SHADOW.lg, { padding: sectionPad, gap: 20 }]}>
                  <View style={st.summaryHead}>
                    <Text style={st.summaryTitle}>{isAr ? 'ملخص الطلب' : 'Order Summary'}</Text>
                    <View style={st.countChip}>
                      <Text style={st.countChipText}>
                        {summaryItems.length} {isAr ? 'أصناف' : 'items'} ({summaryTotalUnits} {isAr ? 'قطعة' : 'units'})
                      </Text>
                    </View>
                  </View>

                  {/* Scrollable items mini-list */}
                  <ScrollView style={{ maxHeight: 176 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {summaryItems.map((item) => (
                      <View key={item._id} style={st.itemRow}>
                        <Text style={st.itemName} numberOfLines={1}>
                          {itemTitle(item)}
                        </Text>
                        <Text style={st.itemPrice} numberOfLines={1}>
                          ×{item.quantity || 1} ·{' '}
                          {typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice)
                            ? formatPrice(item.unitPrice * (item.quantity || 1), lang)
                            : t('product.priceUnavailable')}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={st.subtotalRow}>
                    <Text style={st.subtotalLabel}>{isAr ? 'المجموع الفرعي' : 'Items subtotal'}</Text>
                    <Text style={st.subtotalValue}>
                      {summaryTotalPrice === null
                        ? t('product.priceUnavailable')
                        : formatPrice(summaryTotalPrice, lang)}
                    </Text>
                  </View>
                  <Text style={st.deliveryFeeText}>{t('cart.deliveryFeeNotice')}</Text>

                  {/* Selected payment tag */}
                  <View style={st.payTag}>
                    <Text style={{ color: P.slate500, fontSize: 12, fontWeight: '700' }}>
                      {isAr ? 'طريقة الدفع:' : 'Payment:'}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: paymentMethod ? '900' : '700',
                        color: paymentMethod ? P.slate900 : P.amber600,
                      }}
                    >
                      {paymentMethod
                        ? paymentMethod === 'CashOnDelivery'
                          ? isAr
                            ? 'الدفع عند الاستلام'
                            : 'Cash on Delivery'
                          : paymentMethod === 'InstaPay'
                          ? 'انستا باي'
                          : 'فودافون كاش'
                        : isAr
                        ? 'لم تحدد بعد'
                        : 'Not chosen'}
                    </Text>
                  </View>

                  {/* Customer notes */}
                  <View style={{ gap: 6, paddingTop: 4 }}>
                    <Text style={st.fieldLabel2}>{isAr ? 'ملاحظات للصيدلي (اختياري)' : 'Notes (Optional)'}</Text>
                    <Field
                      rtl={isAr}
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                      style={st.notesInput}
                      placeholder={
                        isAr
                          ? 'أي ملاحظات بخصوص العنوان أو مواعيد التسليم...'
                          : 'Any delivery or item instructions...'
                      }
                    />
                  </View>

                  {/* Confirm CTA */}
                  <PrimaryButton
                    fullWidth
                    loading={isProcessing}
                    disabled={ctaDisabled}
                    icon={(c) => <Ionicons name="logo-whatsapp" size={18} color={c} />}
                    onPress={handlePlaceOrder}
                    style={{ paddingVertical: 14, borderRadius: 16 }}
                    label={
                      !selectedAddrId
                        ? isAr
                          ? 'يرجى اختيار عنوان التوصيل'
                          : 'Select Delivery Address'
                        : !paymentMethod
                        ? isAr
                          ? 'يرجى اختيار طريقة الدفع أولاً'
                          : 'Select Payment Method'
                        : isAr
                        ? 'إرسال وتأكيد الطلب عبر واتساب'
                        : 'Confirm Order via WhatsApp'
                    }
                  />

                  <View style={st.trust}>
                    <Feather name="check-circle" size={13} color={P.emerald600} />
                    <Text style={st.trustText}>
                      {isAr
                        ? 'تسجيل مباشر للطلب — تأكيد نهائي عبر واتساب'
                        : 'Direct order saving — WhatsApp verification'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Entrance>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete address modal */}
      <Modal
        visible={!!addressToDelete}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => !isProcessing && setAddressToDelete(null)}
      >
        <View style={[st.overlay, { direction: isAr ? 'rtl' : 'ltr' }]}>
          {!!addressToDelete && (
            <Entrance variant="scale" style={[st.modalCard, SHADOW.lg]}>
              <Pressable
                onPress={() => setAddressToDelete(null)}
                disabled={isProcessing}
                hitSlop={8}
                style={st.modalClose}
              >
                <Feather name="x" size={18} color={P.slate400} />
              </Pressable>

              <View style={{ alignItems: 'center', marginTop: 4 }}>
                <View style={st.modalIcon}>
                  <Feather name="alert-triangle" size={28} color={RED} />
                </View>
                <Text style={st.modalTitle}>{isAr ? 'حذف العنوان؟' : 'Delete Address?'}</Text>
                <Text style={st.modalText}>
                  {isAr
                    ? 'هل أنت متأكد من حذف هذا العنوان من حسابك؟'
                    : 'Are you sure you want to delete this address?'}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
                  <Pressable
                    onPress={() => setAddressToDelete(null)}
                    disabled={isProcessing}
                    style={({ pressed }) => [st.modalBtn, { backgroundColor: pressed ? P.slate200 : P.slate100 }]}
                  >
                    <Text style={[st.modalBtnText, { color: P.slate700 }]}>{isAr ? 'إلغاء' : 'Cancel'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={confirmDelete}
                    disabled={isProcessing}
                    style={({ pressed }) => [st.modalBtn, { backgroundColor: pressed ? P.red700 : RED }]}
                  >
                    <Text style={[st.modalBtnText, { color: P.white }]}>
                      {isProcessing ? '...' : isAr ? 'حذف' : 'Delete'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Entrance>
          )}
        </View>
      </Modal>

      <ToastView toast={toastState} topInset={insets.top} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen wrapper                                                    */
/* ------------------------------------------------------------------ */

// Keeps the page rendered after submission even though the cart is cleared,
// and only redirects when the page is opened directly with an empty cart.
export default function CheckoutScreen() {
  const { user } = useAuth() as any;
  const cartCtx = useCart() as any;
  const items: any[] = cartCtx.cart ?? cartCtx.cartItems ?? [];

  const [hasVisitedWithItems] = useState(Boolean(items && items.length > 0));

  if (!hasVisitedWithItems && (!items || items.length === 0)) {
    return <Redirect href={'/(tabs)/cart' as any} />;
  }

  return <CheckoutContent key={user ? user._id : 'guest'} />;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const st = StyleSheet.create({
  page: { width: '100%', maxWidth: 1152, alignSelf: 'center', gap: 32 },

  rowCenter6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowCenter8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowCenter12: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowCenter14: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  /* top bar */
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  crumbs: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, flexWrap: 'wrap' },
  crumb: { fontSize: 12, color: P.slate500, fontWeight: '500' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.slate200,
    backgroundColor: P.white,
  },
  backBtnText: { fontSize: 12, fontWeight: '700', color: P.slate700 },

  /* success banner */
  successBanner: {
    borderRadius: 24,
    backgroundColor: P.emerald50,
    borderWidth: 2,
    borderColor: P.emerald300,
    gap: 16,
  },
  successHead: { gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: P.emerald200 },
  successHeadSm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  successCheck: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontWeight: '900', color: P.emerald950 },
  successRef: { fontSize: 12, color: P.emerald800, fontWeight: '500', marginTop: 2, lineHeight: 18 },
  ordersBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.emerald300,
    borderRadius: 12,
  },
  ordersBtnText: { fontSize: 12, fontWeight: '700', color: P.emerald900 },
  successHint: { fontSize: 12, color: P.emerald900, fontWeight: '500', lineHeight: 20 },

  /* header */
  header: { gap: 12, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: P.slate200 },
  headerSm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { flex: 1, fontWeight: '900', color: P.slate900, letterSpacing: -0.4 },
  subtitle: { color: P.slate500, fontWeight: '500', marginTop: 4, lineHeight: 20 },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: P.emerald50,
    borderWidth: 1,
    borderColor: P.emerald200,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  verifiedText: { color: P.emerald700, fontWeight: '700', fontSize: 12 },

  /* roadmap */
  roadmap: {
    backgroundColor: '#FCFDFD', // faint slate-50 → white → slate-50 gradient, flattened
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
    borderRadius: 24,
  },
  stepCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 14, borderRadius: 16 },
  stepBadge: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepBadgeNum: { color: P.white, fontWeight: '900', fontSize: 14 },
  stepEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    color: P.slate900,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  chipText: { fontSize: 10, fontWeight: '700' },
  stepTitle: { fontSize: 12, fontWeight: '700', color: P.slate900, marginTop: 4, lineHeight: 18 },
  stepDesc: { fontSize: 11, color: P.slate500, marginTop: 2, lineHeight: 16 },
  feeNotice: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: P.blue50,
    borderWidth: 2,
    borderColor: P.blue200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feeIcon: { borderRadius: 999, backgroundColor: P.blue600, alignItems: 'center', justifyContent: 'center' },
  feeText: { flex: 1, fontWeight: '700', color: P.blue950 },

  /* grid */
  gridNarrow: { gap: 32 },
  gridWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 32 },

  /* cards */
  card: {
    backgroundColor: P.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  contactCol: { gap: 16 },
  contactDivider: { paddingTop: 12, borderTopWidth: 1, borderTopColor: P.slate100 },
  contactIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  microLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: P.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contactValue: { fontSize: 15, fontWeight: '900', color: P.slate900, marginTop: 2 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontWeight: '900', color: P.slate900 },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLinkText: { fontSize: 12, fontWeight: '700', color: RED },

  emptyAddr: {
    alignItems: 'center',
    paddingVertical: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: P.slate200,
    borderRadius: 16,
  },
  emptyAddrText: { fontSize: 13, fontWeight: '700', color: P.slate700, marginBottom: 12 },

  addrCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: RED },
  addrStreet: { fontWeight: '700', color: P.slate900 },
  addrSub: { fontSize: 12, color: P.slate500, fontWeight: '500', marginTop: 2, lineHeight: 18 },
  iconBtn: { padding: 6, borderRadius: 12 },

  addrForm: {
    borderWidth: 1,
    borderColor: P.slate200,
    backgroundColor: 'rgba(248,250,252,0.7)',
    borderRadius: 16,
    gap: 14,
  },
  addrFormHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: P.slate200,
  },
  addrFormTitle: { fontWeight: '900', color: P.slate900, flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: P.slate700, marginBottom: 4 },
  fieldLabel2: { fontSize: 12, fontWeight: '700', color: P.slate700 },
  input: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate300,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: P.slate900,
  },
  inputReadonly: {
    backgroundColor: P.slate100,
    borderColor: P.slate200,
    color: P.slate500,
    fontWeight: '700',
  },
  notesInput: {
    borderColor: P.slate200,
    padding: 10,
    fontSize: 12,
    minHeight: 58,
    color: P.slate800,
  },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: P.slate600 },

  /* payment */
  requiredChip: {
    backgroundColor: P.amber50,
    borderWidth: 1,
    borderColor: P.amber200,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  requiredChipText: { fontSize: 11, fontWeight: '700', color: P.amber700 },
  payOpt: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  payOptIcon: { padding: 12, borderRadius: 16 },
  payOptTitle: { fontWeight: '900', color: P.slate900, textAlign: 'center' },
  payOptSub: { fontSize: 10, color: P.slate500, fontWeight: '500', marginTop: 2, textAlign: 'center' },

  codPanel: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: P.emerald50,
    borderWidth: 1,
    borderColor: P.emerald200,
    gap: 6,
  },
  codTitle: { fontSize: 14, fontWeight: '900', color: P.emerald900 },
  codText: { fontSize: 12, fontWeight: '500', color: 'rgba(6,78,59,0.9)', lineHeight: 20 },

  transferPanel: { borderRadius: 16, borderWidth: 1, gap: 16 },
  instaPanel: { backgroundColor: 'rgba(250,245,255,0.8)', borderColor: P.purple200 },
  vodaPanel: { backgroundColor: 'rgba(254,242,242,0.8)', borderColor: P.red200 },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  panelTitle: { fontSize: 14, fontWeight: '900', flex: 1 },
  panelSteps: { fontSize: 11, fontWeight: '700' },
  stepLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepLineText: { flex: 1, fontSize: 12, fontWeight: '500', color: P.slate800, lineHeight: 19 },
  numCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  numCircleText: { color: P.white, fontWeight: '900', fontSize: 11 },
  returnStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    marginHorizontal: -4,
    borderRadius: 12,
    backgroundColor: P.amber50,
    borderWidth: 1,
    borderColor: P.amber200,
  },
  returnIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: P.amber500,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  returnText: { flex: 1, fontSize: 12, fontWeight: '700', color: P.amber900, lineHeight: 19 },
  copyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: P.white,
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  copyLabel: { fontSize: 10, color: P.slate400, fontWeight: '700' },
  copyValue: { fontFamily: MONO },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, borderRadius: 10 },
  copyBtnText: { fontSize: 12, fontWeight: '700' },
  linkText: { fontSize: 12, fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12 },
  noticeText: { flex: 1, fontSize: 11, fontWeight: '700', lineHeight: 17 },

  /* summary */
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: P.slate900,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  countChip: { backgroundColor: P.slate100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  countChipText: { fontSize: 12, fontWeight: '700', color: P.slate500 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: P.slate50,
  },
  itemName: { flex: 1, fontSize: 12, fontWeight: '700', color: P.slate700 },
  itemPrice: { maxWidth: '52%', fontSize: 11, fontWeight: '800', color: P.slate900, textAlign: 'right' },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  subtotalLabel: { fontSize: 13, fontWeight: '800', color: P.slate900 },
  subtotalValue: { fontSize: 14, fontWeight: '900', color: P.emerald700 },
  deliveryFeeText: { fontSize: 11, fontWeight: '500', color: P.slate500, lineHeight: 16 },
  payTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: P.slate50,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
  },

  /* buttons */
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: RED },
  btnLarge: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16 },
  btnCompact: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  btnDisabled: { backgroundColor: P.slate300, opacity: 0.6 },
  btnText: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2, flexShrink: 1, textAlign: 'center' },

  trust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  trustText: { fontSize: 11, color: P.slate500, fontWeight: '500', textAlign: 'center', flexShrink: 1 },

  /* modal */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: {
    width: '100%',
    maxWidth: 384,
    backgroundColor: P.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: P.slate100,
  },
  modalClose: { position: 'absolute', top: 16, right: 16, zIndex: 2 },
  modalIcon: { backgroundColor: P.red50, padding: 14, borderRadius: 999, marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: P.slate900, marginBottom: 4 },
  modalText: { fontSize: 12, color: P.slate500, fontWeight: '500', marginBottom: 24, textAlign: 'center' },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { fontSize: 12, fontWeight: '700' },

  /* toast */
  toastWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 9999 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    maxWidth: 420,
  },
  toastIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toastText: { flexShrink: 1, fontSize: 14, fontWeight: '500', color: '#363636' },

  /* auth gate */
  gate: {
    flex: 1,
    backgroundColor: ColorsPalette.pageBase,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  gateTitle: { fontSize: 18, fontWeight: '800', color: ColorsPalette.ink },
  gateSub: { fontSize: 13, color: ColorsPalette.secondary, textAlign: 'center', lineHeight: 18, marginBottom: 12 },
});