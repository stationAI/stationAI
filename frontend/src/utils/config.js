import { Platform } from 'react-native';

const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      return `http://${window.location.hostname}:8000`;
    }
    return "http://localhost:8000";
  }

  try {
    const Constants = require('expo-constants').default || require('expo-constants');
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:8000`;
    }
  } catch (e) {
    // Safe fallback if expo-constants is not loaded
  }

  return "http://localhost:8000";
};

export const BACKEND_URL = getBackendUrl();
