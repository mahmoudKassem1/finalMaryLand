import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { Tabs, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';
import MiniCart from '../../src/components/MiniCart';
import { TAB_BAR_HEIGHT, TabBarProvider, useTabBar } from '../../src/context/TabBarContext';
import { useLanguage } from '../../src/context/LanguageContext';

/* ----------------------------- Config ----------------------------- */

// Only these routes can ever appear in the bar (cart etc. are excluded).
const VISIBLE_ROUTES = ['index', 'categories', 'search', 'profile'] as const;

const ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: 'home', inactive: 'home-outline' },
  categories: { active: 'grid', inactive: 'grid-outline' },
  search: { active: 'search', inactive: 'search-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

const IS_IOS = Platform.OS === 'ios';

const THEME = {
  // Slightly deeper red than #DC2626 so the 11px label passes 4.5:1 on the pill.
  active: '#C81E1E',
  inactive: '#64748B',
  podBg: 'rgba(254, 226, 226, 0.92)',
  podBorder: 'rgba(200, 30, 30, 0.18)',
  // Android: fully opaque (no blur, no translucent-under-elevation artifacts).
  // iOS: translucent, the BlurView supplies the glass.
  barBg: IS_IOS ? 'rgba(255, 255, 255, 0.6)' : '#FFFFFF',
  barBorder: IS_IOS ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.08)',
  shadow: '#0F172A',
};

const BAR_HEIGHT = TAB_BAR_HEIGHT;
const POD_H_PADDING = 14; // room on each side of icon/label inside the pill
const POD_EDGE_GAP = 3; // minimum gap between pill and tab edge
const POD_V_INSET = 6; // pill inset from the top/bottom of the bar
const POD_HEIGHT = BAR_HEIGHT - POD_V_INSET * 2;
const ICON_SIZE = 24;

type TabItemLayout = { x: number; width: number; inner: number };

/* --------------------------- Tab Bar --------------------------- */

function LiquidGlassTabBar({ state, descriptors, navigation }: any) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { tabBarTranslateY, miniCartEnabled } = useTabBar();
  const { t } = useLanguage();
  const segments = useSegments();

  const BAR_WIDTH = Math.min(width * 0.94, 440);

  // Only allow-listed routes, and respect href: null as a second guard.
  const visibleRoutes = useMemo(
    () =>
      state.routes.filter((route: any) => {
        const { options } = descriptors[route.key] ?? {};
        return (
          (VISIBLE_ROUTES as readonly string[]).includes(route.name) &&
          options?.href !== null
        );
      }),
    [state.routes, descriptors]
  );

  const activeKey: string | undefined = state.routes[state.index]?.key;
  const activeIsVisible = visibleRoutes.some((r: any) => r.key === activeKey);
  const activeRouteName = state.routes[state.index]?.name;
  const isProductDetails = segments[0] === 'product';
  const showMiniCart =
    !isProductDetails &&
    (activeRouteName === 'index' ||
      activeRouteName === 'search' ||
      (activeRouteName === 'categories' && miniCartEnabled));

  /* ---- measurements (state, so resize/rotation re-triggers the pill) ---- */
  const [layouts, setLayouts] = useState<Record<string, TabItemLayout>>({});

  const updateLayout = useCallback(
    (key: string, patch: Partial<TabItemLayout>) => {
      setLayouts((prev) => {
        const current = prev[key] ?? { x: 0, width: 0, inner: 0 };
        const next = { ...current, ...patch };
        if (
          next.x === current.x &&
          next.width === current.width &&
          next.inner === current.inner
        ) {
          return prev; // avoid needless re-renders
        }
        return { ...prev, [key]: next };
      });
    },
    []
  );

  const onOuterLayout = (key: string, e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    updateLayout(key, { x, width: w });
  };

  const onInnerLayout = (key: string, e: LayoutChangeEvent) => {
    updateLayout(key, { inner: e.nativeEvent.layout.width });
  };

  /* ---- sliding pill ---- */
  const [slideX] = useState(() => new Animated.Value(0));
  const [podWidth] = useState(() => new Animated.Value(0));
  const hasPositioned = useRef(false);
  const [podReady, setPodReady] = useState(false);

  const active = activeKey ? layouts[activeKey] : undefined;

  useEffect(() => {
    if (!activeIsVisible || !active || !active.width || !active.inner) return;

    // Dynamic width based on actual icon + text width.
    // Categories becomes wider, Home/Search/Profile become smaller.
    const targetWidth = active.inner + POD_H_PADDING * 2;

    // Center the pill on the selected tab.
    let targetX = active.x + (active.width - targetWidth) / 2;

    // Prevent the dynamic pill from leaving the tab bar.
    const minX = POD_EDGE_GAP;
    const maxX = BAR_WIDTH - targetWidth - POD_EDGE_GAP;

    targetX = Math.max(minX, Math.min(targetX, maxX));

    if (!hasPositioned.current) {
      slideX.setValue(targetX);
      podWidth.setValue(targetWidth);
      hasPositioned.current = true;
      setPodReady(true);
      return;
    }

    Animated.parallel([
      Animated.spring(slideX, {
        toValue: targetX,
        damping: 20,
        stiffness: 190,
        mass: 1,
        useNativeDriver: false,
      }),

      Animated.spring(podWidth, {
        toValue: targetWidth,
        damping: 20,
        stiffness: 190,
        mass: 1,
        useNativeDriver: false,
      }),
    ]).start();
  }, [active, activeIsVisible, BAR_WIDTH, podWidth, slideX]);

  const selectTab = (routeKey: string, routeName: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  if (activeRouteName === 'cart') return null;

  return (
    <>
      <MiniCart enabled={showMiniCart} />
      <Animated.View
        style={[
          styles.fixedOuterWrapper,
          {
            paddingBottom: Math.max(insets.bottom, IS_IOS ? 12 : 14),
            transform: [{ translateY: tabBarTranslateY }],
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={[styles.glassBarContainer, { width: BAR_WIDTH }]}>
          {/* iOS only: real blur lives in its own clipped layer so the bar's
              shadow is not cut off. Android skips this entirely. */}
          {IS_IOS && (
            <View style={styles.iosGlassClip} pointerEvents="none">
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.glassSheenHighlight} />
            </View>
          )}

          {/* Sliding pill: sized and positioned from the measured active tab */}
          {podReady && activeIsVisible && (
            <Animated.View
              pointerEvents="none"
              style={[styles.slidingPod, { left: slideX, width: podWidth }]}
            />
          )}

          <View style={styles.tabsRow}>
            {visibleRoutes.map((route: any) => {
              const { options } = descriptors[route.key];
              const isFocused = activeKey === route.key;
              const icons = ICONS[route.name];
              const iconName = (isFocused ? icons?.active : icons?.inactive) as any;

              const label = route.name === 'index' ? t('nav.home')
                : route.name === 'categories' ? t('nav.categories')
                : route.name === 'search' ? t('nav.search')
                : route.name === 'profile' ? t('nav.profile')
                : options.title ?? options.headerTitle ?? route.name;

              return (
                <Pressable
                  key={route.key}
                  onLayout={(e) => onOuterLayout(route.key, e)}
                  onPress={() => selectTab(route.key, route.name, isFocused)}
                  style={({ pressed }) => [
                    styles.tabItem,
                    pressed && styles.tabItemPressed,
                  ]}
                  hitSlop={8}
                  accessibilityRole="tab"
                  accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                  accessibilityState={{ selected: isFocused }}
                >
                  <View
                    onLayout={(e) => onInnerLayout(route.key, e)}
                    style={styles.tabContent}
                  >
                    <Ionicons
                      name={iconName}
                      size={ICON_SIZE}
                      color={isFocused ? THEME.active : THEME.inactive}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="clip"
                      maxFontSizeMultiplier={1.15}
                    >
                      {label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </>
  );
}

/* ----------------------------- Layout ----------------------------- */

export default function TabLayout() {
  const { t } = useLanguage();
  return (
    <TabBarProvider>
      <Tabs
        tabBar={(props) => <LiquidGlassTabBar {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTitleStyle: { fontWeight: '800', color: Colors.ink },
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('nav.home'), headerShown: false }} />
        <Tabs.Screen
          name="categories"
          options={{ title: t('nav.categories'), headerShown: false }}
        />
        <Tabs.Screen
          name="search"
          options={{ title: t('nav.search'), headerTitle: t('nav.searchMedications') }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: t('nav.profile'), headerTitle: t('nav.myAccount') }}
        />
        {/* Cart: route stays functional, but never shown in the bar */}
        <Tabs.Screen
          name="cart"
          options={{
            href: null,
            title: t('nav.cart'),
            headerTitle: t('nav.inquiryBasket'),
          }}
        />
      </Tabs>
    </TabBarProvider>
  );
}

/* ------------------------------ Styles ------------------------------ */

const styles = StyleSheet.create({
  fixedOuterWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  // No overflow:hidden here. On iOS it would clip the shadow; on Android the
  // elevation shadow is drawn from this view's rounded outline, so the opaque
  // background + radius is all it needs (one view, cheapest possible render).
  glassBarContainer: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: THEME.barBg,
    borderWidth: IS_IOS ? 1 : StyleSheet.hairlineWidth,
    borderColor: THEME.barBorder,
    // iOS shadow
    shadowColor: THEME.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    // Android shadow
    elevation: 6,
  },

  // iOS only: clips BlurView to the capsule (BlurView ignores its own borderRadius).
  iosGlassClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },

  // Inset by the corner radius so the highlight never pokes past the curve.
  glassSheenHighlight: {
    position: 'absolute',
    top: 0,
    left: BAR_HEIGHT / 2,
    right: BAR_HEIGHT / 2,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },

  slidingPod: {
    position: 'absolute',
    top: POD_V_INSET,
    bottom: POD_V_INSET,
    borderRadius: POD_HEIGHT / 2,
    backgroundColor: THEME.podBg,
    borderWidth: 1,
    borderColor: THEME.podBorder,
    zIndex: 1,
  },

  // No horizontal padding here: measured x values must share the same
  // coordinate space as the absolutely-positioned pill.
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabItemPressed: {
    opacity: 0.65,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.1,
    textAlign: 'center',
    includeFontPadding: false, // Android: removes the extra top/bottom text padding
  },
  tabLabelActive: {
    color: THEME.active,
    fontWeight: '600',
  },
  tabLabelInactive: {
    color: THEME.inactive,
    fontWeight: '500',
  },
});