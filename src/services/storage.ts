import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types';

const SETTINGS_KEY = '@sony_remote_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  tvIp: '192.168.5.234',
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
    // Xóa mã PSK mặc định cũ '1234' đã lưu từ bản cũ để không chặn kết nối Android TV
    if (parsed.psk === '1234') {
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
