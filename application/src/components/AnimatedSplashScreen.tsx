import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  I18nManager,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const { width } = Dimensions.get('window');

const C = {
  bg: Colors.pageBase || '#FFFFFF',
  primary: Colors.primary || '#0056b3',
  ink: Colors.ink || '#1F2933',
  muted: Colors.secondary || '#5B6770',
  soft: Colors.primaryLight || '#E6F0FA',
};

const LOGO_SIZE = Math.min(width * 0.36, 150);
const STAGE_SIZE = Math.min(width * 0.78, 320);
const CHIP_SIZE = 44;
const UNDERLINE_W = 48;
const PROGRESS_W = 96;

// Keeps "Maryland" on the left and "Pharmacy" on the right even if the app runs in RTL.
const ROW = I18nManager.isRTL ? 'row-reverse' : 'row';

const TITLE_WORDS = ['Maryland', 'Pharmacy'];

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CHIPS: { icon: IconName; pos: ViewStyle; floatMs: number }[] = [
  { icon: 'pill', pos: { top: '6%', left: '6%' }, floatMs: 2200 },
  { icon: 'heart-pulse', pos: { top: '14%', right: '2%' }, floatMs: 2600 },
  { icon: 'shield-check-outline', pos: { bottom: '14%', left: '0%' }, floatMs: 2400 },
  { icon: 'medical-bag', pos: { bottom: '4%', right: '10%' }, floatMs: 2000 },
];

/* ------------------------------------------------------------------ */
/* Animation helpers                                                   */
/* ------------------------------------------------------------------ */

const EASE_OUT = Easing.out(Easing.cubic);

const timing = (
  value: Animated.Value,
  toValue: number,
  duration: number,
  easing: (t: number) => number = EASE_OUT,
) => Animated.timing(value, { toValue, duration, easing, useNativeDriver: true });

const spring = (value: Animated.Value, friction = 6, tension = 70) =>
  Animated.spring(value, { toValue: 1, friction, tension, useNativeDriver: true });

const at = (ms: number, anim: Animated.CompositeAnimation) =>
  Animated.sequence([Animated.delay(ms), anim]);

const createValues = () => ({
  halo: new Animated.Value(0),
  logo: new Animated.Value(0),
  ringA: new Animated.Value(0),
  ringB: new Animated.Value(0),
  chips: CHIPS.map(() => new Animated.Value(0)),
  floats: CHIPS.map(() => new Animated.Value(0)),
  letters: TITLE_WORDS.map((w) => Array.from(w).map(() => new Animated.Value(0))),
  underline: new Animated.Value(0),
  arabic: new Animated.Value(0),
  tagline: new Animated.Value(0),
  progress: new Animated.Value(0),
  exit: new Animated.Value(1),
});

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AnimatedSplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const [v] = useState(createValues);

  // Keep the latest callback without restarting the animation when the parent re-renders.
  const onCompleteRef = useRef(onAnimationComplete);
  useEffect(() => {
    onCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const running: Animated.CompositeAnimation[] = [];
    const finish = () => onCompleteRef.current?.();

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;

      // Respect "Reduce Motion": show the final frame, no movement.
      if (reduceMotion) {
        [
          v.halo, v.logo, v.underline, v.arabic, v.tagline, v.progress,
          ...v.chips,
          ...v.letters.flat(),
        ].forEach((a) => a.setValue(1));
        timer = setTimeout(finish, 1500);
        return;
      }

      // Ambient loops: floating icons + soft ripple rings behind the logo.
      v.floats.forEach((f, i) => {
        const ease = Easing.inOut(Easing.sin);
        const loop = Animated.loop(
          Animated.sequence([
            timing(f, 1, CHIPS[i].floatMs, ease),
            timing(f, 0, CHIPS[i].floatMs, ease),
          ]),
        );
        running.push(loop);
        loop.start();
      });

      [v.ringA, v.ringB].forEach((ring, i) => {
        const ripple = Animated.sequence([
          Animated.delay(600 + i * 1200),
          Animated.loop(timing(ring, 1, 2400, Easing.out(Easing.quad))),
        ]);
        running.push(ripple);
        ripple.start();
      });

      // Main choreography.
      const intro = Animated.parallel([
        // 1. Logo + halo
        at(100, timing(v.halo, 1, 700)),
        at(150, spring(v.logo, 7, 60)),

        // 2. Icons pop in, one after another
        ...v.chips.map((c, i) => at(450 + i * 140, spring(c, 6, 80))),

        // 3. THE moment: title fades in letter by letter, left → right
        at(
          550,
          Animated.stagger(
            35,
            v.letters.flat().map((l) => timing(l, 1, 500)),
          ),
        ),

        // 4. Accent line sweeps left → right
        at(1150, timing(v.underline, 1, 600)),

        // 5. Arabic name, then tagline
        at(1300, timing(v.arabic, 1, 600)),
        at(1600, timing(v.tagline, 1, 600)),

        // 6. Progress line runs for the whole intro
        at(200, timing(v.progress, 1, 2200, Easing.inOut(Easing.cubic))),
      ]);

      const master = Animated.sequence([
        intro,
        Animated.delay(600), // hold
        timing(v.exit, 0, 400, Easing.in(Easing.quad)), // fade out
      ]);

      running.push(master);
      master.start(({ finished }) => {
        if (finished) finish();
      });
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      running.forEach((a) => a.stop());
    };
  }, [v]);

  const clamp = { extrapolate: 'clamp' as const };

  return (
    <Animated.View style={[styles.container, { opacity: v.exit }]}>
      {/* Quiet background shapes for depth */}
      <View pointerEvents="none" style={[styles.blob, styles.blobTop]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottom]} />

      {/* Logo stage */}
      <View style={styles.stage}>
        {[v.ringA, v.ringB].map((ring, i) => (
          <Animated.View
            key={i}
            style={[
              styles.ring,
              {
                opacity: ring.interpolate({
                  inputRange: [0, 0.15, 1],
                  outputRange: [0, 0.35, 0],
                }),
                transform: [
                  {
                    scale: ring.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1.75],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

        <Animated.View
          style={[
            styles.halo,
            {
              opacity: v.halo,
              transform: [
                { scale: v.halo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
              ],
            },
          ]}
        />

        <Animated.Image
          // IMPORTANT: Replace this with the actual path to your logo
          source={require('../../assets/logo.png')}
          resizeMode="contain"
          style={[
            styles.logo,
            {
              opacity: v.logo.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1], ...clamp }),
              transform: [
                { scale: v.logo.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
              ],
            },
          ]}
        />

        {CHIPS.map((chip, i) => (
          <Animated.View
            key={chip.icon}
            style={[
              styles.chip,
              chip.pos,
              {
                opacity: v.chips[i].interpolate({
                  inputRange: [0, 0.5],
                  outputRange: [0, 1],
                  ...clamp,
                }),
                transform: [
                  { scale: v.chips[i] },
                  {
                    translateY: v.floats[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-5, 5],
                    }),
                  },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons name={chip.icon} size={22} color={C.primary} />
          </Animated.View>
        ))}
      </View>

      {/* English title: letters fade in left → right */}
      <View
        style={styles.titleRow}
        accessible
        accessibilityRole="header"
        accessibilityLabel="Maryland Pharmacy"
      >
        {TITLE_WORDS.map((word, wi) => (
          <View key={word} style={styles.word}>
            {Array.from(word).map((ch, ci) => {
              const val = v.letters[wi][ci];
              return (
                <Animated.Text
                  key={ci}
                  style={[
                    styles.titleEn,
                    {
                      opacity: val,
                      transform: [
                        {
                          translateX: val.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-14, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {ch}
                </Animated.Text>
              );
            })}
          </View>
        ))}
      </View>

      {/* Accent line sweeping in from the left */}
      <View style={styles.underlineTrack}>
        <Animated.View
          style={[
            styles.underlineFill,
            {
              transform: [
                {
                  translateX: v.underline.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-UNDERLINE_W, 0],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      {/* Arabic title */}
      <Animated.Text
        style={[
          styles.titleAr,
          {
            opacity: v.arabic,
            transform: [
              {
                translateY: v.arabic.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
              },
            ],
          },
        ]}
      >
        صيدلية ميريلاند
      </Animated.Text>

      {/* Arabic tagline pill */}
      <Animated.View
        style={[
          styles.pill,
          {
            opacity: v.tagline,
            transform: [
              {
                translateY: v.tagline.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.pillText}>صحتكم أولويتنا</Text>
      </Animated.View>

      {/* Slim progress line */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              transform: [
                {
                  translateX: v.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-PROGRESS_W, 0],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  // Background shapes
  blob: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
    borderRadius: width,
    backgroundColor: C.soft,
  },
  blobTop: { top: -width * 0.5, right: -width * 0.35, opacity: 0.55 },
  blobBottom: { bottom: -width * 0.55, left: -width * 0.4, opacity: 0.35 },

  // Logo stage
  stage: {
    width: STAGE_SIZE,
    height: STAGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: LOGO_SIZE * 1.35,
    height: LOGO_SIZE * 1.35,
    borderRadius: LOGO_SIZE,
    backgroundColor: C.soft,
  },
  ring: {
    position: 'absolute',
    width: LOGO_SIZE * 1.35,
    height: LOGO_SIZE * 1.35,
    borderRadius: LOGO_SIZE,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  chip: {
    position: 'absolute',
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: CHIP_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.soft,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  // Titles
  titleRow: {
    flexDirection: ROW,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
  },
  word: {
    flexDirection: ROW,
    marginHorizontal: 6,
  },
  titleEn: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: C.primary,
    includeFontPadding: false,
  },
  underlineTrack: {
    width: UNDERLINE_W,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 14,
  },
  underlineFill: {
    width: UNDERLINE_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
  titleAr: {
    fontSize: 22,
    fontWeight: '600',
    color: C.ink,
    fontFamily: 'System',
    marginTop: 14,
  },

  // Tagline
  pill: {
    marginTop: 22,
    backgroundColor: C.soft,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.muted,
  },

  // Progress
  progressTrack: {
    position: 'absolute',
    bottom: 56,
    width: PROGRESS_W,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: C.soft,
  },
  progressFill: {
    width: PROGRESS_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
});