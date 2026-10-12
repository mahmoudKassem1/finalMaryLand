import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const Storage = {
  async getSecure(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  async setSecure(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async removeSecure(key: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
  async getItem<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  async setItem(key: string, value: any): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
};