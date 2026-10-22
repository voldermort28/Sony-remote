import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Settings, Wifi, ShieldCheck, CheckCircle2, AlertTriangle, X, Volume2, Vibrate, Info } from 'lucide-react-native';
import { AppSettings, ConnectionState } from '../types';
import { triggerHaptic } from '../services/haptics';

interface SettingsModalProps {
  visible: boolean;
  settings: AppSettings;
  connectionState: ConnectionState;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
  onTestConnection: (ip: string, psk: string) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  settings,
  connectionState,
  onClose,
  onSave,
  onTestConnection,
}) => {
  const [ip, setIp] = useState(settings.tvIp);
  const [psk, setPsk] = useState(settings.psk);
  const [hardwareVolume, setHardwareVolume] = useState(settings.hardwareVolumeEnabled);
  const [haptic, setHaptic] = useState(settings.hapticFeedbackEnabled);

  const handleSaveAndClose = () => {
    triggerHaptic(haptic, 'medium');
    onSave({
      ...settings,
      tvIp: ip.trim(),
      psk: psk.trim(),
      hardwareVolumeEnabled: hardwareVolume,
      hapticFeedbackEnabled: haptic,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Settings size={22} color="#38BDF8" style={{ marginRight: 8 }} />
              <Text style={styles.title}>Cài Đặt Kết Nối TV</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* IP Address Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>ĐỊA CHỈ IP CỦA TV</Text>
              <View style={styles.inputWrapper}>
                <Wifi size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 192.168.1.150"
                  placeholderTextColor="#64748B"
                  value={ip}
                  onChangeText={setIp}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.helperText}>
                Xem tại: Cài đặt TV → Mạng & Internet → Trạng thái mạng.
              </Text>
            </View>

            {/* Pre-Shared Key (PSK) Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PRE-SHARED KEY (PSK)</Text>
              <View style={styles.inputWrapper}>
                <ShieldCheck size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 1234"
                  placeholderTextColor="#64748B"
                  value={psk}
                  onChangeText={setPsk}
                  secureTextEntry={false}
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.helperText}>
                Mật khẩu bạn tự đặt tại mục "IP Control" trên TV Sony (mặc định nên là 1234).
              </Text>
            </View>

            {/* Connection Test Button & Status */}
            <TouchableOpacity
              style={[styles.testBtn, connectionState.isChecking && { opacity: 0.6 }]}
              disabled={connectionState.isChecking}
              onPress={() => {
                triggerHaptic(haptic, 'light');
                onTestConnection(ip, psk);
              }}
            >
              {connectionState.isChecking ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Text style={styles.testBtnText}>Kiểm tra kết nối ngay</Text>
              )}
            </TouchableOpacity>

            {/* Status Report */}
            {connectionState.lastError && (
              <View style={styles.errorBox}>
                <AlertTriangle size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{connectionState.lastError}</Text>
              </View>
            )}

            {connectionState.isConnected && (
              <View style={styles.successBox}>
                <CheckCircle2 size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.successText}>
                  Đã kết nối thành công: {connectionState.tvModel || 'Sony BRAVIA KD-49X7500H'}
                </Text>
              </View>
            )}

            {/* Toggles */}
            <View style={styles.toggleSection}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Volume2 size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.toggleLabel}>Phím âm lượng vật lý</Text>
                    <Text style={styles.toggleDesc}>Dùng nút Volume +/- trên điện thoại chỉnh TV</Text>
                  </View>
                </View>
                <Switch
                  value={hardwareVolume}
                  onValueChange={setHardwareVolume}
                  trackColor={{ false: '#334155', true: '#0284C7' }}
                  thumbColor="#F8FAFC"
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Vibrate size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.toggleLabel}>Rung phản hồi (Haptic)</Text>
                    <Text style={styles.toggleDesc}>Tạo cảm giác bấm nút vật lý khi chạm</Text>
                  </View>
                </View>
                <Switch
                  value={haptic}
                  onValueChange={setHaptic}
                  trackColor={{ false: '#334155', true: '#0284C7' }}
                  thumbColor="#F8FAFC"
                />
              </View>
            </View>

            {/* Setup Instructions on Sony TV */}
            <View style={styles.instructionCard}>
              <View style={styles.instructionHeader}>
                <Info size={16} color="#38BDF8" style={{ marginRight: 6 }} />
                <Text style={styles.instructionTitle}>Hướng dẫn bật trên Sony KD-49X7500H:</Text>
              </View>
              <Text style={styles.stepText}>1. Vào Cài đặt (Settings) trên TV Sony.</Text>
              <Text style={styles.stepText}>2. Chọn Mạng & Internet → Thiết lập mạng gia đình.</Text>
              <Text style={styles.stepText}>3. Chọn Điều khiển IP (IP Control).</Text>
              <Text style={styles.stepText}>4. Bật Simple IP Control thành [Bật / ON].</Text>
              <Text style={styles.stepText}>5. Xác thực (Authentication) → Chọn [Pre-Shared Key].</Text>
              <Text style={styles.stepText}>6. Nhập Pre-Shared Key là: 1234 (hoặc số tùy ý).</Text>
            </View>
          </ScrollView>

          {/* Bottom Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.7} onPress={handleSaveAndClose}>
              <Text style={styles.saveBtnText}>Lưu Cài Đặt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  scroll: {
    padding: 20,
    paddingBottom: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 15,
  },
  helperText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  testBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  testBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  successText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  toggleSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleDesc: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  instructionCard: {
    backgroundColor: '#02294F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0284C7',
    marginBottom: 10,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  stepText: {
    color: '#BAE6FD',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
