import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ClipboardCopy, Send, Trash2, Sparkles, Check } from 'lucide-react-native';
import { triggerHaptic } from '../services/haptics';

interface TextSyncTabProps {
  onSendText: (text: string) => Promise<boolean>;
  hapticEnabled: boolean;
}

const QUICK_CHIPS = [
  'Nhạc thư giãn',
  'Tin tức hôm nay',
  'Phim hành động',
  'Kodi',
  'YouTube',
  '4K HDR Demo',
];

export const TextSyncTab: React.FC<TextSyncTabProps> = ({ onSendText, hapticEnabled }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  const handlePasteClipboard = async () => {
    try {
      triggerHaptic(hapticEnabled, 'medium');
      const content = await Clipboard.getStringAsync();
      if (!content || !content.trim()) {
        Alert.alert('Clipboard trống', 'Chưa có nội dung văn bản nào được sao chép trên điện thoại.');
        return;
      }
      setText(content);
      setCopiedStatus('Đã dán từ bộ nhớ tạm!');
      setTimeout(() => setCopiedStatus(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (contentToSend?: string) => {
    const targetText = contentToSend || text;
    if (!targetText.trim()) {
      Alert.alert('Chưa có nội dung', 'Vui lòng nhập văn bản hoặc dán từ clipboard.');
      return;
    }

    setIsSending(true);
    triggerHaptic(hapticEnabled, 'medium');
    const success = await onSendText(targetText.trim());
    setIsSending(false);

    if (success) {
      setCopiedStatus(`Đã gửi: "${targetText.trim()}"`);
      setTimeout(() => setCopiedStatus(null), 3000);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Intro Box */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Sparkles size={20} color="#38BDF8" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Đồng Bộ Bàn Phím & Clipboard</Text>
        </View>
        <Text style={styles.cardDesc}>
          Gõ văn bản hoặc sao chép link/nội dung trên điện thoại rồi gửi trực tiếp vào ô tìm kiếm trên TV Sony KD-49X7500H.
        </Text>

        {/* Input box */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhập từ khóa hoặc link cần gửi lên TV..."
            placeholderTextColor="#64748B"
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={3}
          />
          {text.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                triggerHaptic(hapticEnabled, 'light');
                setText('');
              }}
            >
              <Trash2 size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {copiedStatus && (
          <View style={styles.statusToast}>
            <Check size={14} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.statusToastText}>{copiedStatus}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.pasteBtn}
            activeOpacity={0.7}
            onPress={handlePasteClipboard}
          >
            <ClipboardCopy size={18} color="#E2E8F0" style={{ marginRight: 6 }} />
            <Text style={styles.pasteBtnText}>Dán Clipboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendBtn, isSending && { opacity: 0.7 }]}
            activeOpacity={0.7}
            disabled={isSending}
            onPress={() => handleSend()}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <>
                <Send size={18} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.sendBtnText}>Gửi lên TV</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Search Chips */}
      <View style={styles.chipsSection}>
        <Text style={styles.sectionTitle}>Từ khóa tìm kiếm nhanh</Text>
        <View style={styles.chipsWrap}>
          {QUICK_CHIPS.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chip}
              activeOpacity={0.7}
              onPress={() => {
                setText(chip);
                handleSend(chip);
              }}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    padding: 18,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    color: '#F8FAFC',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 85,
    textAlignVertical: 'top',
  },
  clearBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusToastText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pasteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 14,
  },
  pasteBtnText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  sendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 14,
  },
  sendBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  chipsSection: {
    marginTop: 6,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
