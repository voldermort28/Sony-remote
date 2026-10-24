import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { sendIrcc } from './sonyApi';
import { triggerHaptic } from './haptics';

let volumeListenerSubscription: { remove: () => void } | null = null;
let volumeEventEmitter: NativeEventEmitter | null = null;
let lastRecordedVolume: number | null = null;
let isProcessingVolume = false;
let initTimeout: ReturnType<typeof setTimeout> | null = null;

function getVolumeNativeModule(): any | null {
  try {
    return NativeModules?.VolumeManager ?? null;
  } catch {
    return null;
  }
}

export function setupHardwareVolumeListener(
  enabled: boolean,
  tvIp: string,
  psk: string,
  hapticEnabled: boolean
): void {
  if (initTimeout) {
    clearTimeout(initTimeout);
    initTimeout = null;
  }

  // Clear any existing listener
  if (volumeListenerSubscription) {
    try {
      volumeListenerSubscription.remove();
    } catch {}
    volumeListenerSubscription = null;
  }

  if (!enabled || !tvIp) {
    if (lastRecordedVolume !== null) {
      try {
        const mod = getVolumeNativeModule();
        if (mod && typeof mod.showNativeVolumeUI === 'function') {
          mod.showNativeVolumeUI({ enabled: true });
        }
      } catch {}
    }
    return;
  }

  // Delay initialization slightly so UIWindowScene is active on iOS 15+
  initTimeout = setTimeout(() => {
    try {
      const mod = getVolumeNativeModule();
      if (!mod) return;

      // Hide phone's native volume HUD to give pure TV remote feeling
      if (typeof mod.showNativeVolumeUI === 'function') {
        mod.showNativeVolumeUI({ enabled: false });
      }

      // Activate audio session on iOS so hardware buttons are captured
      if (Platform.OS === 'ios' && typeof mod.enable === 'function') {
        mod.enable(true, true);
      }

      // Initialize initial volume level
      if (typeof mod.getVolume === 'function') {
        Promise.resolve(mod.getVolume())
          .then((res: any) => {
            if (res && typeof res.volume === 'number') {
              lastRecordedVolume = res.volume;
            }
          })
          .catch(() => {});
      }

      if (!volumeEventEmitter) {
        volumeEventEmitter = new NativeEventEmitter(mod);
      }

      volumeListenerSubscription = volumeEventEmitter.addListener(
        'RNVMEventVolume',
        (result: { volume?: number }) => {
          if (!result || typeof result.volume !== 'number') return;

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
        }
      );
    } catch (err) {
      console.warn('VolumeManager hardware listener not available:', err);
    }
  }, 600);
}

export function cleanupHardwareVolumeListener(): void {
  if (initTimeout) {
    clearTimeout(initTimeout);
    initTimeout = null;
  }
  if (volumeListenerSubscription) {
    try {
      volumeListenerSubscription.remove();
      const mod = getVolumeNativeModule();
      if (mod && typeof mod.showNativeVolumeUI === 'function') {
        mod.showNativeVolumeUI({ enabled: true });
      }
    } catch {}
    volumeListenerSubscription = null;
  }
}
