import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PanResponder,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MousePointer, Keyboard, Send, CornerDownLeft, CheckCircle2, Sliders } from 'lucide-react-native';
import { IrccKey } from '../constants/irccCodes';
import { triggerHaptic } from '../services/haptics';

interface TrackpadTabProps {
  onSendCommand: (key: IrccKey) => void;
  onSendText: (text: string) => Promise<boolean>;
  hapticEnabled: boolean;
}

export const TrackpadTab: React.FC<TrackpadTabProps> = ({
  onSendCommand,
  onSendText,
  hapticEnabled,
}) => {
  const [lastAction, setLastAction] = useState<string>('Chạm hoặc vuốt để điều khiển');
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [keyboardModalVisible, setKeyboardModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSendingText, setIsSendingText] = useState(false);

  // Gesture accumulation
  const totalDx = useRef(0);
  const totalDy = useRef(0);
  const touchStartTime = useRef(0);
  const SWIPE_THRESHOLD = 38;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        totalDx.current = 0;
        totalDy.current = 0;
        touchStartTime.current = Date.now();
        const { locationX, locationY } = evt.nativeEvent;
        setTouchPos({ x: locationX, y: locationY });
      },

      onPanResponderMove: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        setTouchPos({ x: locationX, y: locationY });

        totalDx.current = gestureState.dx;
        totalDy.current = gestureState.dy;

        // Check if exceeded swipe threshold
        if (Math.abs(totalDx.current) > SWIPE_THRESHOLD || Math.abs(totalDy.current) > SWIPE_THRESHOLD) {
          if (Math.abs(totalDx.current) > Math.abs(totalDy.current)) {
            // Horizontal swipe
            if (totalDx.current > 0) {
              setLastAction('Vuốt sang Phải 👉');
              triggerHaptic(hapticEnabled, 'light');
              onSendCommand('Right');
            } else {
              setLastAction('Vuốt sang Trái 👈');
              triggerHaptic(hapticEnabled, 'light');
              onSendCommand('Left');
            }
          } else {
            // Vertical swipe
            if (totalDy.current > 0) {
              setLastAction('Vuốt Xuống 👇');
              triggerHaptic(hapticEnabled, 'light');
              onSendCommand('Down');
            } else {
              setLastAction('Vuốt Lên 👆');
              triggerHaptic(hapticEnabled, 'light');
              onSendCommand('Up');
            }
          }

          // Reset delta to allow continuous multi-step swiping
          totalDx.current = 0;
          totalDy.current = 0;
          gestureState.dx = 0;
          gestureState.dy = 0;
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        setTouchPos(null);
        const duration = Date.now() - touchStartTime.current;
        const totalDistance = Math.hypot(gestureState.dx, gestureState.dy);

        // Tap detected (click)
        if (totalDistance < 12 && duration < 280) {
          setLastAction('Chạm Chọn (OK)');
          triggerHaptic(hapticEnabled, 'medium');
          onSendCommand('Confirm');
        }
      },
    })
  ).current;

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    setIsSendingText(true);
    triggerHaptic(hapticEnabled, 'medium');
    const ok = await onSendText(inputText);
    setIsSendingText(false);
    if (ok) {
      setInputText('');
      setKeyboardModalVisible(false);
      setLastAction(`Đã gửi: "${inputText}"`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header bar for Trackpad */}
      <View style={styles.topBar}>
        <View style={styles.actionBadge}>
          <MousePointer size={14} color="#38BDF8" style={{ marginRight: 6 }} />
          <Text style={styles.actionText}>{lastAction}</Text>
        </View>

        {/* Floating Quick Keyboard Button */}
        <TouchableOpacity
          style={styles.keyboardBtn}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'medium');
            setKeyboardModalVisible(true);
          }}
        >
          <Keyboard size={18} color="#F8FAFC" />
          <Text style={styles.keyboardBtnText}>Bàn phím</Text>
        </TouchableOpacity>
      </View>

      {/* Main Gesture Pad Surface */}
      <View style={styles.trackpadOuter} {...panResponder.panHandlers}>
        <View style={styles.gridLines}>
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />
        </View>

        {touchPos && (
          <View
            style={[
              styles.touchIndicator,
              { left: touchPos.x - 28, top: touchPos.y - 28 },
            ]}
          />
        )}

        <View style={styles.padPrompt}>
          <Text style={styles.promptMain}>Bàn rê cảm ứng Trackpad</Text>
          <Text style={styles.promptSub}>• Vuốt để điều hướng • Chạm để Chọn (OK)</Text>
        </View>
      </View>

      {/* Bottom Trackpad Quick Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'light');
            onSendCommand('Return');
          }}
        >
          <CornerDownLeft size={16} color="#94A3B8" />
          <Text style={styles.quickActionText}>Quay lại (Back)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'medium');
            onSendCommand('Confirm');
          }}
        >
          <CheckCircle2 size={16} color="#38BDF8" />
          <Text style={[styles.quickActionText, { color: '#38BDF8' }]}>Chọn (OK)</Text>
        </TouchableOpacity>
      </View>

      {/* Keyboard Modal */}
      <Modal
        visible={keyboardModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setKeyboardModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Keyboard size={20} color="#38BDF8" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Nhập văn bản lên TV</Text>
            </View>

            <Text style={styles.modalDesc}>
              Nhập từ khóa tìm kiếm (YouTube, Google, tên phim...) và bấm gửi để điền vào ô tìm kiếm trên TV:
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nhập nội dung cần gõ trên TV..."
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              autoFocus
              returnKeyType="send"
              onSubmitEditing={handleSendText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setKeyboardModalVisible(false)}
              >
                <Text style={styles.cancelText}>Đóng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendButton, isSendingText && { opacity: 0.6 }]}
                disabled={isSendingText}
                onPress={handleSendText}
              >
                <Send size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.sendText}>{isSendingText ? 'Đang gửi...' : 'Gửi lên TV'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flex: 1,
    marginRight: 10,
  },
  actionText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  keyboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  keyboardBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  trackpadOuter: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#1F2937',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLines: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.25,
  },
  crosshairH: {
    width: '100%',
    height: 1,
    backgroundColor: '#475569',
  },
  crosshairV: {
    height: '100%',
    width: 1,
    backgroundColor: '#475569',
    position: 'absolute',
  },
  touchIndicator: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  padPrompt: {
    alignItems: 'center',
    pointerEvents: 'none',
  },
  promptMain: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  promptSub: {
    color: '#64748B',
    fontSize: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickActionText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  modalDesc: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  sendText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
});
