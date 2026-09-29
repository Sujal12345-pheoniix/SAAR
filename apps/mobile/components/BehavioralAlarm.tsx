import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput } from 'react-native';

export interface BehavioralAlarmProps {
  visible: boolean;
  alarmTitle: string;
  targetActionDescription: string;
  onDismiss: () => void;
  onEmergencyBypass: () => void;
}

export function BehavioralAlarm({
  visible,
  alarmTitle,
  targetActionDescription,
  onDismiss,
  onEmergencyBypass,
}: BehavioralAlarmProps) {
  const [reflection, setReflection] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);

  const canDismiss = reflection.trim().length >= 10 || holdProgress >= 1;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>BEHAVIORAL ALARM • ACTION REQUIRED</Text>
            <Text style={styles.title}>{alarmTitle}</Text>
            <Text style={styles.subtitle}>
              This alarm is anchored to your intention. To silence it, complete the meaningful micro-action below:
            </Text>
          </View>

          {/* Action Box */}
          <View style={styles.actionBox}>
            <Text style={styles.actionTitle}>Target Micro-Action</Text>
            <Text style={styles.actionDesc}>{targetActionDescription}</Text>
          </View>

          {/* Reflection Input to Silence */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>State your intentional commitment (min 10 chars):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., I am stepping out of bed now for morning movement..."
              placeholderTextColor="#868E96"
              value={reflection}
              onChangeText={setReflection}
              multiline
            />
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.dismissBtn, !canDismiss && styles.btnDisabled]}
            disabled={!canDismiss}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Silence and confirm action"
          >
            <Text style={styles.dismissBtnText}>
              {canDismiss ? '✓ Silence & Confirm Action' : 'Enter 10 chars to dismiss'}
            </Text>
          </TouchableOpacity>

          {/* Emergency Safety Bypass (WCAG & Accessibility requirement) */}
          <TouchableOpacity
            style={styles.bypassBtn}
            onPress={onEmergencyBypass}
            accessibilityRole="button"
            accessibilityLabel="Emergency bypass alarm"
          >
            <Text style={styles.bypassText}>Emergency / Accessible Bypass</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 17, 21, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
    maxHeight: '90%',
  },
  header: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9B2C2C',
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F1115',
  },
  subtitle: {
    fontSize: 13,
    color: '#495057',
    lineHeight: 18,
    marginTop: 4,
  },
  actionBox: {
    backgroundColor: '#F5F2EB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.08)',
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#226949',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F1115',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#343A40',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.14)',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#0F1115',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  dismissBtn: {
    backgroundColor: '#226949',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    backgroundColor: '#868E96',
    opacity: 0.6,
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bypassBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  bypassText: {
    fontSize: 12,
    color: '#868E96',
    textDecorationLine: 'underline',
  },
});
