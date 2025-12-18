import * as Haptics from 'expo-haptics';
// Sound optional: avoid static asset requires to keep Expo build working even if sounds are not present.
// If you want sounds later, we can add assets and enable expo-av here.

export type FeedbackType = 'success' | 'levelup' | 'goal' | 'module' | 'sign';

export function useGamifiedFeedback() {

  const vibrate = async (type: FeedbackType = 'success') => {
    try {
      if (type === 'levelup') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const playSound = async (_type: FeedbackType = 'success') => {
    // No-op for now to prevent build issues without bundled sound assets.
    return;
  };

  const celebrate = async (type: FeedbackType = 'success') => {
    await vibrate(type);
    await playSound(type);
  };

  return { vibrate, playSound, celebrate };
}
