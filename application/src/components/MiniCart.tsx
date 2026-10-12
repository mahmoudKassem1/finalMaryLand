import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useCart } from '../context/CartContext';
import { TAB_BAR_HEIGHT, useTabBar } from '../context/TabBarContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/formatPrice';

export const MINI_CART_GAP = 12;
export const MINI_CART_HEIGHT = 66;

interface MiniCartProps {
  enabled?: boolean;
}

export default function MiniCart({ enabled = true }: MiniCartProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { totalCount, totalPrice } = useCart();
  const { tabBarTranslateY } = useTabBar();
  const { isRTL, language, t } = useLanguage();
  const isVisible = enabled && totalCount > 0;

  const [entryTranslateY] = useState(() => new Animated.Value(80));
  const [opacity] = useState(() => new Animated.Value(0));

  const combinedTranslateY = useMemo(
    () => Animated.add(tabBarTranslateY, entryTranslateY),
    [tabBarTranslateY, entryTranslateY]
  );
  const cartWidth = Math.min(width - 32, 440);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 14);
  const bottom = TAB_BAR_HEIGHT + bottomInset + MINI_CART_GAP;
  const priceLabel =
    totalPrice === null ? t('product.priceUnavailable') : formatPrice(totalPrice, language);
  const countLabel = totalCount > 99 ? '99+' : String(totalCount);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.spring(entryTranslateY, {
        toValue: isVisible ? 0 : 80,
        damping: 20,
        stiffness: 190,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isVisible ? 1 : 0,
        duration: isVisible ? 220 : 160,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [entryTranslateY, isVisible, opacity]);

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      accessibilityElementsHidden={!isVisible}
      importantForAccessibility={isVisible ? 'auto' : 'no-hide-descendants'}
      style={[
        styles.positioner,
        {
          width: cartWidth,
          left: (width - cartWidth) / 2,
          bottom,
          opacity,
          transform: [{ translateY: combinedTranslateY }],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('cart.cartAccessibility', { count: totalCount, price: priceLabel })}
        onPress={() => router.push('/cart')}
        style={({ pressed }) => [styles.card, isRTL && styles.cardRTL, pressed && styles.cardPressed]}
      >
        <View style={styles.countBlock}>
          <Text style={styles.count}>{countLabel}</Text>
          <Text style={styles.itemsLabel}>{totalCount === 1 ? t('cart.item') : t('cart.items')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={[styles.priceBlock, isRTL && styles.priceBlockRTL]}>
          <Text style={[styles.totalLabel, isRTL && styles.textRTL]}>{t('cart.total')}</Text>
          <Text 
            style={[styles.price, isRTL && styles.textRTL]} 
            numberOfLines={1} 
            adjustsFontSizeToFit 
            minimumFontScale={0.8}
          >
            {priceLabel}
          </Text>
        </View>

        <View style={[styles.viewCart, isRTL && styles.viewCartRTL]}>
          <Text style={styles.viewCartLabel}>{t('cart.viewCart')}</Text>
          <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color={Colors.surface} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardRTL: { flexDirection: 'row-reverse' },
  textRTL: { textAlign: 'right' },
  priceBlockRTL: { alignItems: 'flex-end' },
  viewCartRTL: { flexDirection: 'row-reverse' },
  positioner: {
    position: 'absolute',
    zIndex: 20,
    elevation: 16,
  },
  card: {
    minHeight: MINI_CART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  countBlock: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    color: Colors.primary,
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '900',
  },
  itemsLabel: {
    color: Colors.secondary,
    fontSize: 9,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 34,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  priceBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    alignItems: 'flex-start', // Explicit default for LTR
  },
  totalLabel: {
    color: Colors.secondary,
    fontSize: 9,
    fontWeight: '800',
  },
  price: {
    color: Colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  viewCart: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 11,
  },
  viewCartLabel: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '800',
  },
});