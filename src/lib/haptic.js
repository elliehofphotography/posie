/**
 * Haptic Feedback Utility
 * Provides haptic feedback on critical user actions
 */

export const haptic = {
  light: () => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
  },
  medium: () => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(20);
    }
  },
  heavy: () => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(30);
    }
  },
  delete: () => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate([10, 5, 10]); // Double tap pattern
    }
  },
  success: () => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate([5, 10, 5]);
    }
  },
};