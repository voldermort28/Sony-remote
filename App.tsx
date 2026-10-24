import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Tv, MousePointer, LayoutGrid, Hash, Keyboard } from 'lucide-react-native';
import { Header } from './src/components/Header';
import { RemoteTab } from './src/components/RemoteTab';
import { TrackpadTab } from './src/components/TrackpadTab';
import { AppsTab } from './src/components/AppsTab';
import { NumpadTab } from './src/components/NumpadTab';
import { TextSyncTab } from './src/components/TextSyncTab';
import { SettingsModal } from './src/components/SettingsModal';
import {
  sendIrcc,
  checkTvConnection,
  requestTvPairing,
  setCachedAuthCookie,
  getTvApps,
  launchTvApp,
  sendTextToTv,
} from './src/services/sonyApi';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './src/services/storage';
import {
  setupHardwareVolumeListener,
  cleanupHardwareVolumeListener,
} from './src/services/volumeService';
import { triggerHaptic } from './src/services/haptics';
import { AppSettings, ConnectionState, TabType, TvAppInfo } from './src/types';
import { IrccKey } from './src/constants/irccCodes';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<TabType>('remote');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [apps, setApps] = useState<TvAppInfo[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isChecking: false,
  });

  // 1. Load saved settings on startup
  useEffect(() => {
    (async () => {
      const saved = await loadSettings();
      if (saved.authCookie) {
        setCachedAuthCookie(saved.authCookie);
      }
      setSettings(saved);

      if (saved.tvIp) {
        testTvConnection(saved.tvIp, saved.psk);
      } else {
        // Prompt settings on first launch
        setSettingsVisible(true);
      }
    })();
  }, []);

  // 2. Setup hardware volume listener
  useEffect(() => {
    if (settings.hardwareVolumeEnabled && settings.tvIp) {
      setupHardwareVolumeListener(
        true,
        settings.tvIp,
        settings.psk,
        settings.hapticFeedbackEnabled
      );
    } else {
      cleanupHardwareVolumeListener();
    }

    return () => {
      cleanupHardwareVolumeListener();
    };
  }, [settings.hardwareVolumeEnabled, settings.tvIp, settings.psk, settings.hapticFeedbackEnabled]);

  // Test connection function
  const testTvConnection = async (ip: string, psk: string) => {
    if (!ip.trim()) {
      setConnectionState({
        isConnected: false,
        isChecking: false,
        needsPinPairing: false,
        lastError: 'Vui lòng nhập địa chỉ IP của TV',
      });
      return;
    }

    setConnectionState((prev) => ({
      ...prev,
      isChecking: true,
      needsPinPairing: false,
      lastError: undefined,
    }));
    const result = await checkTvConnection(ip, psk);

    if (result.success) {
      if (result.cookie) {
        const updated = { ...settings, tvIp: ip.trim(), authCookie: result.cookie };
        setSettings(updated);
        await saveSettings(updated);
      }
      setConnectionState({
        isConnected: true,
        isChecking: false,
        needsPinPairing: false,
        tvModel: result.model,
      });
      // Preload apps list if successful
      fetchApps(ip, psk);
    } else {
      setConnectionState({
        isConnected: false,
        isChecking: false,
        needsPinPairing: result.needsPinPairing,
        tvModel: result.model,
        lastError: result.error,
      });
    }
  };

  // Submit 4-digit PIN displayed on Sony TV screen
  const handleSubmitPin = async (ip: string, pin: string) => {
    setConnectionState((prev) => ({ ...prev, isChecking: true, lastError: undefined }));
    const pairResult = await requestTvPairing(ip, pin);
    if (pairResult.paired) {
      const updated = {
        ...settings,
        tvIp: ip.trim(),
        authCookie: pairResult.cookie || settings.authCookie,
      };
      setSettings(updated);
      await saveSettings(updated);
      setConnectionState((prev) => ({
        ...prev,
        isConnected: true,
        isChecking: false,
        needsPinPairing: false,
        lastError: undefined,
      }));
      fetchApps(ip, settings.psk);
    } else {
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isChecking: false,
        needsPinPairing: true,
        lastError: pairResult.error,
      }));
    }
  };

  // Fetch installed apps
  const fetchApps = async (ip?: string, psk?: string) => {
    const targetIp = ip || settings.tvIp;
    const targetPsk = psk || settings.psk;
    if (!targetIp) return;

    setIsLoadingApps(true);
    const result = await getTvApps(targetIp, targetPsk);
    setIsLoadingApps(false);

    if (result.success && result.apps.length > 0) {
      setApps(result.apps);
    }
  };

  // Handle sending IRCC command
  const handleSendCommand = useCallback(
    async (key: IrccKey) => {
      if (!settings.tvIp) {
        Alert.alert('Chưa cấu hình TV', 'Vui lòng nhấn biểu tượng Cài đặt ở góc trên để nhập IP của TV.');
        setSettingsVisible(true);
        return;
      }

      const res = await sendIrcc(settings.tvIp, settings.psk, key);
      if (!res.success && res.error) {
        setConnectionState((prev) => ({ ...prev, isConnected: false, lastError: res.error }));
      } else {
        if (!connectionState.isConnected) {
          setConnectionState((prev) => ({ ...prev, isConnected: true, lastError: undefined }));
        }
      }
    },
    [settings.tvIp, settings.psk, connectionState.isConnected]
  );

  // Handle launch App
  const handleLaunchApp = useCallback(
    async (app: TvAppInfo) => {
      const res = await launchTvApp(settings.tvIp, settings.psk, app.uri);
      if (!res.success) {
        Alert.alert('Không thể mở ứng dụng', res.error || 'Vui lòng kiểm tra kết nối với TV.');
      }
    },
    [settings.tvIp, settings.psk]
  );

  // Handle send Text to TV
  const handleSendText = useCallback(
    async (text: string): Promise<boolean> => {
      if (!settings.tvIp) {
        Alert.alert('Chưa có IP TV', 'Vui lòng vào Cài đặt để nhập IP của TV.');
        return false;
      }
      const res = await sendTextToTv(settings.tvIp, settings.psk, text);
      if (!res.success) {
        Alert.alert(
          'Lưu ý nhập văn bản',
          res.error || 'Hãy đảm bảo TV đang mở một ô tìm kiếm (như ô Search YouTube) trước khi bấm gửi.'
        );
        return false;
      }
      return true;
    },
    [settings.tvIp, settings.psk]
  );

  // Handle Power button
  const handlePowerPress = () => {
    handleSendCommand('Power');
  };

  // Handle Save settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
    testTvConnection(newSettings.tvIp, newSettings.psk);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'remote':
        return (
          <RemoteTab
            onSendCommand={handleSendCommand}
            hapticEnabled={settings.hapticFeedbackEnabled}
          />
        );
      case 'trackpad':
        return (
          <TrackpadTab
            onSendCommand={handleSendCommand}
            onSendText={handleSendText}
            hapticEnabled={settings.hapticFeedbackEnabled}
          />
        );
      case 'apps':
        return (
          <AppsTab
            apps={apps}
            isLoading={isLoadingApps}
            onRefreshApps={() => fetchApps()}
            onLaunchApp={handleLaunchApp}
            hapticEnabled={settings.hapticFeedbackEnabled}
          />
        );
      case 'numpad':
        return (
          <NumpadTab
            onSendCommand={handleSendCommand}
            hapticEnabled={settings.hapticFeedbackEnabled}
          />
        );
      case 'text':
        return (
          <TextSyncTab
            onSendText={handleSendText}
            hapticEnabled={settings.hapticFeedbackEnabled}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Header */}
      <Header
        tvModel={connectionState.tvModel}
        tvIp={settings.tvIp}
        isConnected={connectionState.isConnected}
        hapticEnabled={settings.hapticFeedbackEnabled}
        onPowerPress={handlePowerPress}
        onSettingsPress={() => setSettingsVisible(true)}
      />

      {/* Main Tab Screen Content */}
      <View style={styles.content}>{renderTabContent()}</View>

      {/* Bottom Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'remote' && styles.activeTabItem]}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(settings.hapticFeedbackEnabled, 'light');
            setActiveTab('remote');
          }}
        >
          <Tv size={22} color={activeTab === 'remote' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'remote' && styles.activeTabLabel]}>
            Remote
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'trackpad' && styles.activeTabItem]}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(settings.hapticFeedbackEnabled, 'light');
            setActiveTab('trackpad');
          }}
        >
          <MousePointer size={22} color={activeTab === 'trackpad' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'trackpad' && styles.activeTabLabel]}>
            Trackpad
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'apps' && styles.activeTabItem]}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(settings.hapticFeedbackEnabled, 'light');
            setActiveTab('apps');
            if (apps.length === 0) fetchApps();
          }}
        >
          <LayoutGrid size={22} color={activeTab === 'apps' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'apps' && styles.activeTabLabel]}>
            Ứng dụng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'numpad' && styles.activeTabItem]}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(settings.hapticFeedbackEnabled, 'light');
            setActiveTab('numpad');
          }}
        >
          <Hash size={22} color={activeTab === 'numpad' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'numpad' && styles.activeTabLabel]}>
            Bàn phím số
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'text' && styles.activeTabItem]}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(settings.hapticFeedbackEnabled, 'light');
            setActiveTab('text');
          }}
        >
          <Keyboard size={22} color={activeTab === 'text' ? '#38BDF8' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'text' && styles.activeTabLabel]}>
            Gõ chữ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        settings={settings}
        connectionState={connectionState}
        onClose={() => setSettingsVisible(false)}
        onSave={handleSaveSettings}
        onTestConnection={(ip, psk) => testTvConnection(ip, psk)}
        onSubmitPin={(ip, pin) => handleSubmitPin(ip, pin)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeTabItem: {},
  tabLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#38BDF8',
  },
});
