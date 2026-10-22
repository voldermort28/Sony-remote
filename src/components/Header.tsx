import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Power, Settings as SettingsIcon, Tv, Wifi, WifiOff } from 'lucide-react-native';
import { triggerHaptic } from '../services/haptics';

interface HeaderProps {
  tvModel?: string;
  tvIp: string;
  isConnected: boolean;
  hapticEnabled: boolean;
  onPowerPress: () => void;
  onSettingsPress: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tvModel,
  tvIp,
  isConnected,
  hapticEnabled,
  onPowerPress,
  onSettingsPress,
}) => {
  return (
    <View style={styles.container}>
      {/* TV Info Status Pill */}
      <View style={styles.statusPill}>
        <View style={[styles.statusDot, isConnected ? styles.dotGreen : styles.dotAmber]} />
        <Tv size={16} color="#94A3B8" style={styles.tvIcon} />
        <View>
          <Text style={styles.modelText} numberOfLines={1}>
            {tvModel || 'Sony BRAVIA'}
          </Text>
          <Text style={styles.ipText} numberOfLines={1}>
            {tvIp ? tvIp : 'Chưa nhập IP'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.powerButton}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'heavy');
            onPowerPress();
          }}
        >
          <Power size={20} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'light');
            onSettingsPress();
          }}
        >
          <SettingsIcon size={20} color="#E2E8F0" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: '65%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotAmber: {
    backgroundColor: '#F59E0B',
  },
  tvIcon: {
    marginRight: 6,
  },
  modelText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  ipText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  powerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#450A0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#991B1B',
  },
});
