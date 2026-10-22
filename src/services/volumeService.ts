import { VolumeManager } from 'react-native-volume-manager';
import { sendIrcc } from './sonyApi';
import { triggerHaptic } from './haptics';

let volumeListenerSubscription: { remove: () => void } | null = null;
let lastRecordedVolume: number | null = null;
let isProcessingVolume = false;

export function setupHardwareVolumeListener(
  enabled: boolean,
  tvIp: string,
  psk: string,
  hapticEnabled: boolean
): void {
  // Clear any existing listener
  if (volumeListenerSubscription) {
    try {
      volumeListenerSubscription.remove();
    } catch {}
    volumeListenerSubscription = null;
  }

  if (!enabled || !tvIp) {
    try {
      VolumeManager.showNativeVolumeUI({ enabled: true });
    } catch {}
    return;
  }

  try {
    // Hide phone's native volume HUD to give pure TV remote feeling
    VolumeManager.showNativeVolumeUI({ enabled: false });

    // Initialize initial volume level
    VolumeManager.getVolume().then((res) => {
      lastRecordedVolume = res.volume;
    }).catch(() => {});

    volumeListenerSubscription = VolumeManager.addVolumeListener((result) => {
      if (lastRecordedVolume === null) {
        lastRecordedVolume = result.volume;
        return;
      }

      const diff = result.volume - lastRecordedVolume;
      // Filter out micro changes
      if (Math.abs(diff) < 0.02) return;

      if (isProcessingVolume) return;
      isProcessingVolume = true;

      if (diff > 0) {
        // Volume Up pressed
        triggerHaptic(hapticEnabled, 'light');
        sendIrcc(tvIp, psk, 'VolumeUp');
      } else {
        // Volume Down pressed
        triggerHaptic(hapticEnabled, 'light');
        sendIrcc(tvIp, psk, 'VolumeDown');
      }

      lastRecordedVolume = result.volume;

      setTimeout(() => {
        isProcessingVolume = false;
      }, 150);
    });
  } catch (err) {
    console.warn('VolumeManager hardware listener not available:', err);
  }
}

export function cleanupHardwareVolumeListener(): void {
  if (volumeListenerSubscription) {
    try {
      volumeListenerSubscription.remove();
      VolumeManager.showNativeVolumeUI({ enabled: true });
    } catch {}
    volumeListenerSubscription = null;
  }
}
