import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { IrccKey } from '../constants/irccCodes';
import { triggerHaptic } from '../services/haptics';

interface NumpadTabProps {
  onSendCommand: (key: IrccKey) => void;
  hapticEnabled: boolean;
}

export const NumpadTab: React.FC<NumpadTabProps> = ({ onSendCommand, hapticEnabled }) => {
  const handlePress = (key: IrccKey, type: 'light' | 'medium' = 'light') => {
    triggerHaptic(hapticEnabled, type);
    onSendCommand(key);
  };

  const numberRows: { label: string; key: IrccKey }[][] = [
    [
      { label: '1', key: 'Num1' },
      { label: '2', key: 'Num2' },
      { label: '3', key: 'Num3' },
    ],
    [
      { label: '4', key: 'Num4' },
      { label: '5', key: 'Num5' },
      { label: '6', key: 'Num6' },
    ],
    [
      { label: '7', key: 'Num7' },
      { label: '8', key: 'Num8' },
      { label: '9', key: 'Num9' },
    ],
    [
      { label: '.', key: 'Dot' },
      { label: '0', key: 'Num0' },
      { label: 'ENT', key: 'Enter' },
    ],
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 4 Color Buttons row (Red, Green, Yellow, Blue) */}
      <View style={styles.colorRow}>
        <TouchableOpacity
          style={[styles.colorBtn, { backgroundColor: '#EF4444' }]}
          onPress={() => handlePress('Red')}
        />
        <TouchableOpacity
          style={[styles.colorBtn, { backgroundColor: '#22C55E' }]}
          onPress={() => handlePress('Green')}
        />
        <TouchableOpacity
          style={[styles.colorBtn, { backgroundColor: '#EAB308' }]}
          onPress={() => handlePress('Yellow')}
        />
        <TouchableOpacity
          style={[styles.colorBtn, { backgroundColor: '#3B82F6' }]}
          onPress={() => handlePress('Blue')}
        />
      </View>

      {/* Digits Grid */}
      <View style={styles.grid}>
        {numberRows.map((row, rIdx) => (
          <View key={`r-${rIdx}`} style={styles.row}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn.key}
                style={[styles.keyBtn, btn.key === 'Enter' && styles.enterBtn]}
                activeOpacity={0.6}
                onPress={() => handlePress(btn.key, btn.key === 'Enter' ? 'medium' : 'light')}
              >
                <Text style={[styles.keyText, btn.key === 'Enter' && styles.enterText]}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Auxiliary shortcuts */}
      <View style={styles.auxRow}>
        <TouchableOpacity
          style={styles.auxBtn}
          onPress={() => handlePress('SubTitle')}
        >
          <Text style={styles.auxText}>Phụ đề (CC)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.auxBtn}
          onPress={() => handlePress('Audio')}
        >
          <Text style={styles.auxText}>Ngôn ngữ Audio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.auxBtn}
          onPress={() => handlePress('Display')}
        >
          <Text style={styles.auxText}>Thông tin (Info)</Text>
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
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  colorBtn: {
    width: 65,
    height: 18,
    borderRadius: 9,
  },
  grid: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keyBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  enterBtn: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  keyText: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '700',
  },
  enterText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  auxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    gap: 8,
  },
  auxBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  auxText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
