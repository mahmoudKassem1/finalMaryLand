import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../src/constants/Colors';
import { useCart, CartItem } from '../../src/context/CartContext';
import { TAB_BAR_HEIGHT, useTabBar } from '../../src/context/TabBarContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { formatPrice } from '../../src/utils/formatPrice';

const INITIAL_CART_BATCH_SIZE = 18;
const CART_ITEM_HEIGHT = 90;
const CART_ITEM_GAP = 10;
const CART_ITEM_STRIDE = CART_ITEM_HEIGHT + CART_ITEM_GAP;
const CART_LIST_HEADER_HEIGHT = 84;
const CART_LIST_TOP_PADDING = 16;

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

const CartItemRow = memo(function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  const { language, t } = useLanguage();
  return (
    <View style={styles.itemCard}>
      <View style={styles.imageWrapper}>
        {item.image ? (
          <ExpoImage
            source={{ uri: item.image }}
            style={styles.itemImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            recyclingKey={item._id}
            transition={100}
            accessibilityLabel={item.title}
          />
        ) : (
          <Ionicons name="medkit-outline" size={28} color={Colors.muted} />
        )}
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.itemCategory} numberOfLines={1}>
          {item.category}
        </Text>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>
            {typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice)
              ? formatPrice(item.unitPrice, language)
              : t('product.priceUnavailable')}
          </Text>
        </View>
      </View>

      <View style={styles.actionsColumn}>
        <Pressable
          style={styles.deleteButton}
          onPress={() => onRemove(item._id)}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.secondary} />
        </Pressable>

        <View style={styles.stepperContainer}>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => onUpdateQuantity(item._id, -1)}
            hitSlop={6}
          >
            <Ionicons name="remove" size={14} color={Colors.ink} />
          </Pressable>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <Pressable
            style={styles.stepperBtn}
            onPress={() => onUpdateQuantity(item._id, 1)}
            hitSlop={6}
          >
            <Ionicons name="add" size={14} color={Colors.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const getCartItemLayout = (
  _data: ArrayLike<CartItem> | null | undefined,
  index: number
) => ({
  length: CART_ITEM_STRIDE,
  offset: CART_LIST_TOP_PADDING + CART_LIST_HEADER_HEIGHT + CART_ITEM_STRIDE * index,
  index,
});

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hideTabBar, showTabBar, tabBarHidden } = useTabBar();
  const { cart, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { isRTL, language, t } = useLanguage();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 14);
  const summaryClearance = TAB_BAR_HEIGHT + bottomInset + 12;
  const checkoutNavigationLock = useRef(false);
  const [summaryTranslateY] = useState(
    () => new Animated.Value(-summaryClearance)
  );
  const [visibleItemCount, setVisibleItemCount] = useState(INITIAL_CART_BATCH_SIZE);
  const visibleCartItems = useMemo(
    () => cart.slice(0, visibleItemCount),
    [cart, visibleItemCount]
  );

  useEffect(() => {
    const animation = Animated.spring(summaryTranslateY, {
      toValue: tabBarHidden ? 0 : -summaryClearance,
      damping: 20,
      stiffness: 190,
      mass: 1,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [summaryClearance, summaryTranslateY, tabBarHidden]);

  useFocusEffect(
    useCallback(() => {
      checkoutNavigationLock.current = false;
      if (cart.length > 0) hideTabBar();
      else showTabBar();

      return showTabBar;
    }, [cart.length, hideTabBar, showTabBar])
  );

  const handleProceedToCheckout = () => {
    if (checkoutNavigationLock.current) return;
    checkoutNavigationLock.current = true;
    router.navigate('/checkout');
  };

  const handleBackToPreviousScreen = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  const handleClearConfirm = () => {
    Alert.alert(
      t('cart.clearBasket'),
      t('cart.clearBasketConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('cart.clearAll'), style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const renderCartItem = useCallback(
    ({ item }: ListRenderItemInfo<CartItem>) => (
      <CartItemRow
        item={item}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
      />
    ),
    [removeFromCart, updateQuantity]
  );

  const handleLoadMore = useCallback(() => {
    setVisibleItemCount((currentCount) =>
      Math.min(currentCount + INITIAL_CART_BATCH_SIZE, cart.length)
    );
  }, [cart.length]);

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="bag-handle-outline" size={54} color={Colors.muted} />
        </View>
        <Text style={styles.emptyTitle}>{t('cart.emptyTitle')}</Text>
        <Text style={styles.emptySubtitle}>{t('cart.emptyDescription')}</Text>
        <Pressable
          style={styles.browseButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.browseButtonText}>{t('cart.browseProducts')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Items List */}
      <FlatList
        style={styles.list}
        data={visibleCartItems}
        keyExtractor={(item) => item._id}
        renderItem={renderCartItem}
        getItemLayout={getCartItemLayout}
        initialNumToRender={INITIAL_CART_BATCH_SIZE}
        maxToRenderPerBatch={INITIAL_CART_BATCH_SIZE}
        updateCellsBatchingPeriod={40}
        windowSize={7}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHidden ? 24 : summaryClearance + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Pressable
              style={styles.backButton}
              onPress={handleBackToPreviousScreen}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={Colors.ink} />
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </Pressable>

            <View style={styles.headerRow}>
              <Text style={[styles.headerCount, isRTL && styles.textRTL]}>{t('cart.productsInList', { count: cart.length })}</Text>
              <Pressable onPress={handleClearConfirm}>
                <Text style={styles.clearText}>{t('cart.clear')}</Text>
              </Pressable>
            </View>
          </View>
        }
      />

      {/* Sticky Bottom Summary Panel */}
      <Animated.View
        style={[styles.summaryDock, { transform: [{ translateY: summaryTranslateY }] }]}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('cart.subtotal')}</Text>
            <Text style={styles.summaryValue}>
              {totalPrice === null ? t('product.priceUnavailable') : formatPrice(totalPrice, language)}
            </Text>
          </View>
          <View style={styles.deliveryFeeRow}>
            <Text style={styles.deliveryFeeText}>{t('cart.deliveryFeeNotice')}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonStack}>
            {/* Proceed to Full Checkout */}
            <Pressable
              style={styles.checkoutButton}
              onPress={handleProceedToCheckout}
            >
              <Text style={styles.checkoutButtonText}>{t('cart.proceed')}</Text>
              <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color={Colors.surface} />
            </Pressable>

          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  textRTL: { textAlign: 'right' },
  container: {
    flex: 1,
    backgroundColor: Colors.pageBase,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listHeader: {
    height: CART_LIST_HEADER_HEIGHT,
    justifyContent: 'space-between',
  },
  backButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  headerCount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.error,
  },
  itemCard: {
    height: CART_ITEM_HEIGHT,
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 10,
    marginBottom: CART_ITEM_GAP,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  imageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: '85%',
    height: '85%',
  },
  itemDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  itemCategory: {
    fontSize: 10,
    color: Colors.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
    marginTop: 2,
    lineHeight: 17,
    height: 34,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.ink,
  },
  actionsColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 64,
  },
  deleteButton: {
    padding: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pageBase,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    padding: 4,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ink,
    minWidth: 20,
    textAlign: 'center',
  },
  summaryCard: {
    flexShrink: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  summaryDock: {
    zIndex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  deliveryFeeRow: {
    marginTop: -8,
    marginBottom: 14,
  },
  deliveryFeeText: {
    fontSize: 11,
    color: Colors.body,
    lineHeight: 16,
  },
  buttonStack: {
    gap: 8,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.pageBase,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});