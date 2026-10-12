import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface SearchBarProps {
  placeholder?: string;
  initialValue?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export default function SearchBar({
  placeholder = 'Search medicine, beauty, vitamins...',
  initialValue = '',
  onSearch,
  debounceMs = 400,
}: SearchBarProps) {
  const [text, setText] = useState(initialValue);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  const handleChangeText = (val: string) => {
    setText(val);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      onSearch(val.trim());
    }, debounceMs);
  };

  const handleClear = () => {
    setText('');
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.secondary} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.muted}
          value={text}
          onChangeText={handleChangeText}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {text.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pageBase,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: Colors.ink,
  },
});