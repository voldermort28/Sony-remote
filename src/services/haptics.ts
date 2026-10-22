import * as Haptics from 'expo-haptics';

export async function triggerHaptic(
  enabled: boolean,
  type: 'light' | 'medium' | 'heavy' | 'selection' = 'light'
): Promise<void> {
  if (!enabled) return;
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
    }
  } catch {
    // Ignore haptic errors on unsupported platforms/simulators
  }
}
