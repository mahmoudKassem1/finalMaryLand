import React, { memo } from 'react';
import { GestureResponderEvent, View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/formatPrice';

export interface ProductItem {
  _id: string;
  title: string;
  category: string;
  image?: string;
  stock?: number;
  price: number;
  isMaryland?: boolean;
  description?: string;
}

interface ProductCardProps {
  product: ProductItem;
}

const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { language, t } = useLanguage();

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const handleCardPress = () => {
    router.push(`/product/${product._id}`);
  };

  const hasValidPrice = Number.isFinite(product.price) && product.price >= 0;
  const handleAddToCart = (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (isOutOfStock || !hasValidPrice) return;

    addToCart({
      _id: product._id,
      title: product.title,
      category: product.category,
      image: product.image,
      stock: product.stock,
      unitPrice: product.price,
    });
  };

  return (
    <Pressable style={styles.card} onPress={handleCardPress}>
      {/* 1. PRODUCT IMAGE FRAME */}
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="medkit-outline" size={40} color={Colors.muted} />
          </View>
        )}

        {product.isMaryland && (
          <View style={styles.marylandBadge}>
            <Text style={styles.marylandBadgeText}>{t('product.marylandBrand')}</Text>
          </View>
        )}

        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>{t('product.outOfStock')}</Text>
          </View>
        )}
      </View>

      {/* 2. CARD CONTENT */}
      <View style={styles.content}>
        <View style={styles.body}>
          {/* Top text block */}
          <View style={styles.topBlock}>
            <Text
              style={[styles.title, product.isMaryland && styles.titleMaryland]}
              numberOfLines={2}
            >
              {product.title}
            </Text>
          </View>

          {/* Bottom interactive block */}
          <View style={styles.bottomBlock}>
            <View style={styles.pricePill}>
              <Text style={styles.priceText} numberOfLines={1}>
                {hasValidPrice
                  ? formatPrice(product.price, language)
                  : t('product.priceUnavailable')}
              </Text>
            </View>

            {/* Primary ADD TO CART Button */}
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                (isOutOfStock || !hasValidPrice) && styles.disabledButton,
                pressed && { opacity: 0.88 },
              ]}
              onPress={handleAddToCart}
              disabled={isOutOfStock || !hasValidPrice}
            >
              <Ionicons
                name="cart-outline"
                size={15}
                color={isOutOfStock || !hasValidPrice ? Colors.muted : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.addButtonText,
                  (isOutOfStock || !hasValidPrice) && styles.disabledButtonText,
                ]}
              >
                {isOutOfStock
                  ? t('product.outOfStock').toUpperCase()
                  : !hasValidPrice
                    ? t('product.priceUnavailable').toUpperCase()
                    : t('product.addToCart').toUpperCase()}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    overflow: 'hidden',
    flexDirection: 'column',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  imageContainer: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marylandBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  marylandBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 2,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBlock: {
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 16,
    height: 32,
    textTransform: 'uppercase',
  },
  titleMaryland: {
    color: '#DC2626',
  },
  bottomBlock: {
    gap: 7,
  },

  pricePill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F172A',
  },

  // 2. Primary ADD TO CART Button
  addButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  disabledButton: {
    backgroundColor: '#E2E8F0',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  disabledButtonText: {
    color: '#A0AEC0',
  },
});