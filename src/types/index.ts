export interface AppSettings {
  tvIp: string;
  psk: string;
  hardwareVolumeEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  companionPort: number;
  companionEnabled: boolean;
}

export interface TvAppInfo {
  title: string;
  uri: string;
  icon?: string;
}

export type TabType = 'remote' | 'trackpad' | 'apps' | 'numpad' | 'text' | 'settings';

export interface ConnectionState {
  isConnected: boolean;
  isChecking: boolean;
  lastError?: string;
  tvModel?: string;
}
