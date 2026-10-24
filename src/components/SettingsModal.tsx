import React, { useState, useEffect } from 'react';
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
import {
  Settings,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  Vibrate,
  Info,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { AppSettings, ConnectionState } from '../types';
import { triggerHaptic } from '../services/haptics';
import { normalizeIp } from '../services/sonyApi';

interface SettingsModalProps {
  visible: boolean;
  settings: AppSettings;
  connectionState: ConnectionState;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
  onTestConnection: (ip: string, psk: string) => Promise<void>;
  onSubmitPin: (ip: string, pin: string) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  settings,
  connectionState,
  onClose,
  onSave,
  onTestConnection,
  onSubmitPin,
}) => {
  const [ip, setIp] = useState(settings.tvIp);
  const [psk, setPsk] = useState(settings.psk);
  const [pinCode, setPinCode] = useState('');
  const [showAdvancedPsk, setShowAdvancedPsk] = useState(false);
  const [hardwareVolume, setHardwareVolume] = useState(settings.hardwareVolumeEnabled);
  const [haptic, setHaptic] = useState(settings.hapticFeedbackEnabled);

  useEffect(() => {
    if (visible) {
      setIp(settings.tvIp);
      setPsk(settings.psk);
      setHardwareVolume(settings.hardwareVolumeEnabled);
      setHaptic(settings.hapticFeedbackEnabled);
    }
  }, [visible, settings]);

  // Tự động biến dấu phẩy (,) trên bàn phím số iOS tiếng Việt thành dấu chấm (.)
  const handleIpChange = (text: string) => {
    const converted = text.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    setIp(converted);
  };

  const handleInsertDot = () => {
    triggerHaptic(haptic, 'light');
    setIp((prev) => (prev.endsWith('.') ? prev : prev + '.'));
  };

  const handleQuickPrefix = (prefix: string) => {
    triggerHaptic(haptic, 'light');
    setIp(prefix);
  };

  const handleSaveAndClose = () => {
    triggerHaptic(haptic, 'medium');
    const cleanIp = normalizeIp(ip);
    onSave({
      ...settings,
      tvIp: cleanIp,
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
              <Text style={styles.title}>Kết Nối TV Bằng Địa Chỉ IP</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* IP Address Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>NHẬP ĐỊA CHỈ IP CỦA TV SONY</Text>
              <View style={styles.inputWrapper}>
                <Wifi size={18} color="#38BDF8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 192.168.1.150"
                  placeholderTextColor="#64748B"
                  value={ip}
                  onChangeText={handleIpChange}
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {ip.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearInlineBtn}
                    onPress={() => {
                      triggerHaptic(haptic, 'light');
                      setIp('');
                    }}
                  >
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Thanh phím tắt dấu chấm (.) và dải IP nhanh cho bàn phím iOS */}
              <View style={styles.quickIpRow}>
                <TouchableOpacity style={styles.dotBtn} onPress={handleInsertDot}>
                  <Text style={styles.dotBtnText}>+ Dấu chấm ( . )</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.prefixChip}
                  onPress={() => handleQuickPrefix('192.168.1.')}
                >
                  <Text style={styles.prefixChipText}>192.168.1.</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.prefixChip}
                  onPress={() => handleQuickPrefix('192.168.0.')}
                >
                  <Text style={styles.prefixChipText}>192.168.0.</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.helperText}>
                💡 Mẹo: Nếu bàn phím iPhone chỉ có dấu phẩy (,), bạn cứ bấm dấu (,) ứng dụng sẽ tự động chuyển thành dấu chấm (.)!
              </Text>
            </View>

            {/* Connection Test Button */}
            <TouchableOpacity
              style={[styles.testBtn, connectionState.isChecking && { opacity: 0.6 }]}
              disabled={connectionState.isChecking}
              onPress={() => {
                triggerHaptic(haptic, 'light');
                onTestConnection(normalizeIp(ip), psk);
              }}
            >
              {connectionState.isChecking ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Text style={styles.testBtnText}>Kết nối thử với TV ngay</Text>
              )}
            </TouchableOpacity>

            {/* Nếu TV hiện mã ghép nối 6 ký tự (hoặc 4 số) trên màn hình lần đầu ghép nối */}
            {connectionState.needsPinPairing && (
              <View style={styles.pinBox}>
                <View style={styles.pinHeader}>
                  <KeyRound size={18} color="#FBBF24" style={{ marginRight: 8 }} />
                  <Text style={styles.pinTitle}>Nhập mã ghép nối hiện trên màn hình TV</Text>
                </View>
                <Text style={styles.pinDesc}>
                  TV Sony KD-49X7500H vừa hiện một mã ghép nối gồm 6 ký tự (số 0-9 và chữ A-F) trên màn hình. Hãy nhập mã đó vào đây để hoàn tất (chỉ cần làm 1 lần đầu):
                </Text>
                <View style={styles.pinInputRow}>
                  <TextInput
                    style={styles.pinInput}
                    placeholder="VD: A1B2C3"
                    placeholderTextColor="#64748B"
                    value={pinCode}
                    onChangeText={(txt) => setPinCode(txt.toUpperCase().replace(/[^0-9A-F]/g, ''))}
                    keyboardType="default"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.pinSubmitBtn}
                    disabled={connectionState.isChecking || !pinCode.trim()}
                    onPress={() => {
                      triggerHaptic(haptic, 'medium');
                      onSubmitPin(normalizeIp(ip), pinCode.trim());
                    }}
                  >
                    <Text style={styles.pinSubmitText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Status Report */}
            {connectionState.lastError && !connectionState.needsPinPairing && (
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
                    <Text style={styles.toggleDesc}>Dùng nút Volume +/- trên iPhone chỉnh TV</Text>
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

            {/* Cách xem IP đơn giản trên TV Sony KD-49X7500H */}
            <View style={styles.instructionCard}>
              <View style={styles.instructionHeader}>
                <Info size={16} color="#38BDF8" style={{ marginRight: 6 }} />
                <Text style={styles.instructionTitle}>Cách xem địa chỉ IP trên TV Sony KD-49X7500H:</Text>
              </View>
              <Text style={styles.stepText}>
                1. Trên TV, mở <Text style={{ fontWeight: '700' }}>Cài đặt (Settings)</Text> → chọn <Text style={{ fontWeight: '700' }}>Mạng & Internet</Text>.
              </Text>
              <Text style={styles.stepText}>
                2. Bấm vào chính <Text style={{ fontWeight: '700' }}>tên mạng Wi-Fi</Text> mà TV đang kết nối (hoặc mục Trạng thái mạng).
              </Text>
              <Text style={styles.stepText}>
                3. Xem dòng <Text style={{ fontWeight: '700' }}>Địa chỉ IP (IP address)</Text> (thường có dạng 192.168.1.xxx) và nhập vào ô ở trên.
              </Text>
              <Text style={styles.stepText}>
                4. Bấm <Text style={{ fontWeight: '700' }}>"Kết nối thử với TV ngay"</Text>. Màn hình TV sẽ hiện mã ghép nối 6 ký tự (0-9, A-F), nhập mã đó vào ứng dụng là hoàn tất!
              </Text>
            </View>

            {/* Tùy chọn nâng cao (PSK - Không bắt buộc) */}
            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvancedPsk(!showAdvancedPsk)}
            >
              <Text style={styles.advancedToggleText}>
                Tùy chọn nâng cao: Mã PSK (Không bắt buộc)
              </Text>
              {showAdvancedPsk ? (
                <ChevronUp size={16} color="#64748B" />
              ) : (
                <ChevronDown size={16} color="#64748B" />
              )}
            </TouchableOpacity>

            {showAdvancedPsk && (
              <View style={styles.fieldGroup}>
                <View style={styles.inputWrapper}>
                  <ShieldCheck size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Để trống nếu chỉ kết nối bằng IP / Mã PIN"
                    placeholderTextColor="#64748B"
                    value={psk}
                    onChangeText={setPsk}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.7} onPress={handleSaveAndClose}>
              <Text style={styles.saveBtnText}>Lưu & Bắt Đầu Sử Dụng</Text>
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
    maxHeight: '92%',
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
    marginBottom: 16,
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
    borderColor: '#38BDF8',
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  clearInlineBtn: {
    padding: 6,
  },
  quickIpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  dotBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  dotBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  prefixChip: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  prefixChipText: {
    color: '#BAE6FD',
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 8,
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
  pinBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pinTitle: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
  },
  pinDesc: {
    color: '#FDE68A',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  pinInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pinInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
  },
  pinSubmitBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSubmitText: {
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
    marginBottom: 18,
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
    marginBottom: 14,
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
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  advancedToggleText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
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
