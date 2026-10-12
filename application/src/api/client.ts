import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import CONFIG from '../constants/Config';

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
});

// Restored the interceptor the AI accidentally broke
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(error)
);

export default apiClient;