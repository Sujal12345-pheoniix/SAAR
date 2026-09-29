import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from 'react-native';

export interface CheckinData {
  mood: number;    // 1-5
  energy: number;  // 1-5
  dayRating: number; // 1-5
  reflection?: string;
}

export interface CheckinModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CheckinData) => void;
}

export function CheckinModal({ visible, onClose, onSubmit }: CheckinModalProps) {
  const [mood, setMood] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(3);
  const [dayRating, setDayRating] = useState<number>(4);
  const [reflection, setReflection] = useState<string>('');
  const [mode, setMode] = useState<'quick' | 'deep'>('quick');

  const handleSubmit = () => {
    onSubmit({
      mood,
      energy,
      dayRating,
      reflection: reflection.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>CALM DAILY CHECK-IN</Text>
              <Text style={styles.title}>How was your rhythm today?</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick vs Deep Switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, mode === 'quick' && styles.tabActive]}
              onPress={() => setMode('quick')}
            >
              <Text style={[styles.tabText, mode === 'quick' && styles.tabTextActive]}>Quick Pulse</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'deep' && styles.tabActive]}
              onPress={() => setMode('deep')}
            >
              <Text style={[styles.tabText, mode === 'deep' && styles.tabTextActive]}>Reflective Note</Text>
            </TouchableOpacity>
          </View>

          {/* Energy Rating (1-5) */}
          <View style={styles.ratingRow}>
            <Text style={styles.label}>Vitality & Energy:</Text>
            <View style={styles.pills}>
              {[1, 2, 3, 4, 5].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.pill, energy === val && styles.pillActive]}
                  onPress={() => setEnergy(val)}
                >
                  <Text style={[styles.pillText, energy === val && styles.pillTextActive]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mood Rating (1-5) */}
          <View style={styles.ratingRow}>
            <Text style={styles.label}>Emotional State:</Text>
            <View style={styles.pills}>
              {[1, 2, 3, 4, 5].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.pill, mood === val && styles.pillActive]}
                  onPress={() => setMood(val)}
                >
                  <Text style={[styles.pillText, mood === val && styles.pillTextActive]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Deep Reflection Field */}
          {mode === 'deep' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Optional Reflection:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What single moment brought genuine clarity today?"
                placeholderTextColor="#868E96"
                value={reflection}
                onChangeText={setReflection}
                multiline
              />
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Save Check-in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,17,21,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4D5091',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F1115',
  },
  closeText: {
    fontSize: 18,
    color: '#868E96',
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EFECE4',
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#868E96',
  },
  tabTextActive: {
    color: '#0F1115',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#343A40',
  },
  pills: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#0F1115',
    borderColor: '#0F1115',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
  },
  pillTextActive: {
    color: '#FAF8F5',
  },
  inputGroup: {
    gap: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.12)',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#0F1115',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#0F1115',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#FAF8F5',
    fontSize: 14,
    fontWeight: '600',
  },
});
