import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  CornerDownLeft,
  Volume2,
  VolumeX,
  Volume1,
  Tv,
  List,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  LogIn,
  Info,
} from 'lucide-react-native';
import { IrccKey } from '../constants/irccCodes';
import { triggerHaptic } from '../services/haptics';

interface RemoteTabProps {
  onSendCommand: (key: IrccKey) => void;
  hapticEnabled: boolean;
}

export const RemoteTab: React.FC<RemoteTabProps> = ({ onSendCommand, hapticEnabled }) => {
  const handlePress = (key: IrccKey, hapticType: 'light' | 'medium' | 'heavy' = 'light') => {
    triggerHaptic(hapticEnabled, hapticType);
    onSendCommand(key);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Auxiliary Row */}
      <View style={styles.auxRow}>
        <TouchableOpacity
          style={styles.auxButton}
          activeOpacity={0.6}
          onPress={() => handlePress('Input')}
        >
          <LogIn size={18} color="#94A3B8" />
          <Text style={styles.auxText}>Input</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.auxButton}
          activeOpacity={0.6}
          onPress={() => handlePress('ActionMenu')}
        >
          <List size={18} color="#94A3B8" />
          <Text style={styles.auxText}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.auxButton}
          activeOpacity={0.6}
          onPress={() => handlePress('Return')}
        >
          <CornerDownLeft size={18} color="#94A3B8" />
          <Text style={styles.auxText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.auxButton, styles.homeButton]}
          activeOpacity={0.6}
          onPress={() => handlePress('Home', 'medium')}
        >
          <Home size={18} color="#38BDF8" />
          <Text style={[styles.auxText, { color: '#38BDF8' }]}>Home</Text>
        </TouchableOpacity>
      </View>

      {/* D-Pad Controller */}
      <View style={styles.dpadOuter}>
        {/* Up */}
        <TouchableOpacity
          style={[styles.dpadButton, styles.dpadUp]}
          activeOpacity={0.5}
          onPress={() => handlePress('Up')}
        >
          <ChevronUp size={34} color="#F8FAFC" />
        </TouchableOpacity>

        {/* Left */}
        <TouchableOpacity
          style={[styles.dpadButton, styles.dpadLeft]}
          activeOpacity={0.5}
          onPress={() => handlePress('Left')}
        >
          <ChevronLeft size={34} color="#F8FAFC" />
        </TouchableOpacity>

        {/* Center OK */}
        <TouchableOpacity
          style={styles.dpadCenter}
          activeOpacity={0.6}
          onPress={() => handlePress('Confirm', 'medium')}
        >
          <Text style={styles.dpadCenterText}>OK</Text>
        </TouchableOpacity>

        {/* Right */}
        <TouchableOpacity
          style={[styles.dpadButton, styles.dpadRight]}
          activeOpacity={0.5}
          onPress={() => handlePress('Right')}
        >
          <ChevronRight size={34} color="#F8FAFC" />
        </TouchableOpacity>

        {/* Down */}
        <TouchableOpacity
          style={[styles.dpadButton, styles.dpadDown]}
          activeOpacity={0.5}
          onPress={() => handlePress('Down')}
        >
          <ChevronDown size={34} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      {/* Volume & Channel Rockers */}
      <View style={styles.rockersRow}>
        {/* Volume Column */}
        <View style={styles.rocker}>
          <TouchableOpacity
            style={styles.rockerSegment}
            activeOpacity={0.6}
            onPress={() => handlePress('VolumeUp')}
          >
            <Text style={styles.rockerPlusMinus}>+</Text>
            <Text style={styles.rockerLabel}>VOL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rockerMute}
            activeOpacity={0.6}
            onPress={() => handlePress('Mute', 'medium')}
          >
            <VolumeX size={18} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rockerSegment}
            activeOpacity={0.6}
            onPress={() => handlePress('VolumeDown')}
          >
            <Text style={styles.rockerPlusMinus}>-</Text>
            <Text style={styles.rockerLabel}>VOL</Text>
          </TouchableOpacity>
        </View>

        {/* Quick App Badges in Center */}
        <View style={styles.centerBadges}>
          <TouchableOpacity
            style={[styles.appBadge, styles.netflixBadge]}
            activeOpacity={0.7}
            onPress={() => handlePress('Netflix', 'medium')}
          >
            <Text style={styles.netflixText}>NETFLIX</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.appBadge, styles.youtubeBadge]}
            activeOpacity={0.7}
            onPress={() => handlePress('YouTube', 'medium')}
          >
            <Text style={styles.youtubeText}>YouTube</Text>
          </TouchableOpacity>
        </View>

        {/* Channel Column */}
        <View style={styles.rocker}>
          <TouchableOpacity
            style={styles.rockerSegment}
            activeOpacity={0.6}
            onPress={() => handlePress('ChannelUp')}
          >
            <ChevronUp size={22} color="#F8FAFC" />
            <Text style={styles.rockerLabel}>CH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rockerMute}
            activeOpacity={0.6}
            onPress={() => handlePress('Display')}
          >
            <Info size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rockerSegment}
            activeOpacity={0.6}
            onPress={() => handlePress('ChannelDown')}
          >
            <ChevronDown size={22} color="#F8FAFC" />
            <Text style={styles.rockerLabel}>CH</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Media Playback Controls */}
      <View style={styles.mediaRow}>
        <TouchableOpacity
          style={styles.mediaBtn}
          activeOpacity={0.6}
          onPress={() => handlePress('Rewind')}
        >
          <Rewind size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mediaBtn, styles.playBtn]}
          activeOpacity={0.6}
          onPress={() => handlePress('Play', 'medium')}
        >
          <Play size={22} color="#0F172A" fill="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mediaBtn}
          activeOpacity={0.6}
          onPress={() => handlePress('Pause', 'medium')}
        >
          <Pause size={22} color="#F8FAFC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mediaBtn}
          activeOpacity={0.6}
          onPress={() => handlePress('FastForward')}
        >
          <FastForward size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  auxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  auxButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 70,
  },
  homeButton: {
    borderColor: '#0284C7',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  auxText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  dpadOuter: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  dpadButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadUp: {
    top: 10,
    width: 70,
    height: 60,
  },
  dpadDown: {
    bottom: 10,
    width: 70,
    height: 60,
  },
  dpadLeft: {
    left: 10,
    width: 60,
    height: 70,
  },
  dpadRight: {
    right: 10,
    width: 60,
    height: 70,
  },
  dpadCenter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#475569',
  },
  dpadCenterText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
  },
  rockersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 28,
  },
  rocker: {
    width: 76,
    height: 180,
    backgroundColor: '#1E293B',
    borderRadius: 38,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rockerSegment: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    width: 60,
  },
  rockerPlusMinus: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
  },
  rockerLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  rockerMute: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadges: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 12,
  },
  appBadge: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netflixBadge: {
    backgroundColor: '#E50914',
  },
  netflixText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
  },
  youtubeBadge: {
    backgroundColor: '#282828',
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  youtubeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  mediaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mediaBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    backgroundColor: '#38BDF8',
  },
});
