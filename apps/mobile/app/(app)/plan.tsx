import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api-client';

interface PlanItem {
  id: string;
  title: string;
  estimatedMinutes: number;
  scheduledTime?: string;
  status: 'TODO' | 'COMPLETED' | 'SKIPPED';
}

interface TaskPlanResponse {
  id: string;
  title: string;
  estimatedMinutes?: number;
  scheduledAt?: string;
  status?: 'TODO' | 'COMPLETED' | 'SKIPPED';
}

export default function PlanScreen() {
  const [tasks, setTasks] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get<TaskPlanResponse[] | { data: TaskPlanResponse[] }>('/api/v1/tasks');
        const taskList: TaskPlanResponse[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        if (taskList.length > 0) {
          setTasks(
            taskList.map((t: TaskPlanResponse) => ({
              id: t.id,
              title: t.title,
              estimatedMinutes: t.estimatedMinutes || 30,
              scheduledTime: t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
              status: t.status || 'TODO',
            }))
          );
        }
      } catch {
        setTasks([
          { id: '1', title: 'Deep Work: Architecture review', estimatedMinutes: 60, scheduledTime: '09:00 AM', status: 'TODO' },
          { id: '2', title: '45m Aerobic zone 2 session', estimatedMinutes: 45, scheduledTime: '11:30 AM', status: 'COMPLETED' },
          { id: '3', title: 'Sprint backlog refinement', estimatedMinutes: 45, scheduledTime: '02:00 PM', status: 'TODO' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const totalMinutes = tasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
  const capacityMinutes = 480;
  const isOverloaded = totalMinutes > capacityMinutes;

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const task: PlanItem = {
      id: `m-local-${Date.now()}`,
      title: newTitle.trim(),
      estimatedMinutes: 30,
      scheduledTime: '03:00 PM',
      status: 'TODO',
    };
    setTasks((prev) => [task, ...prev]);
    setNewTitle('');
    try {
      await apiClient.post('/api/v1/tasks', { title: task.title, estimatedMinutes: 30 });
    } catch {
      // optimistic
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>CALIBRATED CAPACITY</Text>
          <Text style={styles.title}>Plan.</Text>
          <Text style={styles.meta}>
            Planned load: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m of {Math.floor(capacityMinutes / 60)}h capacity
          </Text>
        </View>

        {isOverloaded && (
          <View style={styles.overloadBanner}>
            <Text style={styles.overloadTitle}>Capacity Warning</Text>
            <Text style={styles.overloadDesc}>
              This plan exceeds your typical sustainable daily capacity by {totalMinutes - capacityMinutes}m. Consider shifting a secondary task.
            </Text>
          </View>
        )}

        {/* Quick Add */}
        <View style={styles.addBar}>
          <TextInput
            style={styles.addInput}
            placeholder="+ Quick schedule a deliberate task..."
            placeholderTextColor="#868E96"
            value={newTitle}
            onChangeText={setNewTitle}
            onSubmitEditing={() => {
              void handleAdd();
            }}
          />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              void handleAdd();
            }}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <View style={styles.list}>
          {isLoading ? (
            <ActivityIndicator color="#226949" style={{ marginVertical: 30 }} />
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{task.title}</Text>
                  <Text style={styles.itemMeta}>
                    {task.scheduledTime ? `${task.scheduledTime} • ` : ''}
                    {task.estimatedMinutes}m
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{task.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>
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
  overloadBanner: {
    backgroundColor: 'rgba(197,48,48,0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(197,48,48,0.2)',
    gap: 2,
  },
  overloadTitle: { fontSize: 12, fontWeight: '700', color: '#9B2C2C' },
  overloadDesc: { fontSize: 11, color: '#495057', lineHeight: 15 },
  addBar: { flexDirection: 'row', gap: 8 },
  addInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F1115',
  },
  addBtn: {
    backgroundColor: '#0F1115',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addBtnText: { color: '#FAF8F5', fontSize: 13, fontWeight: '600' },
  list: { gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.08)',
  },
  itemTitle: { fontSize: 14, fontWeight: '500', color: '#0F1115' },
  itemMeta: { fontSize: 11, color: '#868E96', marginTop: 2 },
  badge: { backgroundColor: '#F5F2EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#495057' },
});
