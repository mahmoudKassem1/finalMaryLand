import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

export const TAB_BAR_HEIGHT = 76;

interface TabBarContextType {
  tabBarTranslateY: Animated.Value;
  tabBarHidden: boolean;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  hideTabBar: () => void;
  showTabBar: () => void;
  miniCartEnabled: boolean;
  setMiniCartEnabled: (enabled: boolean) => void;
}

const TabBarContext = createContext<TabBarContextType | null>(null);

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const [tabBarTranslateY] = useState(() => new Animated.Value(0));
  const [tabBarHidden, setTabBarHidden] = useState(false);
  const [miniCartEnabled, setMiniCartEnabled] = useState(false);
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);

  const hideTabBar = useCallback(() => {
    if (isHidden.current) return;
    isHidden.current = true;
    setTabBarHidden(true);
    Animated.timing(tabBarTranslateY, {
      toValue: 110,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [tabBarTranslateY]);

  const showTabBar = useCallback(() => {
    if (!isHidden.current) return;
    isHidden.current = false;
    setTabBarHidden(false);
    Animated.spring(tabBarTranslateY, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [tabBarTranslateY]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (currentY <= 15) {
      showTabBar();
      lastScrollY.current = currentY;
      return;
    }

    if (diff > 12) hideTabBar();
    else if (diff < -12) showTabBar();

    lastScrollY.current = currentY;
  }, [hideTabBar, showTabBar]);

  const contextValue = useMemo(
    () => ({
      tabBarTranslateY,
      tabBarHidden,
      handleScroll,
      hideTabBar,
      showTabBar,
      miniCartEnabled,
      setMiniCartEnabled,
    }),
    [tabBarTranslateY, tabBarHidden, handleScroll, hideTabBar, showTabBar, miniCartEnabled]
  );

  return (
    <TabBarContext.Provider value={contextValue}>
      {children}
    </TabBarContext.Provider>
  );
}

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    return {
      tabBarTranslateY: new Animated.Value(0),
      tabBarHidden: false,
      handleScroll: () => {},
      hideTabBar: () => {},
      showTabBar: () => {},
      miniCartEnabled: false,
      setMiniCartEnabled: () => {},
    };
  }
  return context;
};