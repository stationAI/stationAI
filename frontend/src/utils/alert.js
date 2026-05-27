import { Platform, Alert } from 'react-native';

/**
 * Web-compatible Alert helper that uses native Alert.alert on iOS/Android,
 * and window.alert fallback on web browsers.
 */
export const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    window.alert(text);
    
    // Execute positive actions (like navigation or DB updates) if defined in the buttons
    if (buttons && buttons.length > 0) {
      // Look for custom action buttons
      const actionButton = buttons.find(b => b.onPress);
      if (actionButton && actionButton.onPress) {
        actionButton.onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
