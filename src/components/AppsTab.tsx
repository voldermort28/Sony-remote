import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { RefreshCw, PlaySquare, ExternalLink } from 'lucide-react-native';
import { TvAppInfo } from '../types';
import { triggerHaptic } from '../services/haptics';

interface AppsTabProps {
  apps: TvAppInfo[];
  isLoading: boolean;
  onRefreshApps: () => void;
  onLaunchApp: (app: TvAppInfo) => void;
  hapticEnabled: boolean;
}

// Default apps fallback when TV is offline or before first load
const FALLBACK_APPS: TvAppInfo[] = [
  {
    title: 'YouTube',
    uri: 'com.sony.dtv.com.google.android.youtube.tv.com.google.android.apps.youtube.tv.activity.ShellActivity',
  },
  {
    title: 'Netflix',
    uri: 'com.sony.dtv.com.netflix.ninja.com.netflix.ninja.MainActivity',
  },
  {
    title: 'Spotify',
    uri: 'com.sony.dtv.com.spotify.tv.android.com.spotify.tv.android.SpotifyTVActivity',
  },
  {
    title: 'Prime Video',
    uri: 'com.sony.dtv.com.amazon.amazonvideo.livingroom.com.amazon.amazonvideo.livingroom.MainActivity',
  },
  {
    title: 'Kodi',
    uri: 'com.sony.dtv.org.xbmc.kodi.org.xbmc.kodi.Splash',
  },
  {
    title: 'VLC',
    uri: 'com.sony.dtv.org.videolan.vlc.org.videolan.vlc.StartActivity',
  },
];

export const AppsTab: React.FC<AppsTabProps> = ({
  apps,
  isLoading,
  onRefreshApps,
  onLaunchApp,
  hapticEnabled,
}) => {
  const displayApps = apps.length > 0 ? apps : FALLBACK_APPS;

  const renderAppItem = ({ item }: { item: TvAppInfo }) => {
    return (
      <TouchableOpacity
        style={styles.appCard}
        activeOpacity={0.7}
        onPress={() => {
          triggerHaptic(hapticEnabled, 'medium');
          onLaunchApp(item);
        }}
      >
        <View style={styles.iconContainer}>
          {item.icon ? (
            <Image source={{ uri: item.icon }} style={styles.appIcon} resizeMode="contain" />
          ) : (
            <PlaySquare size={32} color="#38BDF8" />
          )}
        </View>
        <Text style={styles.appTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mở Nhanh Ứng Dụng</Text>
          <Text style={styles.subtitle}>
            {apps.length > 0
              ? `Tìm thấy ${apps.length} ứng dụng trên TV`
              : 'Hiển thị các ứng dụng phổ biến (Chạm làm mới để tải từ TV)'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          activeOpacity={0.6}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'light');
            onRefreshApps();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#38BDF8" />
          ) : (
            <RefreshCw size={18} color="#E2E8F0" />
          )}
        </TouchableOpacity>
      </View>

      {/* Grid of Apps */}
      <FlatList
        data={displayApps}
        keyExtractor={(item) => item.uri || item.title}
        renderItem={renderAppItem}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    maxWidth: 240,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  listContent: {
    paddingBottom: 30,
  },
  appCard: {
    flex: 1 / 3,
    backgroundColor: '#1E293B',
    margin: 6,
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 110,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  appIcon: {
    width: 46,
    height: 46,
  },
  appTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
