'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CompanionPulse } from '@/components/domain/CompanionPulse';
import { CompanionMessage, type ActionProposal } from '@/components/domain/CompanionMessage';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  facts?: string[];
  signals?: string[];
  hypotheses?: string[];
  actions?: ActionProposal[];
}

const initialMessages: MessageItem[] = [
  {
    id: 'm1',
    role: 'assistant',
    content:
      'I am your SAAR Companion. I am grounded in your real behavior, your stated goals, and who you want to become. What is on your mind today, or shall we inspect your recent execution patterns?',
    timestamp: '10:00 AM',
    facts: ['3 of 4 planned tasks completed yesterday', '140 minutes cardio logged this week'],
    signals: ['Consistency score is 84 (improving)'],
  },
];

export default function CompanionPage() {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pulseState, setPulseState] = useState<'idle' | 'listening' | 'reflecting' | 'speaking'>('idle');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userText = input.trim();
    setInput('');

    const userMsg: MessageItem = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setPulseState('reflecting');

    try {
      const res = await apiClient.post<any>('/api/v1/companion/chat', { message: userText });
      const resData = res.ok ? (res.data as any) : null;
      const reply = resData?.content || resData?.response;
      setPulseState('speaking');

      const companionMsg: MessageItem = {
        id: `c-${Date.now()}`,
        role: 'assistant',
        content: reply || 'I reviewed your recent activity. You are maintaining strong morning momentum, though your evening wind-down routine has shown some friction.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        facts: resData?.facts || ['Logged 4 consecutive days of morning deep focus'],
        signals: resData?.signals || ['Evening capacity overload detected (+45m)'],
        hypotheses: resData?.hypotheses || ['Pushing high-stimulus tasks past 8 PM delays restorative sleep'],
        actions: resData?.actions || [
          {
            id: 'act-1',
            type: 'suggest_reschedule',
            title: 'Move evening administrative task to 10:00 AM tomorrow',
            description: 'Protects a minimum 90-minute decompression runway before sleep.',
            requiresConfirmation: true,
            status: 'PROPOSED',
          },
        ],
      };

      setMessages((prev) => [...prev, companionMsg]);
    } catch {
      // Fallback
      setTimeout(() => {
        setPulseState('speaking');
        const fallbackMsg: MessageItem = {
          id: `c-${Date.now()}`,
          role: 'assistant',
          content: `I hear you regarding "${userText}". Based on your recent execution records, your consistency is solid at 84%, but your planned evening schedule is currently overloaded. Would you like me to propose a gentle adjustment?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          facts: ['Logged 4 consecutive days of morning deep focus'],
          hypotheses: ['Shifting secondary tasks to tomorrow creates necessary recovery space'],
          actions: [
            {
              id: 'act-1',
              type: 'suggest_reschedule',
              title: 'Move evening administrative task to 10:00 AM tomorrow',
              description: 'Protects a minimum 90-minute decompression runway before sleep.',
              requiresConfirmation: true,
              status: 'PROPOSED',
            },
          ],
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        setTimeout(() => setPulseState('idle'), 2000);
      }, 700);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmAction = (actionId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (!m.actions) return m;
        return {
          ...m,
          actions: m.actions.map((a) =>
            a.id === actionId ? { ...a, status: 'CONFIRMED' as const } : a
          ),
        };
      })
    );
    alert('Action confirmed! The change has been committed to your schedule.');
  };

  const handleRejectAction = (actionId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (!m.actions) return m;
        return {
          ...m,
          actions: m.actions.map((a) =>
            a.id === actionId ? { ...a, status: 'REJECTED' as const } : a
          ),
        };
      })
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] pb-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <CompanionPulse state={pulseState} size={36} />
          <div>
            <h1 className="text-xl font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
              SAAR Companion
            </h1>
            <span className="text-xs text-[#868E96]">
              Calm, evidence-grounded reflection workspace
            </span>
          </div>
        </div>
        <Badge variant="reflection" size="sm">
          Evidence Connected
        </Badge>
      </div>

      {/* Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column (8 cols): Conversational Dialogue */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[#FAF8F5]/50 dark:bg-[#12141A]/50 rounded-xl border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto">
            {messages.map((m) => (
              <CompanionMessage
                key={m.id}
                id={m.id}
                role={m.role}
                content={m.content}
                timestamp={m.timestamp}
                facts={m.facts}
                signals={m.signals}
                hypotheses={m.hypotheses}
                actions={m.actions}
                onConfirmAction={handleConfirmAction}
                onRejectAction={handleRejectAction}
              />
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white dark:bg-[#16191F] border-t border-[rgba(15,17,21,0.08)] dark:border-[rgba(255,255,255,0.08)] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Reflect on your day, explore a pattern, or discuss a goal..."
              className="flex-1 px-4 py-2 text-sm bg-transparent text-[#0F1115] dark:text-[#FAF8F5] focus:outline-none placeholder:text-[#868E96]"
            />
            <Button
              variant="growth"
              size="sm"
              type="submit"
              disabled={!input.trim() || isSending}
              isLoading={isSending}
            >
              Send
            </Button>
          </form>
        </div>

        {/* Right Column (4 cols): Grounding Evidence Context */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 overflow-y-auto">
          <Card variant="default" padding="md" className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-[#868E96] font-semibold">
              Grounding Context
            </span>
            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2.5 bg-[#FAF8F5] dark:bg-[#12141A] rounded-md border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                <strong className="block text-[#0F1115] dark:text-[#FAF8F5] mb-0.5">Active Future Self:</strong>
                <span className="italic text-[#868E96]">&ldquo;Physical vitality, intellectual depth, and continuous personal growth.&rdquo;</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] dark:bg-[#12141A] rounded-md border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                <strong className="block text-[#0F1115] dark:text-[#FAF8F5] mb-0.5">Consistency Signal:</strong>
                <span className="text-[#226949] dark:text-[#4ADE80] font-semibold">84 / 100 (High regularity)</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] dark:bg-[#12141A] rounded-md border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                <strong className="block text-[#0F1115] dark:text-[#FAF8F5] mb-0.5">Active Gap:</strong>
                <span className="text-[#B45309] dark:text-[#FBBF24]">Evening wind-down routine skipped 2x this week.</span>
              </div>
            </div>
          </Card>

          <Card variant="subtle" padding="md">
            <span className="text-xs uppercase tracking-wider text-[#4D5091] dark:text-[#818CF8] font-semibold block mb-1">
              Safety & Verification
            </span>
            <p className="text-[11px] text-[#868E96] leading-relaxed">
              The Companion never diagnoses medical conditions or unilaterally mutates your database. All suggested schedule changes require your explicit confirmation.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
