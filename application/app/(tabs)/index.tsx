import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // <-- Added expo-router
import { Colors } from '../../src/constants/Colors';
import apiClient from '../../src/api/client';
import ProductCard, { ProductItem } from '../../src/components/ProductCard';
import CartHeaderButton from '../../src/components/CartHeaderButton';
import MedicalCare from '../../src/components/MedicalCare';
import { useTabBar } from '../../src/context/TabBarContext';
import { useLanguage } from '../../src/context/LanguageContext';

const logo = require('../../assets/logo.png');
const contactHero = require('../../assets/hero.jpeg');
const signature = require('../../assets/sig.png');

const { width, height } = Dimensions.get('window');
const ROW_GAP = 14;

const HERO_HEIGHT = Math.max(Math.round(height * 0.58), 460);
const LOGO_SIZE = Math.round(width * 0.76);
const FEATURED_POOL_SIZE = 8;

const TRUST_ITEMS = [
  { icon: 'bicycle-outline', label: 'home.delivery', sub: 'home.delivery24' },
  { icon: 'shield-checkmark-outline', label: 'home.original', sub: 'home.certified' },
  { icon: 'time-outline', label: 'home.support', sub: 'home.professional' },
  { icon: 'logo-whatsapp', label: 'home.pharmacist', sub: 'home.liveInquiry' },
] as const;

const isMarylandProduct = (p: ProductItem) =>
  (p as any).category === 'maryland-products' ||
  (p as any).category === 'maryland' ||
  (p as any).isMaryland === true;

// Seeded deterministic 24-hour shuffle
const getDailySeed = (): number => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
  const result = [...arr];
  let m = result.length;
  let s = seed;
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    const rnd = s / 233280;
    const i = Math.floor(rnd * m--);
    const t = result[m];
    result[m] = result[i];
    result[i] = t;
  }
  return result;
};

export default function HomeScreen() {
  const router = useRouter(); // <-- Replaced useNavigation with useRouter
  const { handleScroll, showTabBar } = useTabBar();
  const { isRTL, t } = useLanguage();

  const [featuredPool, setFeaturedPool] = useState<ProductItem[]>([]);
  const [marylandProducts, setMarylandProducts] = useState<ProductItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Medical Care Modal State
  const [medicalCareVisible, setMedicalCareVisible] = useState<boolean>(false);

  const scrollRef = useRef<ScrollView>(null);
  const featuredYRef = useRef<number>(0);

  // Auto-scrolling ticker ref
  const trustScrollRef = useRef<ScrollView>(null);
  const trustScrollX = useRef<number>(0);
  const isInteractingTrust = useRef<boolean>(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);

    try {
      setError(null);
      const [poolRes, exclusiveRes] = await Promise.all([
        apiClient.get(`/products?limit=80&sort=latest`),
        apiClient.get(`/products?category=maryland-products&limit=8`),
      ]);

      const pool = (poolRes.data?.products || poolRes.data || []).filter(
        (p: ProductItem) => !isMarylandProduct(p)
      );
      setFeaturedPool(pool);

      const maryland = exclusiveRes.data?.products || exclusiveRes.data || [];
      setMarylandProducts(maryland);
    } catch (err) {
      console.warn('Failed to load catalog products', err);
      setError('Unable to load medications. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchProducts();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const dailyFeatured = useMemo(() => {
    if (featuredPool.length === 0) return [];
    const seed = getDailySeed();
    return seededShuffle(featuredPool, seed).slice(0, FEATURED_POOL_SIZE);
  }, [featuredPool]);

  // Infinite ticker animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isInteractingTrust.current || !trustScrollRef.current) return;
      trustScrollX.current += 1.2;
      if (trustScrollX.current >= 480) {
        trustScrollX.current = 0;
        trustScrollRef.current.scrollTo({ x: 0, animated: false });
      } else {
        trustScrollRef.current.scrollTo({ x: trustScrollX.current, animated: false });
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const scrollToFeatured = () => {
    scrollRef.current?.scrollTo({ y: Math.max(featuredYRef.current - 12, 0), animated: true });
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        {/* 1. HERO SECTION */}
        <View style={styles.heroSection}>
          <View pointerEvents="box-none" style={styles.heroCartAction}>
            <CartHeaderButton />
          </View>
          <LinearGradient
            colors={['#FFFFFF', '#F0F2F5', '#3E4249']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.logoWrapper}>
            <Image source={logo} style={styles.heroLogo} resizeMode="contain" />
          </View>

          <LinearGradient
            colors={[
              'transparent',
              'rgba(25, 28, 31, 0.0)',
              'rgba(20, 22, 25, 0.72)',
              'rgba(15, 17, 20, 0.94)',
            ]}
            locations={[0, 0.35, 0.72, 1]}
            style={styles.heroGradient}
          >
            <View style={[styles.heroContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.heroTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('home.heroTrusted')}
                {'\n'}
                <Text style={styles.heroTitleAccent}>{t('home.heroCare')}</Text>
              </Text>

              <View style={[styles.heroTagPill, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.heroTagText}>{t('home.heroTag')}</Text>
              </View>

              {/* ACTION BUTTONS ROW */}
              <View style={[styles.heroActionRow, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Pressable
                  style={({ pressed }) => [styles.heroButton, pressed && { opacity: 0.9 }]}
                  onPress={scrollToFeatured}
                >
                  <Text style={styles.heroButtonText}>{t('home.shopNow')}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.heroSecondaryButton, pressed && { opacity: 0.9 }]}
                  onPress={() => setMedicalCareVisible(true)}
                >
                  <Ionicons name="medkit" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.heroButtonText}>{t('home.homeCare')}</Text>
                </Pressable>
              </View>

            </View>
          </LinearGradient>
        </View>

        {/* 2. AUTO-SCROLLING TRUST BAR */}
        <View style={styles.trustStripWrapper}>
          <ScrollView
            ref={trustScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onTouchStart={() => {
              isInteractingTrust.current = true;
            }}
            onTouchEnd={() => {
              isInteractingTrust.current = false;
            }}
            contentContainerStyle={styles.trustStrip}
          >
            {[...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS].map((item, idx) => (
              <View key={idx} style={styles.trustCard}>
                <View style={styles.trustIconCircle}>
                  <Ionicons name={item.icon as any} size={22} color={Colors.primary || '#E02424'} />
                </View>
                <View>
                  <Text style={styles.trustLabel}>{t(item.label)}</Text>
                  <Text style={styles.trustSub}>{t(item.sub)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 3. MARYLAND EXCLUSIVE CAROUSEL */}
        {marylandProducts.length > 0 && (
          <View style={styles.exclusiveSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.exclusiveTitleRow}>
                <View style={styles.exclusivePill}>
                  <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                  <Text style={styles.exclusivePillText}>{t('home.exclusive')}</Text>
                </View>
                <Text style={styles.sectionTitle}>{t('home.marylandSelection')}</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.exclusiveTrack}
              snapToInterval={220}
              decelerationRate="fast"
            >
              {marylandProducts.map((item) => (
                <View key={item._id} style={styles.exclusiveCardWrapper}>
                  <ProductCard product={item} />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. FEATURED PRODUCTS SECTION (1 PRODUCT PER ROW) */}
        <View
          style={styles.sectionHeader}
          onLayout={(e) => {
            featuredYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>{t('home.featured')}</Text>
          <Text style={styles.resultsCount}>{t('home.items', { count: dailyFeatured.length })}</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('home.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
            <Text style={styles.errorText}>{t('home.unableLoad')}</Text>
            <Pressable style={styles.retryButton} onPress={fetchProducts}>
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : dailyFeatured.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={40} color={Colors.muted} />
            <Text style={styles.emptyText}>{t('home.noProducts')}</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {dailyFeatured.map((item) => (
              <View key={item._id} style={styles.fullWidthCardWrapper}>
                <ProductCard product={item} />
              </View>
            ))}

            {/* SEE MORE BUTTON - Fixed Navigation */}
            <Pressable
              style={({ pressed }) => [
                styles.seeMoreBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }
              ]}
              onPress={() => {
                showTabBar();
                router.navigate('/(tabs)/categories' as any); // expo-router navigation
              }}
            >
              <Text style={styles.seeMoreBtnText}>{t('home.seeAll')}</Text>
              <Ionicons 
                name={isRTL ? "arrow-back" : "arrow-forward"} 
                size={18} 
                color="#FFFFFF" 
                style={{ marginHorizontal: 4 }}
              />
            </Pressable>
          </View>
        )}

        <View style={styles.commitmentSection}>
          <ImageBackground
            source={contactHero}
            style={styles.contactBanner}
            imageStyle={styles.contactBannerImage}
            resizeMode="cover"
          >
            <View style={styles.contactBannerOverlay} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.getInTouch')}
              onPress={() => router.push('/contact-us' as any)}
              style={({ pressed }) => [
                styles.contactButton,
                pressed && { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              ]}
            >
              <Text style={styles.contactButtonText}>{t('home.getInTouch')}</Text>
            </Pressable>
          </ImageBackground>

          <View style={styles.commitmentContent}>
            <Text style={styles.commitmentEyebrow}>{t('home.commitment')}</Text>
            <Text style={styles.commitmentQuote}>
              {t('home.promise')}
            </Text>
            <Image
              source={signature}
              style={styles.signatureImage}
              resizeMode="contain"
              accessibilityLabel="Signature"
            />
            <View style={styles.signatureUnderline} />
          </View>
        </View>
      </ScrollView>

      {/* Render the Medical Care overlay component */}
      <MedicalCare 
        visible={medicalCareVisible} 
        onClose={() => setMedicalCareVisible(false)} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 36,
  },
  heroSection: {
    width: '100%',
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroCartAction: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 30,
  },
  logoWrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  heroLogo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    opacity: 0.95,
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: 0.2,
    textAlign: 'left',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroTitleAccent: {
    color: '#E02424',
    textShadowColor: 'rgba(224, 36, 36, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  heroTagPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 32, 35, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  heroTagText: {
    color: '#E2E8F0',
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  heroButton: {
    backgroundColor: '#E02424',
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#E02424',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  heroSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trustStripWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  trustStrip: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 24,
    flexDirection: 'row',
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trustIconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A202C',
    letterSpacing: 0.5,
  },
  trustSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#718096',
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.ink,
    textTransform: 'capitalize',
  },
  resultsCount: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600',
  },
  exclusiveSection: {
    marginTop: 14,
    backgroundColor: '#FFF5F5',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FED7D7',
  },
  exclusiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exclusivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  exclusivePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  exclusiveTrack: {
    paddingHorizontal: 16,
    gap: 14,
    paddingTop: 4,
  },
  exclusiveCardWrapper: {
    width: 210,
  },

  // --- Single Column (1 per row) ---
  listContainer: {
    paddingHorizontal: 16,
    gap: ROW_GAP,
  },
  fullWidthCardWrapper: {
    width: '100%',
  },
  
  // --- SEE MORE BUTTON ---
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary || '#E02424',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999, // Circular pill shape
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 12,
    shadowColor: Colors.primary || '#E02424',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  seeMoreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  commitmentSection: {
    marginTop: 36,
  },
  contactBanner: {
    width: '100%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBannerImage: {
    resizeMode: 'cover',
  },
  contactBannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  contactButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  commitmentContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 100,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  commitmentEyebrow: {
    marginBottom: 12,
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  commitmentQuote: {
    maxWidth: 360,
    color: '#475569',
    fontSize: 15,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  signatureImage: {
    width: 275,
    height: 150,
    marginTop: 24,
    opacity: 0.7,
  },
  signatureUnderline: {
    width: 48,
    height: 2,
    marginTop: 8,
    borderRadius: 1,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },

  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.secondary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.muted,
  },
});