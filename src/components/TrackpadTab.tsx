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
  Dimensions,
} from 'react-native';
import {
  MousePointer,
  Keyboard,
  Send,
  CornerDownLeft,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Menu,
  Sliders,
} from 'lucide-react-native';
import { IrccKey } from '../constants/irccCodes';
import { triggerHaptic } from '../services/haptics';

interface TrackpadTabProps {
  onSendCommand: (key: IrccKey) => void;
  onSendText: (text: string) => Promise<boolean>;
  hapticEnabled: boolean;
}

type SensitivityMode = 'slow' | 'normal' | 'fast';

const SENSITIVITY_THRESHOLDS: Record<SensitivityMode, number> = {
  slow: 32,
  normal: 22,
  fast: 14,
};

export const TrackpadTab: React.FC<TrackpadTabProps> = ({
  onSendCommand,
  onSendText,
  hapticEnabled,
}) => {
  const [lastAction, setLastAction] = useState<string>('Sẵn sàng rê chuột & cuộn');
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [sensitivity, setSensitivity] = useState<SensitivityMode>('normal');
  const [keyboardModalVisible, setKeyboardModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSendingText, setIsSendingText] = useState(false);

  // Gesture accumulators
  const accumX = useRef(0);
  const accumY = useRef(0);
  const scrollAccumY = useRef(0);
  const touchStartTime = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchCount = useRef(1);

  // 1. PanResponder cho Bàn rê chính (Trackpad Surface)
  const padPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        accumX.current = 0;
        accumY.current = 0;
        touchStartTime.current = Date.now();
        const touches = evt.nativeEvent.touches;
        touchCount.current = touches ? touches.length : 1;

        const { locationX, locationY } = evt.nativeEvent;
        touchStartPos.current = { x: locationX, y: locationY };
        setTouchPos({ x: locationX, y: locationY });
      },

      onPanResponderMove: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        setTouchPos({ x: locationX, y: locationY });

        // Cử chỉ cuộn 2 ngón tay (Two-finger scroll như MacBook)
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length >= 2) {
          touchCount.current = 2;
          const scrollDy = gestureState.dy - accumY.current;
          if (Math.abs(scrollDy) >= 20) {
            if (scrollDy > 0) {
              setLastAction('Cuộn trang Xuống 📜');
              triggerHaptic(hapticEnabled, 'selection');
              onSendCommand('Down');
            } else {
              setLastAction('Cuộn trang Lên 📜');
              triggerHaptic(hapticEnabled, 'selection');
              onSendCommand('Up');
            }
            accumY.current = gestureState.dy;
          }
          return;
        }

        // Cử chỉ rê chuột 1 ngón tay (Continuous Glide & Acceleration)
        const threshold = SENSITIVITY_THRESHOLDS[sensitivity];
        const dx = gestureState.dx - accumX.current;
        const dy = gestureState.dy - accumY.current;

        if (Math.abs(dx) >= threshold || Math.abs(dy) >= threshold) {
          if (Math.abs(dx) > Math.abs(dy)) {
            // Rê ngang
            if (dx > 0) {
              setLastAction('Rê sang Phải 👉');
              triggerHaptic(hapticEnabled, 'selection');
              onSendCommand('Right');
            } else {
              setLastAction('Rê sang Trái 👈');
              triggerHaptic(hapticEnabled, 'selection');
              onSendCommand('Left');
            }
            accumX.current = gestureState.dx;
            // Giảm 1 phần dy để chuyển hướng mượt hơn
            accumY.current = gestureState.dy * 0.5;
          } else {
            // Rê dọc
            if (dy > 0) {
              setLastAction('Rê Xuống 👇');
              triggerHaptic(hapticEnabled, 'selection');
              onSendCommand('Down');
            } else {
              setLastAction('Rê Lên 👆');
              triggerHaptic(hapticEnabled, 'selection');
              onSendCommand('Up');
            }
            accumY.current = gestureState.dy;
            accumX.current = gestureState.dx * 0.5;
          }
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        setTouchPos(null);
        const duration = Date.now() - touchStartTime.current;
        const totalDistance = Math.hypot(gestureState.dx, gestureState.dy);

        // Tap detected (Click)
        if (totalDistance < 14 && duration < 260) {
          if (touchCount.current >= 2) {
            // Chạm 2 ngón = Chuột Phải (Quay lại / Back)
            setLastAction('Chuột Phải (Quay lại) ↪️');
            triggerHaptic(hapticEnabled, 'light');
            onSendCommand('Return');
          } else {
            // Chạm 1 ngón = Chuột Trái (Chọn / OK)
            setLastAction('Chuột Trái (Chọn / OK) 🔘');
            triggerHaptic(hapticEnabled, 'medium');
            onSendCommand('Confirm');
          }
          return;
        }

        // Quẹt nhanh có quán tính (Fling / Kinetic momentum)
        const speed = Math.hypot(gestureState.vx, gestureState.vy);
        if (speed > 1.35 && totalDistance > 45) {
          if (Math.abs(gestureState.vx) > Math.abs(gestureState.vy)) {
            const key = gestureState.vx > 0 ? 'Right' : 'Left';
            setLastAction(gestureState.vx > 0 ? 'Lướt nhanh sang Phải ⏩' : 'Lướt nhanh sang Trái ⏪');
            setTimeout(() => {
              triggerHaptic(hapticEnabled, 'light');
              onSendCommand(key);
            }, 90);
          } else {
            const key = gestureState.vy > 0 ? 'Down' : 'Up';
            setLastAction(gestureState.vy > 0 ? 'Lướt nhanh Xuống ⏬' : 'Lướt nhanh Lên ⏫');
            setTimeout(() => {
              triggerHaptic(hapticEnabled, 'light');
              onSendCommand(key);
            }, 90);
          }
        }
      },
    })
  ).current;

  // 2. PanResponder cho Thanh cuộn chuột bên phải (Scroll Wheel Strip)
  const scrollPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        scrollAccumY.current = 0;
        setIsScrolling(true);
        triggerHaptic(hapticEnabled, 'light');
        setLastAction('Đang lăn con lăn chuột...');
      },

      onPanResponderMove: (_, gestureState) => {
        const delta = gestureState.dy - scrollAccumY.current;
        const scrollStep = 16; // 16px cho mỗi nấc cuộn chuột

        if (Math.abs(delta) >= scrollStep) {
          if (delta > 0) {
            setLastAction('Cuộn trang Xuống 📜');
            triggerHaptic(hapticEnabled, 'selection');
            onSendCommand('Down');
          } else {
            setLastAction('Cuộn trang Lên 📜');
            triggerHaptic(hapticEnabled, 'selection');
            onSendCommand('Up');
          }
          scrollAccumY.current = gestureState.dy;
        }
      },

      onPanResponderRelease: () => {
        setIsScrolling(false);
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

  const cycleSensitivity = () => {
    triggerHaptic(hapticEnabled, 'light');
    if (sensitivity === 'slow') setSensitivity('normal');
    else if (sensitivity === 'normal') setSensitivity('fast');
    else setSensitivity('slow');
  };

  const getSensitivityLabel = () => {
    switch (sensitivity) {
      case 'slow':
        return 'Chậm';
      case 'normal':
        return 'Chuẩn';
      case 'fast':
        return 'Nhanh';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.actionBadge}>
          <MousePointer size={14} color="#38BDF8" style={{ marginRight: 6 }} />
          <Text style={styles.actionText} numberOfLines={1}>
            {lastAction}
          </Text>
        </View>

        {/* Nút điều chỉnh tốc độ rê chuột */}
        <TouchableOpacity
          style={styles.sensitivityBtn}
          activeOpacity={0.7}
          onPress={cycleSensitivity}
        >
          <Sliders size={13} color="#94A3B8" style={{ marginRight: 4 }} />
          <Text style={styles.sensitivityText}>{getSensitivityLabel()}</Text>
        </TouchableOpacity>

        {/* Nút mở bàn phím gõ text */}
        <TouchableOpacity
          style={styles.keyboardBtn}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'medium');
            setKeyboardModalVisible(true);
          }}
        >
          <Keyboard size={16} color="#F8FAFC" />
        </TouchableOpacity>
      </View>

      {/* Trackpad Container: Bàn rê chính (trái) + Con lăn cuộn (phải) */}
      <View style={styles.trackpadRow}>
        {/* 1. Main Trackpad Area */}
        <View style={styles.mainPad} {...padPanResponder.panHandlers}>
          {/* Subtle Grid crosshairs */}
          <View style={styles.gridLines}>
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />
            <View style={styles.centerDot} />
          </View>

          {/* Glowing Virtual Cursor Dot under user's finger */}
          {touchPos && (
            <View
              style={[
                styles.cursorFollower,
                { left: touchPos.x - 22, top: touchPos.y - 22 },
              ]}
            >
              <View style={styles.cursorInner} />
            </View>
          )}

          {/* Informative Trackpad Hints */}
          <View style={styles.padPrompt}>
            <Text style={styles.promptMain}>Bàn rê chuột cảm ứng</Text>
            <Text style={styles.promptSub}>• Rê ngón tay để di chuyển chuột</Text>
            <Text style={styles.promptSub}>• Chạm 1 ngón: Chuột Trái (OK)</Text>
            <Text style={styles.promptSub}>• Chạm 2 ngón: Chuột Phải (Back)</Text>
          </View>
        </View>

        {/* 2. Scroll Wheel Strip (Con lăn chuột bên phải) */}
        <View
          style={[styles.scrollStrip, isScrolling && styles.scrollStripActive]}
          {...scrollPanResponder.panHandlers}
        >
          <ChevronUp size={16} color={isScrolling ? '#38BDF8' : '#64748B'} />
          <View style={styles.scrollRidges}>
            <View style={styles.scrollRidgeLine} />
            <View style={styles.scrollRidgeLine} />
            <View style={styles.scrollRidgeLine} />
            <View style={styles.scrollRidgeLine} />
            <View style={styles.scrollRidgeLine} />
          </View>
          <Text style={styles.scrollLabel}>CUỘN</Text>
          <ChevronDown size={16} color={isScrolling ? '#38BDF8' : '#64748B'} />
        </View>
      </View>

      {/* Bottom Physical Mouse Buttons (Chuột Trái / Menu / Chuột Phải) */}
      <View style={styles.mouseButtonsRow}>
        {/* Nút Chuột Trái (Left Click) */}
        <TouchableOpacity
          style={styles.leftClickBtn}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'medium');
            setLastAction('Chuột Trái: Chọn (OK)');
            onSendCommand('Confirm');
          }}
        >
          <CheckCircle2 size={18} color="#38BDF8" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.clickTitle}>Chuột Trái</Text>
            <Text style={styles.clickSubtitle}>Chọn / Mở (OK)</Text>
          </View>
        </TouchableOpacity>

        {/* Nút Menu Tùy Chọn */}
        <TouchableOpacity
          style={styles.menuClickBtn}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'light');
            setLastAction('Tùy chọn (Menu)');
            onSendCommand('Options');
          }}
        >
          <Menu size={18} color="#E2E8F0" />
        </TouchableOpacity>

        {/* Nút Chuột Phải (Right Click) */}
        <TouchableOpacity
          style={styles.rightClickBtn}
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic(hapticEnabled, 'light');
            setLastAction('Chuột Phải: Quay lại (Back)');
            onSendCommand('Return');
          }}
        >
          <CornerDownLeft size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.rightClickTitle}>Chuột Phải</Text>
            <Text style={styles.rightClickSubtitle}>Quay lại (Back)</Text>
          </View>
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
              Gõ từ khóa tìm kiếm (tên phim, YouTube, web...) và bấm gửi để tự động điền vào ô tìm kiếm trên TV:
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
    padding: 14,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    flex: 1,
  },
  actionText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
  sensitivityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sensitivityText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  keyboardBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    width: 36,
    height: 36,
    borderRadius: 14,
  },
  trackpadRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  mainPad: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 22,
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
    opacity: 0.18,
  },
  crosshairH: {
    width: '100%',
    height: 1,
    backgroundColor: '#64748B',
  },
  crosshairV: {
    height: '100%',
    width: 1,
    backgroundColor: '#64748B',
    position: 'absolute',
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
    position: 'absolute',
    opacity: 0.4,
  },
  cursorFollower: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  cursorInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  padPrompt: {
    alignItems: 'center',
    pointerEvents: 'none',
    paddingHorizontal: 16,
  },
  promptMain: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  promptSub: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 4,
  },
  scrollStrip: {
    width: 44,
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#1F2937',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  scrollStripActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#1E293B',
  },
  scrollRidges: {
    gap: 6,
    alignItems: 'center',
  },
  scrollRidgeLine: {
    width: 14,
    height: 2,
    backgroundColor: '#475569',
    borderRadius: 1,
  },
  scrollLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    transform: [{ rotate: '90deg' }],
  },
  mouseButtonsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  leftClickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  clickTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  clickSubtitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '500',
  },
  menuClickBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    width: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rightClickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rightClickTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  rightClickSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
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
