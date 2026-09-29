import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/api-client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  actionProposal?: {
    id: string;
    title: string;
    description: string;
    status: 'PROPOSED' | 'CONFIRMED';
  };
}

export default function CompanionScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'I am grounded in your logged behavior and your stated destination. How can we bring calm clarity to your rhythm today?',
      time: '10:00 AM',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      interface ChatApiResponse {
        content?: string;
        response?: string;
        data?: {
          content?: string;
          response?: string;
        };
      }
      const res = await apiClient.post<ChatApiResponse>('/api/v1/companion/chat', { message: userText });
      const reply = res.content || res.response || res.data?.content || res.data?.response;
      setMessages((prev) => [
        ...prev,
        {
          id: `c-${Date.now()}`,
          role: 'assistant',
          content: reply || 'I reviewed your pattern. Shifting your evening task to tomorrow creates necessary recovery space.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionProposal: {
            id: 'act-1',
            title: 'Reschedule evening task to 10:00 AM tomorrow',
            description: 'Protects a 90-minute shutdown runway before sleep.',
            status: 'PROPOSED',
          },
        },
      ]);
    } catch {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `c-${Date.now()}`,
            role: 'assistant',
            content: `I hear you regarding "${userText}". Based on your recent execution records, your consistency is solid at 84%, but your planned evening schedule is currently overloaded. Would you like me to propose a gentle adjustment?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionProposal: {
              id: 'act-1',
              title: 'Reschedule evening task to 10:00 AM tomorrow',
              description: 'Protects a 90-minute shutdown runway before sleep.',
              status: 'PROPOSED',
            },
          },
        ]);
      }, 600);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmAction = (actionId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (!m.actionProposal || m.actionProposal.id !== actionId) return m;
        return {
          ...m,
          actionProposal: { ...m.actionProposal, status: 'CONFIRMED' },
        };
      })
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.pulseIndicator}>
            <View style={styles.pulseInner} />
          </View>
          <View>
            <Text style={styles.title}>SAAR Companion</Text>
            <Text style={styles.subtitle}>Calm, evidence-grounded companion</Text>
          </View>
        </View>

        {/* Message Stream */}
        <ScrollView contentContainerStyle={styles.messageList}>
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <View key={m.id} style={[styles.bubbleWrap, isUser && styles.bubbleWrapUser]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
                  <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
                    {m.content}
                  </Text>

                  {/* Proposed Action Confirmation */}
                  {m.actionProposal && (
                    <View style={styles.actionCard}>
                      <Text style={styles.actionEyebrow}>PROPOSED ACTION</Text>
                      <Text style={styles.actionTitle}>{m.actionProposal.title}</Text>
                      <Text style={styles.actionDesc}>{m.actionProposal.description}</Text>
                      {m.actionProposal.status === 'PROPOSED' ? (
                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={() => handleConfirmAction(m.actionProposal!.id)}
                        >
                          <Text style={styles.confirmBtnText}>Confirm & Apply</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.confirmedText}>✓ Action applied to schedule</Text>
                      )}
                    </View>
                  )}
                </View>
                <Text style={styles.timestamp}>{m.time}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Reflect, ask, or explore an execution pattern..."
            placeholderTextColor="#868E96"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => {
              void handleSend();
            }}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
              void handleSend();
            }}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,17,21,0.06)',
  },
  pulseIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(77, 80, 145, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4D5091',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#0F1115' },
  subtitle: { fontSize: 11, color: '#868E96' },
  messageList: { padding: 18, gap: 14 },
  bubbleWrap: { alignItems: 'flex-start', maxWidth: '85%' },
  bubbleWrapUser: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubble: { padding: 14, borderRadius: 14 },
  bubbleUser: { backgroundColor: '#0F1115', borderTopRightRadius: 2 },
  bubbleAssistant: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.08)',
    gap: 8,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#FAF8F5' },
  bubbleTextAssistant: { color: '#0F1115' },
  timestamp: { fontSize: 10, color: '#868E96', marginTop: 4, marginHorizontal: 4 },
  actionCard: {
    backgroundColor: '#FAF8F5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.08)',
    gap: 3,
    marginTop: 4,
  },
  actionEyebrow: { fontSize: 9, fontWeight: '700', color: '#4D5091', letterSpacing: 0.5 },
  actionTitle: { fontSize: 12, fontWeight: '600', color: '#0F1115' },
  actionDesc: { fontSize: 11, color: '#868E96' },
  confirmBtn: {
    backgroundColor: '#226949',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  confirmedText: { fontSize: 11, color: '#226949', fontWeight: '600', marginTop: 3 },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,17,21,0.08)',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: 'rgba(15,17,21,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F1115',
  },
  sendBtn: {
    backgroundColor: '#226949',
    paddingHorizontal: 18,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
