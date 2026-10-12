// app/initial-language.tsx
import React, { useContext, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  I18nManager,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageContext } from '../src/context/LanguageContext';
import { Language } from '../src/i18n/translations';
import { Colors } from '../src/constants/Colors';

/* ------------------------------------------------------------------ */
/* Data + helpers                                                     */
/* ------------------------------------------------------------------ */

const { width } = Dimensions.get('window');

interface LanguageOption {
  code: Language;
  glyph: string; // shown in the badge
  nativeName: string; // the language written in itself
  otherName: string; // the language written in the other script
  rtl: boolean;
}

const OPTIONS: LanguageOption[] = [
  { code: 'en', glyph: 'Aa', nativeName: 'English', otherName: 'الإنجليزية', rtl: false },
  { code: 'ar', glyph: 'أب', nativeName: 'العربية', otherName: 'Arabic', rtl: true },
];

/**
 * Physical row direction for a card: English reads left→right, Arabic right→left,
 * no matter what direction the app itself is currently running in.
 */
const rowFor = (rtl: boolean): 'row' | 'row-reverse' =>
  rtl !== I18nManager.isRTL ? 'row-reverse' : 'row';

const NEUTRAL = '#C5CED6';

/* ------------------------------------------------------------------ */
/* Language card                                                      */
/* ------------------------------------------------------------------ */

function LanguageCard({
  option,
  selected,
  disabled,
  onPress,
}: {
  option: LanguageOption;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const [check] = useState(() => new Animated.Value(selected ? 1 : 0));

  useEffect(() => {
    Animated.spring(check, {
      toValue: selected ? 1 : 0,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [selected, check]);

  const align = option.rtl ? 'right' : 'left';
  const direction = option.rtl ? 'rtl' : 'ltr';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${option.nativeName}, ${option.otherName}`}
      style={({ pressed }) => [
        styles.card,
        { flexDirection: rowFor(option.rtl) },
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.badge, selected && styles.badgeSelected]}>
        <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
          {option.glyph}
        </Text>
      </View>

      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { textAlign: align, writingDirection: direction }]}>
          {option.nativeName}
        </Text>
        <Text style={[styles.cardSub, { textAlign: align, writingDirection: direction }]}>
          {option.otherName}
        </Text>
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        <Animated.View
          style={[styles.radioFill, { opacity: check, transform: [{ scale: check }] }]}
        >
          <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
        </Animated.View>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */

export default function InitialLanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setLanguage } = useContext(LanguageContext);

  const [selected, setSelected] = useState<Language | null>(null);
  const [busy, setBusy] = useState(false);

  // Three groups reveal one after another: header → cards → footer.
  const [enter] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  useEffect(() => {
    let cancelled = false;
    let anim: Animated.CompositeAnimation | undefined;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        enter.forEach((v) => v.setValue(1));
        return;
      }
      anim = Animated.stagger(
        120,
        enter.map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      );
      anim.start();
    });

    return () => {
      cancelled = true;
      anim?.stop();
    };
  }, [enter]);

  const reveal = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  const handleContinue = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await setLanguage(selected);
      await AsyncStorage.setItem('has_completed_onboarding', 'true');
      router.replace('/(tabs)');
    } catch {
      setBusy(false);
    }
  };

  const isAr = selected === 'ar';
  const canContinue = selected !== null && !busy;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 10, paddingBottom: Math.max(insets.bottom, 16) + 8 },
      ]}
    >
      <View pointerEvents="none" style={styles.blob} />

      {/* Wrapped the main body in a ScrollView to prevent overlap on small screens */}
      <ScrollView 
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          {/* Header */}
          <Animated.View style={[styles.header, reveal(enter[0])]}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.titleEn}>Welcome to Maryland Pharmacy</Text>
            <Text style={styles.titleAr}>مرحباً بكم في صيدلية ميريلاند</Text>
          </Animated.View>

          {/* Choices */}
          <Animated.View style={reveal(enter[1])}>
            <View style={styles.promptRow}>
              <MaterialCommunityIcons name="translate" size={24} color={Colors.primary} />
              <View style={styles.promptTextStack}>
                <Text style={styles.prompt}>Choose your language</Text>
                <Text style={styles.promptAr}>اختر لغتك</Text>
              </View>
            </View>

            <View style={styles.cards} accessibilityRole="radiogroup">
              {OPTIONS.map((opt) => (
                <LanguageCard
                  key={opt.code}
                  option={opt}
                  selected={selected === opt.code}
                  disabled={busy}
                  onPress={() => setSelected(opt.code)}
                />
              ))}
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Footer is now safely docked at the bottom, pushed away by the ScrollView above */}
      <Animated.View style={[styles.footer, reveal(enter[2])]}>
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue, busy }}
          accessibilityLabel={isAr ? 'متابعة' : 'Continue'}
          style={({ pressed }) => [
            styles.cta,
            { flexDirection: rowFor(isAr) },
            !canContinue && !busy && styles.ctaDisabled,
            pressed && styles.ctaPressed,
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : selected ? (
            <>
              <Text style={styles.ctaText}>{isAr ? 'متابعة' : 'Continue'}</Text>
              <MaterialCommunityIcons
                name={isAr ? 'arrow-left' : 'arrow-right'}
                size={22}
                color="#FFFFFF"
              />
            </>
          ) : (
            <>
              <Text style={styles.ctaText}>Continue</Text>
              <Text style={styles.ctaText}>متابعة</Text>
            </>
          )}
        </Pressable>

        <View style={styles.note}>
          <MaterialCommunityIcons name="information-outline" size={16} color={Colors.secondary} />
          <View style={styles.noteTextStack}>
            <Text style={styles.noteText}>You can change this later in Settings</Text>
            <Text style={styles.noteTextAr}>يمكنك تغيير اللغة لاحقاً من الإعدادات</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBase,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width,
    backgroundColor: Colors.primaryLight,
    opacity: 0.55,
    top: -width * 0.5,
    right: -width * 0.35,
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24, // Adds safe breathing room above the footer button
  },
  body: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },

  // Header
  header: { alignItems: 'center', marginBottom: 40 },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  logo: { width: 58, height: 58 },
  titleEn: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  titleAr: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.ink,
    textAlign: 'center',
    fontFamily: 'System',
    lineHeight: 32,
  },

  // Prompt
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  promptTextStack: {
    alignItems: 'center',
  },
  prompt: { fontSize: 15, fontWeight: '700', color: Colors.secondary, textAlign: 'center' },
  promptAr: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
    fontFamily: 'System',
    marginTop: 2,
  },

  // Cards
  cards: { gap: 16 },
  card: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },

  badge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: { backgroundColor: Colors.primary },
  badgeText: { fontSize: 18, fontWeight: '700', color: Colors.primary, fontFamily: 'System' },
  badgeTextSelected: { color: '#FFFFFF' },

  cardText: { flex: 1 },
  cardTitle: { fontSize: 19, fontWeight: '800', color: Colors.ink, fontFamily: 'System' },
  cardSub: { fontSize: 14, color: Colors.secondary, marginTop: 4, fontFamily: 'System' },

  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: NEUTRAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioFill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    margin: -2,
  },

  // Footer
  footer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingTop: 16,
    gap: 16,
  },
  cta: {
    height: 58,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  ctaPressed: { transform: [{ scale: 0.98 }] },
  ctaText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', fontFamily: 'System' },

  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  noteTextStack: {
    alignItems: 'center',
  },
  noteText: {
    fontSize: 12,
    color: Colors.secondary,
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '500',
  },
  noteTextAr: {
    fontSize: 12,
    color: Colors.secondary,
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '500',
    marginTop: 2,
  },
});