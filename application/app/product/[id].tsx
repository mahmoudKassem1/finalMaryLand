import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import apiClient from '../../src/api/client';
import { useCart } from '../../src/context/CartContext';
import { ProductItem } from '../../src/components/ProductCard';
import { useLanguage } from '../../src/context/LanguageContext';
import { formatPrice } from '../../src/utils/formatPrice';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isRTL, language, t } = useLanguage();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  // Moved the fetch logic directly inside the useEffect
  useEffect(() => {
    let isActive = true;

    const fetchProductDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await apiClient.get(`/products/${id}`);
        if (isActive) {
          setProduct(res.data);
          setLoadedProductId(id);
        }
      } catch (err) {
        if (isActive) {
          console.warn('Failed to load product details', err);
          setLoadedProductId(id);
          setError({ id, message: 'load-error' });
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchProductDetails();

    // Cleanup function prevents state updates if the component unmounts mid-fetch
    return () => {
      isActive = false;
    };
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !Number.isFinite(product.price) || product.price < 0) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        _id: product._id,
        title: product.title,
        category: product.category,
        image: product.image,
        stock: product.stock,
        unitPrice: product.price,
      });
    }

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const isOutOfStock = product?.stock !== undefined && product.stock <= 0;
  const hasValidPrice =
    typeof product?.price === 'number' && Number.isFinite(product.price) && product.price >= 0;
  const isUnavailable = isOutOfStock || !hasValidPrice;
  const isLowStock = product?.stock !== undefined && product.stock > 0 && product.stock < 10;

  const isLoading = loading || loadedProductId !== id;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.centerText}>{t('product.loadingDetails')}</Text>
      </View>
    );
  }

  if (error?.id === id || !product || loadedProductId !== id) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error?.id === id ? t('product.unableLoad') : t('product.notFound')}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            // Re-trigger the effect by toggling a piece of state or just reloading the id
            // In this setup, navigating to the same ID or having a dedicated retry state works better,
            // but for simplicity, we'll force a state reset that re-runs the logic.
            router.replace(`/product/${id}`);
          }}
        >
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('product.details'),
          headerBackTitle: t('common.back'),
        }}
      />

      <View style={styles.container}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Large Contained Image */}
          <View style={styles.imageContainer}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="medkit-outline" size={64} color={Colors.muted} />
              </View>
            )}

            {/* Exclusive Badge */}
            {product.isMaryland && (
              <View style={styles.exclusiveBadge}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.surface} />
                <Text style={styles.exclusiveBadgeText}>{t('home.exclusive')}</Text>
              </View>
            )}
          </View>

          {/* 2. Title & Category Header */}
          <View style={styles.detailsCard}>
            <Text style={styles.categoryLabel}>{product.category}</Text>
            <Text style={styles.productTitle}>{product.title}</Text>

            {/* Stock State */}
            <View style={styles.stockRow}>
              {isOutOfStock ? (
                <View style={[styles.stockBadge, styles.stockBadgeOut]}>
                  <Text style={styles.stockTextOut}>{t('product.outOfStock')}</Text>
                </View>
              ) : isLowStock ? (
                <View style={[styles.stockBadge, styles.stockBadgeLow]}>
                  <Text style={styles.stockTextLow}>{t('product.lowStock', { count: product.stock ?? 0 })}</Text>
                </View>
              ) : (
                <View style={[styles.stockBadge, styles.stockBadgeIn]}>
                  <Text style={styles.stockTextIn}>{t('product.availableAlexandria')}</Text>
                </View>
              )}
            </View>

            {/* 3. Product Price */}
            <View style={styles.priceCard}>
              <Text style={styles.priceHeading}>{t('product.price')}</Text>
              <Text style={styles.priceValue}>
                {Number.isFinite(product.price)
                  ? formatPrice(product.price, language)
                  : t('product.priceUnavailable')}
              </Text>
            </View>

            {/* 4. Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, isRTL && styles.textRTL]}>{t('product.detailsUsage')}</Text>
              <Text style={[styles.descriptionText, isRTL && styles.textRTL]}>
                {product.description || t('product.noDescription')}
              </Text>
            </View>

            {/* 5. Quantity Stepper */}
            {!isOutOfStock && hasValidPrice && (
              <View style={styles.quantitySection}>
                <Text style={styles.quantityLabel}>{t('product.quantity')}</Text>
                <View style={styles.stepperContainer}>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Ionicons name="remove" size={18} color={Colors.ink} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{quantity}</Text>
                  <Pressable
                    style={styles.stepperBtn}
                    onPress={() => setQuantity((q) => q + 1)}
                  >
                    <Ionicons name="add" size={18} color={Colors.ink} />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Feedback Toast */}
        {addedToast && (
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.surface} />
            <Text style={styles.toastText}>{t('product.addedToBasket')}</Text>
          </View>
        )}

        {/* 6. Sticky Action Footer */}
        <View style={styles.stickyFooter}>
          <Pressable
            style={[styles.addToCartBtn, isUnavailable && styles.btnDisabled]}
            onPress={handleAddToCart}
            disabled={isUnavailable}
          >
            <Ionicons
              name="bag-handle-outline"
              size={20}
              color={isUnavailable ? Colors.muted : Colors.surface}
            />
            <Text style={[styles.addToCartText, isUnavailable && styles.btnDisabledText]}>
              {isOutOfStock
                ? t('product.unavailable')
                : !hasValidPrice
                  ? t('product.priceUnavailable')
                  : t('product.addToBasket')}
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  textRTL: { textAlign: 'right' },
  container: {
    flex: 1,
    backgroundColor: Colors.pageBase,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productImage: {
    width: '85%',
    height: '85%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  exclusiveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  exclusiveBadgeText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.ink,
    lineHeight: 26,
    marginBottom: 10,
  },
  stockRow: {
    marginBottom: 16,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeIn: {
    backgroundColor: '#EFFDF5',
  },
  stockBadgeLow: {
    backgroundColor: '#FFFBEB',
  },
  stockBadgeOut: {
    backgroundColor: '#FEF2F2',
  },
  stockTextIn: {
    color: Colors.whatsapp,
    fontSize: 11,
    fontWeight: '700',
  },
  stockTextLow: {
    color: Colors.warning,
    fontSize: 11,
    fontWeight: '700',
  },
  stockTextOut: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: '700',
  },
  priceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.body,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.ink,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.body,
    lineHeight: 20,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 16,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.ink,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pageBase,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBtn: {
    padding: 6,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.ink,
    minWidth: 28,
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    zIndex: 999,
  },
  toastText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  stickyFooter: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addToCartBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnDisabled: {
    backgroundColor: Colors.border,
  },
  addToCartText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  btnDisabledText: {
    color: Colors.muted,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.pageBase,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  centerText: {
    fontSize: 13,
    color: Colors.secondary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});