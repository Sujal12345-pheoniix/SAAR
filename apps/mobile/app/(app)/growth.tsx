import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GrowthScreen() {
  const [selectedTab, setSelectedTab] = useState<'signals' | 'gaps'>('signals');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>GROWTH INTELLIGENCE</Text>
          <Text style={styles.title}>Growth.</Text>
          <Text style={styles.meta}>Deterministic behavioral patterns & gap analysis</Text>
        </View>

        {/* Tab switch */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'signals' && styles.tabActive]}
            onPress={() => setSelectedTab('signals')}
          >
            <Text style={[styles.tabText, selectedTab === 'signals' && styles.tabTextActive]}>
              Signals (3)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'gaps' && styles.tabActive]}
            onPress={() => setSelectedTab('gaps')}
          >
            <Text style={[styles.tabText, selectedTab === 'gaps' && styles.tabTextActive]}>
              Active Gaps (2)
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'signals' ? (
          <View style={styles.cardGroup}>
            <View style={styles.signalCard}>
              <View style={styles.signalTop}>
                <Text style={styles.signalName}>Consistency</Text>
                <Text style={styles.signalScore}>84% ↑</Text>
              </View>
              <Text style={styles.signalDesc}>
                14-day execution regularity is high across morning routines and physical workouts.
              </Text>
            </View>

            <View style={styles.signalCard}>
              <View style={styles.signalTop}>
                <Text style={styles.signalName}>Momentum</Text>
                <Text style={styles.signalScore}>79% →</Text>
              </View>
              <Text style={styles.signalDesc}>
                Velocity of goal completion is steady with 24 total actions logged this cycle.
              </Text>
            </View>

            <View style={styles.signalCard}>
              <View style={styles.signalTop}>
                <Text style={styles.signalName}>Balance</Text>
                <Text style={styles.signalScore}>88% ↑</Text>
              </View>
              <Text style={styles.signalDesc}>
                Equitable allocation across Health (35%), Career (40%), and Mind (25%).
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.cardGroup}>
            <View style={styles.gapCard}>
              <View style={styles.gapHeader}>
                <Text style={styles.gapType}>CONSISTENCY GAP</Text>
                <Text style={styles.gapBadge}>Medium Tension</Text>
              </View>
              <Text style={styles.gapObserved}>
                Observed: 3/7 evening wind-down routines completed
              </Text>
              <Text style={styles.gapTarget}>Target: 6/7 weekly consistency</Text>
              <Text style={styles.gapDesc}>
                Late cognitively demanding meetings are encroaching on shutdown time.
              </Text>
              <TouchableOpacity style={styles.expBtn}>
                <Text style={styles.expBtnText}>Explore Micro-Experiment</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gapCard}>
              <View style={styles.gapHeader}>
                <Text style={styles.gapType}>QUANTITY DEFICIT</Text>
                <Text style={styles.gapBadge}>Gentle</Text>
              </View>
              <Text style={styles.gapObserved}>
                Observed: 140 min cardio logged (Target: 180 min)
              </Text>
              <Text style={styles.gapDesc}>
                A single 20-minute morning recovery jog closes this weekly threshold.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F5' },
  scroll: { padding: 20, gap: 16 },
  header: { gap: 2, borderBottomWidth: 1, borderBottomColor: 'rgba(15,17,21,0.06)', paddingBottom: 12 },
  eyebrow: { fontSize: 10, fontWeight: '700', color: '#868E96', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F1115' },
  meta: { fontSize: 12, color: '#495057', marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: '#EFECE4', borderRadius: 8, padding: 3 },
  tab: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 12, fontWeight: '500', color: '#868E96' },
  tabTextActive: { color: '#0F1115', fontWeight: '600' },
  cardGroup: { gap: 10 },
  signalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.08)',
    gap: 6,
  },
  signalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  signalName: { fontSize: 15, fontWeight: '700', color: '#0F1115' },
  signalScore: { fontSize: 16, fontWeight: '700', color: '#226949' },
  signalDesc: { fontSize: 12, color: '#495057', lineHeight: 17 },
  gapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.08)',
    gap: 6,
  },
  gapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gapType: { fontSize: 10, fontWeight: '700', color: '#B45309', letterSpacing: 1 },
  gapBadge: { fontSize: 10, color: '#868E96', fontWeight: '500' },
  gapObserved: { fontSize: 13, fontWeight: '600', color: '#0F1115' },
  gapTarget: { fontSize: 11, color: '#226949', fontWeight: '500' },
  gapDesc: { fontSize: 12, color: '#495057', lineHeight: 17, marginTop: 2 },
  expBtn: {
    backgroundColor: '#F5F2EB',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  expBtnText: { fontSize: 12, fontWeight: '600', color: '#226949' },
});
