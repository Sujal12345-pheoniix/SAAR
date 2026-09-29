import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Answers
  const [primaryFocus, setPrimaryFocus] = useState('Deep cognitive focus and energy');
  const [identityVision, setIdentityVision] = useState('I live deliberately, mastering physical endurance and intellectual craft.');
  const [selectedLifeAreas, setSelectedLifeAreas] = useState<string[]>(['health', 'career']);
  const [wakingRhythm, setWakingRhythm] = useState('Early Riser (06:30 AM)');

  const toggleLifeArea = (area: string) => {
    setSelectedLifeAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleFinish = () => {
    // Navigate to Today home screen
    router.replace('/(app)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressRow}>
          <Text style={styles.stepIndicator}>Step {step} of {totalSteps}</Text>
          <View style={styles.barWrap}>
            <View style={[styles.barFill, { width: `${(step / totalSteps) * 100}%` }]} />
          </View>
        </View>

        {/* Step 1: Why SAAR? */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.eyebrow}>CALM ONBOARDING</Text>
            <Text style={styles.heading}>Know how you live. Become who you want to be.</Text>
            <Text style={styles.body}>
              SAAR is not a checklist habit tracker. It is a quiet mirror that reflects how you are actually spending your time and helps you bridge the gap to your future self.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.primaryBtnText}>Begin Intention →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: What do you want to change? */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.eyebrow}>FOUNDATIONAL INTENTION</Text>
            <Text style={styles.heading}>What matters most right now?</Text>
            <View style={styles.options}>
              {[
                'Deep cognitive focus and sustainable energy',
                'Consistent physical movement & sleep recovery',
                'Calm life balance and emotional resilience',
                'Closing persistent execution gaps in my career',
              ].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionCard, primaryFocus === opt && styles.optionSelected]}
                  onPress={() => setPrimaryFocus(opt)}
                >
                  <Text style={[styles.optionText, primaryFocus === opt && styles.optionTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Life Areas */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.eyebrow}>ANCHORING</Text>
            <Text style={styles.heading}>Choose your active life areas</Text>
            <Text style={styles.subtext}>Select 2 to 3 areas for immediate focus:</Text>
            <View style={styles.pillGrid}>
              {[
                { id: 'health', label: 'Health & Vitality' },
                { id: 'career', label: 'Career & Craft' },
                { id: 'mind', label: 'Mind & Contemplation' },
                { id: 'relationships', label: 'Relationships' },
                { id: 'finance', label: 'Finance' },
                { id: 'purpose', label: 'Purpose' },
              ].map((item) => {
                const isSelected = selectedLifeAreas.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => toggleLifeArea(item.id)}
                  >
                    <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(4)}>
              <Text style={styles.primaryBtnText}>Define Future Self</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Future Self */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.eyebrow}>DESTINATION</Text>
            <Text style={styles.heading}>Describe the person you are becoming</Text>
            <TextInput
              style={styles.textInput}
              value={identityVision}
              onChangeText={setIdentityVision}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(5)}>
              <Text style={styles.primaryBtnText}>Calibrate Daily Rhythm</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 5: Daily Rhythm */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <Text style={styles.eyebrow}>SUSTAINABLE RHYTHM</Text>
            <Text style={styles.heading}>What is your natural waking rhythm?</Text>
            <View style={styles.options}>
              {[
                'Early Riser (06:00 - 06:30 AM)',
                'Steady Morning (07:00 - 08:00 AM)',
                'Flexible Cadence (08:30+ AM)',
              ].map((rhythm) => (
                <TouchableOpacity
                  key={rhythm}
                  style={[styles.optionCard, wakingRhythm === rhythm && styles.optionSelected]}
                  onPress={() => setWakingRhythm(rhythm)}
                >
                  <Text style={[styles.optionText, wakingRhythm === rhythm && styles.optionTextSelected]}>
                    {rhythm}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(6)}>
              <Text style={styles.primaryBtnText}>Finalize Setup</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 6: Confirmation & First Today */}
        {step === 6 && (
          <View style={styles.stepContent}>
            <Text style={styles.eyebrow}>CALIBRATION COMPLETE</Text>
            <Text style={styles.heading}>Welcome to SAAR.</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Your Calibration Summary</Text>
              <Text style={styles.summaryText}>• Primary Focus: {primaryFocus}</Text>
              <Text style={styles.summaryText}>• Active Life Areas: {selectedLifeAreas.join(', ')}</Text>
              <Text style={styles.summaryText}>• Natural Rhythm: {wakingRhythm}</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
              <Text style={styles.primaryBtnText}>Enter Today Screen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F5' },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  progressRow: { gap: 6, marginBottom: 20 },
  stepIndicator: { fontSize: 11, fontWeight: '700', color: '#868E96', letterSpacing: 0.5 },
  barWrap: { height: 4, backgroundColor: '#EFECE4', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#226949' },
  stepContent: { flex: 1, justifyContent: 'center', gap: 14 },
  eyebrow: { fontSize: 10, fontWeight: '700', color: '#226949', letterSpacing: 1 },
  heading: { fontSize: 24, fontWeight: '700', color: '#0F1115', lineHeight: 32 },
  body: { fontSize: 14, color: '#495057', lineHeight: 22, marginTop: 4 },
  subtext: { fontSize: 12, color: '#868E96' },
  options: { gap: 10, marginVertical: 8 },
  optionCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.1)',
  },
  optionSelected: {
    borderColor: '#226949',
    backgroundColor: 'rgba(46,125,91,0.06)',
  },
  optionText: { fontSize: 13, color: '#495057', fontWeight: '500' },
  optionTextSelected: { color: '#0F1115', fontWeight: '600' },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.1)',
  },
  pillSelected: { backgroundColor: '#0F1115', borderColor: '#0F1115' },
  pillLabel: { fontSize: 12, color: '#495057', fontWeight: '500' },
  pillLabelSelected: { color: '#FAF8F5', fontWeight: '600' },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.12)',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#0F1115',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.08)',
    gap: 6,
    marginVertical: 12,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#0F1115', marginBottom: 4 },
  summaryText: { fontSize: 12, color: '#495057', lineHeight: 18 },
  primaryBtn: {
    backgroundColor: '#0F1115',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: { color: '#FAF8F5', fontSize: 14, fontWeight: '600' },
});
