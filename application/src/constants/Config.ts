import { Platform } from 'react-native';

export const CONFIG = {
  // Uses your local environment variable first, then correctly routes emulator traffic
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || Platform.select({
    android: 'http://10.0.2.2:5000/api',
    ios: 'http://localhost:5000/api',
    default: 'http://localhost:5000/api',
  }),
  PHARMACY_WHATSAPP: '+201000686866',
  PHARMACY_LOCATION: 'Alexandria, Egypt',
  DEFAULT_CITY: 'Alexandria',
};

export default CONFIG;