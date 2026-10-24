import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';

const SETTINGS_KEY = '@sony_remote_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  tvIp: '',
  psk: '',
  authCookie: '',
  hardwareVolumeEnabled: true,
  hapticFeedbackEnabled: true,
  companionPort: 8080,
  companionEnabled: false,
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // Nếu chưa từng lưu IP mà psk đang là mặc định cũ '1234' thì chuyển về rỗng (chế độ chỉ dùng IP)
    if (!parsed.tvIp && parsed.psk === '1234') {
      parsed.psk = '';
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
