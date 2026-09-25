'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, TrendingUp, Lightbulb, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface InsightItem {
  id: string;
  category: string;
  title: string;
  description: string;
  metric: string;
  impact: 'High' | 'Medium' | 'Optimal';
  color: string;
}

const SAMPLE_INSIGHTS: InsightItem[] = [
  {
    id: '1',
    category: 'Habit Consistency',
    title: 'Morning Routine Momentum',
    description: 'You achieve 85% higher task completion rates on days when you start your morning routine before 8:00 AM.',
    metric: '+85% Execution Rate',
    impact: 'High',
    color: '#22c55e',
  },
  {
    id: '2',
    category: 'Life Balance & Energy',
    title: 'Mind & Focus Correlation',
    description: 'Deep work blocks scheduled after reflection sessions show a 2x reduction in task procrastination.',
    metric: '2.1x Focus Duration',
    impact: 'Optimal',
    color: '#6366f1',
  },
  {
    id: '3',
    category: 'Goal Alignment',
    title: 'Goal Velocity Ahead of Schedule',
    description: 'Your health and fitness goals are progressing 14% faster than your projected 30-day baseline target.',
    metric: '+14% Pace',
    impact: 'Medium',
    color: '#06b6d4',
  },
];

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightItem[]>(SAMPLE_INSIGHTS);
  const [filter, setFilter] = useState<'all' | 'high' | 'recent'>('all');

  const filteredInsights = insights.filter((item) => {
    if (filter === 'high') return item.impact === 'High';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sparkles size={22} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              Personal Growth Insights
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            AI-driven behavioral analysis, habit correlations, and actionable feedback.
          </p>
        </div>

        {/* Quick summary pill */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '0.625rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            3 Active Insights Generated
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: filter === 'all' ? 'var(--accent)' : 'var(--surface)',
            color: filter === 'all' ? '#fff' : 'var(--text-secondary)',
            boxShadow: filter === 'all' ? '0 2px 8px rgba(99,102,241,0.3)' : 'var(--shadow-sm)',
          }}
        >
          All Insights
        </button>
        <button
          onClick={() => setFilter('high')}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: filter === 'high' ? 'var(--accent)' : 'var(--surface)',
            color: filter === 'high' ? '#fff' : 'var(--text-secondary)',
            boxShadow: filter === 'high' ? '0 2px 8px rgba(99,102,241,0.3)' : 'var(--shadow-sm)',
          }}
        >
          High Impact
        </button>
      </div>

      {/* Insights Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredInsights.map((insight) => (
          <div
            key={insight.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent border */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: insight.color,
              }}
            />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {insight.category}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    background: `${insight.color}15`,
                    color: insight.color,
                  }}
                >
                  {insight.impact}
                </span>
              </div>

              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {insight.title}
              </h3>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {insight.description}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.875rem',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <TrendingUp size={15} style={{ color: insight.color }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: insight.color }}>
                  {insight.metric}
                </span>
              </div>

              <Link
                href="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  textDecoration: 'none',
                }}
              >
                Apply to Today <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Behavioral Intelligence Philosophy Banner */}
      <div
        style={{
          background: 'linear-gradient(145deg, #0B1020 0%, #1a1f3a 100%)',
          borderRadius: 'var(--radius-2xl)',
          padding: '2rem',
          color: '#ffffff',
          boxShadow: '0 8px 32px rgba(11,16,32,0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
          <Lightbulb size={20} style={{ color: '#F59E0B' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>How SAAR Derives Your Growth Intelligence</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: '780px' }}>
          Unlike standard trackers that only record completions, SAAR cross-analyzes your time of day, life area distribution, and task energy levels against your Future Self goals. As you log check-ins and complete daily routines, new verified patterns appear here automatically.
        </p>
      </div>
    </div>
  );
}
