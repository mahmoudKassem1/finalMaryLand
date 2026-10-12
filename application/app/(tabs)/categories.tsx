import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import apiClient from '../../src/api/client';
import ProductCard, { ProductItem } from '../../src/components/ProductCard';
import CartHeaderButton from '../../src/components/CartHeaderButton';
import { useTabBar } from '../../src/context/TabBarContext';
import { useLanguage } from '../../src/context/LanguageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

// 2-column card math
const GRID_PADDING = 14;
const CARD_MARGIN = 6;
const CARD_WIDTH = Math.floor((width - GRID_PADDING * 2 - CARD_MARGIN * 4) / 2);
const productKeyExtractor = (item: ProductItem) => item._id;

interface CategoryDef {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgTint: string;
  description: string;
}

const CATEGORY_HUBS: CategoryDef[] = [
  {
    id: 'maryland-products',
    label: 'Maryland products',
    icon: 'shield-checkmark',
    color: '#DC2626',
    bgTint: '#FEE2E2',
    description: 'Exclusive formulas',
  },
  {
    id: 'all',
    label: 'All Products',
    icon: 'grid-outline',
    color: '#475569',
    bgTint: '#F1F5F9',
    description: 'Full pharmacy index',
  },
  {
    id: 'medication',
    label: 'Medications',
    icon: 'bandage-outline',
    color: '#2563EB',
    bgTint: '#DBEAFE',
    description: 'Rx & Daily relief',
  },
  {
    id: 'health-care',
    label: 'Health Care',
    icon: 'fitness-outline',
    color: '#059669',
    bgTint: '#D1FAE5',
    description: 'First aid & devices',
  },
  {
    id: 'personal-care',
    label: 'Personal Care',
    icon: 'sparkles-outline',
    color: '#D97706',
    bgTint: '#FEF3C7',
    description: 'Hygiene & body',
  },
  {
    id: 'beauty',
    label: 'Beauty & Skincare',
    icon: 'color-wand-outline',
    color: '#DB2777',
    bgTint: '#FCE7F3',
    description: 'Dermocosmetics',
  },
  {
    id: 'mom-and-baby',
    label: 'Mom & Baby',
    icon: 'heart-circle-outline',
    color: '#7C3AED',
    bgTint: '#EDE9FE',
    description: 'Infant care & nursing',
  },
  {
    id: 'vitamins',
    label: 'Vitamins',
    icon: 'leaf-outline',
    color: '#16A34A',
    bgTint: '#DCFCE7',
    description: 'Supplements & energy',
  },
  
];

interface CacheEntry {
  products: ProductItem[];
  hasMore: boolean;
  total: number;
  page: number;
}

export default function CategoriesScreen() {
  const { handleScroll, setMiniCartEnabled } = useTabBar();
  const { isRTL, t } = useLanguage();

  const categoryText: Record<string, { label: string; description: string }> = {
    'maryland-products': { label: t('categories.marylandProducts'), description: t('categories.exclusiveFormulas') },
    all: { label: t('categories.allProducts'), description: t('categories.fullIndex') },
    medication: { label: t('categories.medications'), description: t('categories.rxRelief') },
    'health-care': { label: t('categories.healthCare'), description: t('categories.firstAid') },
    'personal-care': { label: t('categories.personalCare'), description: t('categories.hygiene') },
    beauty: { label: t('categories.beauty'), description: t('categories.dermocosmetics') },
    'mom-and-baby': { label: t('categories.momBaby'), description: t('categories.infantCare') },
    vitamins: { label: t('categories.vitamins'), description: t('categories.supplements') },
  };

  // Selected hub category; null means user is on the 8-card Hub screen
  const [activeCategory, setActiveCategory] = useState<CategoryDef | null>(null);

  useEffect(() => () => setMiniCartEnabled(false), [setMiniCartEnabled]);

  // Scoped search within the active category
  const [categorySearch, setCategorySearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catalogCache = useRef<{ [key: string]: CacheEntry }>({});
  const catalogRequestId = useRef(0);
  const productsRef = useRef<ProductItem[]>([]);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (text: string) => {
    setCategorySearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      catalogRequestId.current += 1;
      setDebouncedSearch(text.trim());
      setPage(1);
    }, 350);
  };

  const selectCategoryHub = (cat: CategoryDef) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    catalogRequestId.current += 1;
    productsRef.current = [];
    setProducts([]);
    setLoading(true);
    setError(null);
    setMiniCartEnabled(true);
    setActiveCategory(cat);
    setCategorySearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleBackToHub = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    catalogRequestId.current += 1;
    productsRef.current = [];
    setMiniCartEnabled(false);
    setActiveCategory(null);
    setCategorySearch('');
    setDebouncedSearch('');
    setProducts([]);
    setLoading(false);
  };

  const fetchCatalog = useCallback(
    async (targetPage = 1, append = false, forceRefresh = false) => {
      if (!activeCategory) return;
      const requestId = ++catalogRequestId.current;

      const cacheKey = `${activeCategory.id}_${debouncedSearch}`;

      if (targetPage === 1 && !append && !forceRefresh && catalogCache.current[cacheKey]) {
        const cached = catalogCache.current[cacheKey];
        productsRef.current = cached.products;
        setProducts(cached.products);
        setHasMore(cached.hasMore);
        setTotalCount(cached.total);
        setPage(cached.page);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      try {
        setError(null);
        if (targetPage === 1) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams();
        params.append('page', String(targetPage));
        params.append('limit', '12');

        if (activeCategory.id !== 'all') {
          params.append('category', activeCategory.id);
        }

        if (debouncedSearch) {
          params.append('search', debouncedSearch);
        }

        const res = await apiClient.get(`/products?${params.toString()}`);
        if (requestId !== catalogRequestId.current) return;

        const fetched: ProductItem[] = res.data.products || [];
        const nextHasMore = res.data.hasMore || false;
        const nextTotal = res.data.total || 0;
        const updatedProducts = append
          ? [...productsRef.current, ...fetched]
          : fetched;

        productsRef.current = updatedProducts;
        catalogCache.current[cacheKey] = {
          products: updatedProducts,
          hasMore: nextHasMore,
          total: nextTotal,
          page: targetPage,
        };
        setProducts(updatedProducts);

        setHasMore(nextHasMore);
        setTotalCount(nextTotal);
        setPage(targetPage);
      } catch (err) {
        if (requestId !== catalogRequestId.current) return;
        console.warn('Failed to load category products', err);
        setError('Unable to load medications. Please check your network.');
      } finally {
        if (requestId === catalogRequestId.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [activeCategory, debouncedSearch]
  );

  useEffect(() => {
    if (activeCategory) {
      fetchCatalog(1, false, false);
    }
  }, [activeCategory, debouncedSearch, fetchCatalog]);

  const onRefresh = () => {
    if (!activeCategory) return;
    setRefreshing(true);
    const cacheKey = `${activeCategory.id}_${debouncedSearch}`;
    delete catalogCache.current[cacheKey];
    fetchCatalog(1, false, true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchCatalog(page + 1, true, false);
    }
  };

  const renderProductItem = useCallback(
    ({ item }: { item: ProductItem }) => (
      <View style={styles.cardItemWrapper}>
        <ProductCard product={item} />
      </View>
    ),
    []
  );

  // --- VIEW 1: 8-CARD CATEGORY HUB ---
  if (!activeCategory) {
    return (
      <View style={styles.container}>
        <View style={styles.hubHeader}>
          <View style={styles.hubHeaderRow}>
            <View style={styles.hubHeaderCopy}>
              <Text style={[styles.hubTitle, isRTL && styles.textRTL]}>{t('categories.title')}</Text>
              <Text style={[styles.hubSubtitle, isRTL && styles.textRTL]}>{t('categories.subtitle')}</Text>
            </View>
            <CartHeaderButton />
          </View>
        </View>

        <FlatList
          data={CATEGORY_HUBS}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.hubGrid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.hubCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
              onPress={() => selectCategoryHub(item)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.bgTint }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.hubCardTitle} numberOfLines={1}>
                {categoryText[item.id].label}
              </Text>
              <Text style={styles.hubCardDesc} numberOfLines={1}>
                {categoryText[item.id].description}
              </Text>
              <View style={styles.hubCardAction}>
                <Text style={[styles.hubCardActionText, { color: item.color }]}>{t('categories.browse')}</Text>
                <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color={item.color} />
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  }

  // --- VIEW 2: CATEGORY PRODUCT LISTING ---
  const renderListHeader = () => (
    <View style={styles.listingHeaderWrapper}>
      {/* Back button and Category Title Bar */}
      <View style={styles.topNavigationRow}>
        <Pressable style={styles.backButton} onPress={handleBackToHub} hitSlop={10}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={Colors.ink} />
          <Text style={styles.backButtonText}>{t('nav.categories')}</Text>
        </Pressable>
        <CartHeaderButton />
      </View>

      <View style={styles.categoryHeadingRow}>
        <View style={styles.categoryBadgeRow}>
          <View style={[styles.categoryIndicatorDot, { backgroundColor: activeCategory.color }]} />
          <Text style={styles.activeCategoryHeading}>{categoryText[activeCategory.id].label}</Text>
        </View>
      </View>

      {/* Scoped Category Search Bar */}
      <View style={styles.categorySearchBox}>
        <Ionicons name="search-outline" size={17} color={Colors.secondary} />
        <TextInput
          style={[styles.categorySearchInput, isRTL && styles.textRTL]}
          placeholder={t('categories.searchIn', { category: categoryText[activeCategory.id].label })}
          placeholderTextColor={Colors.muted}
          value={categorySearch}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {categorySearch.length > 0 && (
          <Pressable onPress={() => handleSearchChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.muted} />
          </Pressable>
        )}
      </View>

      <Text style={styles.metaCount}>
        {t('categories.items', { shown: products.length, total: totalCount || products.length })}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.centerText}>{t('categories.loading', { category: categoryText[activeCategory.id].label })}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={44} color={Colors.error} />
          <Text style={styles.errorText}>{t('categories.unableLoad')}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchCatalog(1, false, true)}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={productKeyExtractor}
          numColumns={2}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={40}
          windowSize={7}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          renderItem={renderProductItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={44} color={Colors.muted} />
              <Text style={styles.emptyTitle}>{t('categories.noMatches')}</Text>
              <Text style={styles.emptySub}>
                {t('categories.adjustSearch', { category: categoryText[activeCategory.id].label })}
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  textRTL: { textAlign: 'right' },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // 8-Card Hub View
  hubHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  hubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  hubHeaderCopy: {
    flex: 1,
  },
  hubTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  hubSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  hubGrid: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 6,
    paddingBottom: 95,
  },
  hubCard: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hubCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  hubCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  hubCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  hubCardActionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Listing View Header
  listingHeaderWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    marginBottom: 10,
  },
  topNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryHeadingRow: {
    marginBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeCategoryHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  categorySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  categorySearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  metaCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },

  // Product 2x2 Grid
  listContent: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 95,
  },
  cardItemWrapper: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  centerText: {
    fontSize: 13,
    color: '#64748B',
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});