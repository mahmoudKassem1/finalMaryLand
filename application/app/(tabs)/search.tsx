import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../src/constants/Colors';
import apiClient from '../../src/api/client';
import ProductCard, { ProductItem } from '../../src/components/ProductCard';
import { useTabBar } from '../../src/context/TabBarContext';
import { useLanguage } from '../../src/context/LanguageContext';

const { width } = Dimensions.get('window');
const GRID_PADDING = 14;
const CARD_MARGIN = 6;
const CARD_WIDTH = Math.floor((width - GRID_PADDING * 2 - CARD_MARGIN * 4) / 2);
const productKeyExtractor = (item: ProductItem) => item._id;

export default function SearchScreen() {
  const { handleScroll } = useTabBar();
  const { isRTL, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [resultsQuery, setResultsQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedQuery(text.trim());
      setResultsQuery('');
      setPage(1);
    }, 400);
  };

  // 1. Pass the query directly to prevent the function from recreating on every keystroke
  const fetchSearchResults = useCallback(async (query: string, targetPage = 1, append = false) => {
    if (!query) return;

    try {
      if (targetPage > 1) {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.append('page', String(targetPage));
      params.append('limit', '12');
      params.append('search', query);

      const res = await apiClient.get(`/products?${params.toString()}`);
      const fetched: ProductItem[] = res.data.products || [];
      const nextHasMore = res.data.hasMore || false;
      const nextTotal = res.data.total || 0;

      setProducts((prev) => (append ? [...prev, ...fetched] : fetched));
      setHasMore(nextHasMore);
      setTotalCount(nextTotal);
      setPage(targetPage);
      setResultsQuery(query);
      setError(null);
    } catch (err) {
      console.warn('Failed to search products', err);
      setError('Unable to reach the catalog. Please check your connection.');
    } finally {
      setLoadingMore(false);
    }
  }, []); // Empty dependencies mean this function never triggers a re-render on its own

  // 2. Wrap the fetch call inside an async function within the effect
  useEffect(() => {
    const initSearch = async () => {
      if (debouncedQuery) {
        await fetchSearchResults(debouncedQuery, 1, false);
      } else {
        // Clear products if user deletes their entire query
        setProducts([]);
        setTotalCount(0);
      }
    };

    initSearch();
  }, [debouncedQuery, fetchSearchResults]);

  const handleLoadMore = () => {
    if (!isSearching && !loadingMore && hasMore) {
      // 3. Pass the debouncedQuery manually here
      fetchSearchResults(debouncedQuery, page + 1, true);
    }
  };

  const handleRetrySearch = () => {
    setResultsQuery('');
    fetchSearchResults(debouncedQuery, 1, false);
  };

  const isSearching = Boolean(debouncedQuery) && resultsQuery !== debouncedQuery;

  const renderProductItem = useCallback(
    ({ item }: { item: ProductItem }) => (
      <View style={styles.cardItemWrapper}>
        <ProductCard product={item} />
      </View>
    ),
    []
  );

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={Colors.primary} />
        <TextInput
          style={[styles.searchInput, isRTL && styles.textRTL]}
          placeholder={t('search.placeholder')}
          placeholderTextColor={Colors.muted}
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          autoFocus={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => handleSearchChange('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={Colors.muted} />
          </Pressable>
        )}
      </View>
      {debouncedQuery.length > 0 && (
        <Text style={styles.metaCount}>
          {t('search.results', { count: totalCount, query: debouncedQuery })}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {!debouncedQuery ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={54} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>{t('search.prompt')}</Text>
          <Text style={styles.emptySub}>{t('search.subtitle')}</Text>
        </View>
      ) : isSearching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.centerText}>{t('search.loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={44} color={Colors.error} />
          <Text style={styles.errorText}>{t('search.unableReach')}</Text>
          <Pressable style={styles.retryBtn} onPress={handleRetrySearch}>
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderProductItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color={Colors.muted} />
              <Text style={styles.emptyTitle}>{t('search.noResults')}</Text>
              <Text style={styles.emptySub}>{t('search.notFound', { query: debouncedQuery })}</Text>
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
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    zIndex: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  metaCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 12,
    paddingBottom: 95,
  },
  cardItemWrapper: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
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
    marginTop: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});