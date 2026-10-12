import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../constants/Colors';
import { useCart } from '../context/CartContext';

export default function CartHeaderButton() {
  const router = useRouter();
  const { totalItems } = useCart();
  const badgeLabel = totalItems > 99 ? '99+' : String(totalItems);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
      hitSlop={10}
      onPress={() => router.push('/cart')}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Ionicons name="bag-handle-outline" size={23} color={Colors.primary} />
      <Text style={styles.label}>Cart</Text>
      <Text style={styles.badge} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {badgeLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  label: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    paddingHorizontal: 5,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: Colors.surface,
    backgroundColor: Colors.primary,
    fontSize: 11,
    lineHeight: 22,
    fontWeight: '900',
    includeFontPadding: false,
  },
});