import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api-client';
import { CheckinModal } from '../../components/CheckinModal';
import { BehavioralAlarm } from '../../components/BehavioralAlarm';

interface TaskApiResponse {
  id: string;
  title: string;
  estimatedMinutes?: number;
  scheduledAt?: string;
  status?: 'TODO' | 'COMPLETED' | 'SKIPPED';
  lifeArea?: { type?: string };
}

interface MobileTask {
  id: string;
  title: string;
  estimatedMinutes?: number;
  scheduledTime?: string;
  status: 'TODO' | 'COMPLETED' | 'SKIPPED';
  lifeArea?: string;
}

export default function TodayScreen() {
  const [tasks, setTasks] = useState<MobileTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const res = await apiClient.get<TaskApiResponse[] | { data: TaskApiResponse[] }>('/api/v1/tasks');
      const taskList: TaskApiResponse[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      if (taskList.length > 0) {
        setTasks(
          taskList.map((t: TaskApiResponse) => ({
            id: t.id,
            title: t.title,
            estimatedMinutes: t.estimatedMinutes || 30,
            scheduledTime: t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            status: t.status || 'TODO',
            lifeArea: t.lifeArea?.type || 'health',
          }))
        );
      }
    } catch {
      // Return empty task list on network or server error
      setTasks([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchToday();
  }, [fetchToday]);

  const handleCompleteTask = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/tasks/${id}/complete`, {});
    } catch {
      // optimistic
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'COMPLETED' } : t))
    );
  };

  const handleSkipTask = async (id: string) => {
    try {
      await apiClient.post(`/api/v1/tasks/${id}/skip`, {});
    } catch {
      // optimistic
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'SKIPPED' } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const nextAction = tasks.find((t) => t.status === 'TODO') || null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void fetchToday();
            }}
            tintColor="#226949"
          />
        }
      >
        {/* 1. Current State & Greeting */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.dateLabel}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.greetingTitle}>Today.</Text>
          </View>
          <TouchableOpacity
            style={styles.checkinBadge}
            onPress={() => setShowCheckin(true)}
            accessibilityRole="button"
            accessibilityLabel="Record daily check-in"
          >
            <Text style={styles.checkinBadgeText}>☀ Check In</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Next Meaningful Action Card */}
        {nextAction && (
          <View style={styles.priorityCard}>
            <Text style={styles.priorityEyebrow}>NEXT MEANINGFUL ACTION</Text>
            <Text style={styles.priorityTitle}>{nextAction.title}</Text>
            <Text style={styles.priorityMeta}>
              {nextAction.scheduledTime ? `${nextAction.scheduledTime} • ` : ''}
              {nextAction.estimatedMinutes}m duration
            </Text>
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => {
                void handleCompleteTask(nextAction.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Complete ${nextAction.title}`}
            >
              <Text style={styles.completeBtnText}>✓ Complete This Action</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Today's Plan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today’s Plan</Text>
            <Text style={styles.sectionCount}>
              {completedCount} / {tasks.length} Completed
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#226949" style={{ marginVertical: 24 }} />
          ) : tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No tasks planned</Text>
              <Text style={styles.emptySubtitle}>You have no tasks scheduled for today.</Text>
            </View>
          ) : (
            <View style={styles.taskList}>
              {tasks.map((task) => {
                const isDone = task.status === 'COMPLETED';
                const isSkipped = task.status === 'SKIPPED';
                return (
                  <View key={task.id} style={[styles.taskItem, isDone && styles.taskDone]}>
                    <TouchableOpacity
                      style={[styles.checkbox, isDone && styles.checkboxDone]}
                      onPress={() => {
                        if (!isDone) {
                          void handleCompleteTask(task.id);
                        }
                      }}
                      disabled={isDone || isSkipped}
                    >
                      {isDone && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>

                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskSub}>
                        {task.scheduledTime ? `${task.scheduledTime} • ` : ''}
                        {task.estimatedMinutes}m
                      </Text>
                    </View>

                    {!isDone && !isSkipped && (
                      <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={() => {
                          void handleSkipTask(task.id);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.skipText}>Skip</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. Evening Reflection Trigger */}
        <View style={styles.eveningCard}>
          <Text style={styles.eveningEyebrow}>EVENING INTEGRATION</Text>
          <Text style={styles.eveningTitle}>Daily Growth Reflection</Text>
          <Text style={styles.eveningSubtitle}>
            Reflect on today’s behavioral evidence and calibrate tomorrow’s sustainable rhythm.
          </Text>
          <TouchableOpacity
            style={styles.eveningBtn}
            onPress={() => setShowCheckin(true)}
          >
            <Text style={styles.eveningBtnText}>Open Reflection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Checkin Modal */}
      <CheckinModal
        visible={showCheckin}
        onClose={() => setShowCheckin(false)}
        onSubmit={(data) => {
          void (async () => {
            try {
              await apiClient.post('/api/v1/daily-growth/checkin', data);
            } catch {
              // graceful
            }
          })();
        }}
      />

      {/* Behavioral Alarm Modal (Triggered on scheduled alarm events) */}
      <BehavioralAlarm
        visible={alarmActive}
        alarmTitle="Morning Movement Alarm"
        targetActionDescription="Perform 5 deep breaths and step outside into natural morning light."
        onDismiss={() => setAlarmActive(false)}
        onEmergencyBypass={() => setAlarmActive(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scroll: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 17, 21, 0.06)',
    paddingBottom: 14,
  },
  dateLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#868E96',
    fontWeight: '700',
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F1115',
    marginTop: 2,
  },
  checkinBadge: {
    backgroundColor: '#F5F2EB',
    borderWidth: 1,
    borderColor: 'rgba(15, 17, 21, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  checkinBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#226949',
  },
  priorityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#226949',
    borderWidth: 1,
    borderColor: 'rgba(15, 17, 21, 0.08)',
    gap: 8,
  },
  priorityEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#226949',
    letterSpacing: 1,
  },
  priorityTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F1115',
    lineHeight: 22,
  },
  priorityMeta: {
    fontSize: 12,
    color: '#868E96',
  },
  completeBtn: {
    backgroundColor: '#226949',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F1115',
  },
  sectionCount: {
    fontSize: 12,
    color: '#868E96',
    fontWeight: '500',
  },
  taskList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 17, 21, 0.08)',
    gap: 12,
  },
  taskDone: {
    opacity: 0.6,
    backgroundColor: '#F5F2EB',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 17, 21, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#226949',
    borderColor: '#226949',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F1115',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#868E96',
  },
  taskSub: {
    fontSize: 11,
    color: '#868E96',
    marginTop: 2,
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 12,
    color: '#868E96',
  },
  eveningCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 94, 166, 0.2)',
    gap: 6,
  },
  eveningEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4D5091',
    letterSpacing: 1,
  },
  eveningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F1115',
  },
  eveningSubtitle: {
    fontSize: 12,
    color: '#868E96',
    lineHeight: 17,
  },
  eveningBtn: {
    backgroundColor: '#4D5091',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  eveningBtnText: {
    color: '#FAF8F5',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 17, 21, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F1115',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#868E96',
    textAlign: 'center',
  },
});
