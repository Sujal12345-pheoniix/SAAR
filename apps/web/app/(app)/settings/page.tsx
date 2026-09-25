'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  timezone?: string;
  locale?: string;
}

interface UserPreferences {
  dailyGrowthSessionTime?: string;
  notificationPreferences?: {
    emailUpdates?: boolean;
    dailyReminder?: boolean;
    weeklyDigest?: boolean;
  };
  privacyPreferences?: {
    shareAnalytics?: boolean;
  };
}

interface FutureSelf {
  id?: string;
  horizonYears: number;
  identityStatement: string;
  desiredStates: string[];
  coreValues: string[];
  priorities: string[];
  lifeAreaTargets?: Record<string, string>;
}

interface LifeArea {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  color?: string;
  icon?: string;
  isSystem?: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'future-self' | 'life-areas'>('future-self');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Form State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [locale, setLocale] = useState('en-US');

  // Preferences Form State
  const [dailySessionTime, setDailySessionTime] = useState('08:00');
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  // Future Self Form State
  const [horizonYears, setHorizonYears] = useState<number>(3);
  const [identityStatement, setIdentityStatement] = useState('');
  const [desiredStatesStr, setDesiredStatesStr] = useState('');
  const [coreValuesStr, setCoreValuesStr] = useState('');
  const [prioritiesStr, setPrioritiesStr] = useState('');

  // Life Areas State
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([]);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState('#6366f1');

  const loadData = useCallback(async () => {
    try {
      const [meRes, prefRes, fsRes, areasRes] = await Promise.all([
        apiClient.get<UserProfile>('/me'),
        apiClient.get<UserPreferences>('/me/preferences'),
        apiClient.get<FutureSelf>('/future-self'),
        apiClient.get<LifeArea[]>('/life-areas'),
      ]);

      if (meRes.ok && meRes.data) {
        setProfile(meRes.data);
        setDisplayName(meRes.data.displayName || '');
        setTimezone(meRes.data.timezone || 'UTC');
        setLocale(meRes.data.locale || 'en-US');
      }

      if (prefRes.ok && prefRes.data) {
        setDailySessionTime(prefRes.data.dailyGrowthSessionTime || '08:00');
        setEmailUpdates(prefRes.data.notificationPreferences?.emailUpdates ?? true);
        setDailyReminder(prefRes.data.notificationPreferences?.dailyReminder ?? true);
      }

      if (fsRes.ok && fsRes.data) {
        setHorizonYears(fsRes.data.horizonYears || 3);
        setIdentityStatement(fsRes.data.identityStatement || '');
        setDesiredStatesStr((fsRes.data.desiredStates || []).join('\n'));
        setCoreValuesStr((fsRes.data.coreValues || []).join(', '));
        setPrioritiesStr((fsRes.data.priorities || []).join('\n'));
      }

      if (areasRes.ok && areasRes.data) {
        setLifeAreas(areasRes.data);
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function showNotification(type: 'success' | 'error', text: string) {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await apiClient.patch('/me', {
      displayName: displayName.trim(),
      timezone,
      locale,
    });
    setSaving(false);
    if (res.ok) {
      showNotification('success', 'Profile updated successfully.');
    } else {
      showNotification('error', res.error.error.message || 'Failed to update profile.');
    }
  }

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await apiClient.patch('/me/preferences', {
      dailyGrowthSessionTime: dailySessionTime,
      notificationPreferences: {
        emailUpdates,
        dailyReminder,
      },
    });
    setSaving(false);
    if (res.ok) {
      showNotification('success', 'Preferences saved.');
    } else {
      showNotification('error', res.error.error.message || 'Failed to save preferences.');
    }
  }

  async function handleSaveFutureSelf(e: React.FormEvent) {
    e.preventDefault();
    if (!identityStatement.trim()) {
      showNotification('error', 'Identity statement is required.');
      return;
    }

    setSaving(true);
    const desiredStates = desiredStatesStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const coreValues = coreValuesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const priorities = prioritiesStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await apiClient.put('/future-self', {
      horizonYears: Number(horizonYears),
      identityStatement: identityStatement.trim(),
      desiredStates,
      coreValues,
      priorities,
    });

    setSaving(false);
    if (res.ok) {
      showNotification('success', 'Future Self vision updated successfully!');
    } else {
      showNotification('error', res.error.error.message || 'Failed to save Future Self.');
    }
  }

  async function handleAddLifeArea(e: React.FormEvent) {
    e.preventDefault();
    if (!newAreaName.trim()) return;

    setSaving(true);
    const title = newAreaName.trim();
    const type = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'custom';
    const res = await apiClient.post<LifeArea>('/life-areas', {
      title,
      name: title,
      type,
      color: newAreaColor,
    });
    setSaving(false);
    if (res.ok) {
      setNewAreaName('');
      showNotification('success', 'Life Area created.');
      await loadData();
    } else {
      showNotification('error', res.error.error.message || 'Failed to create life area.');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
          Life Settings &amp; Configuration
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
          Configure your Future Self vision, personal life areas, and profile settings.
        </p>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            background: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: statusMessage.type === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>
        {[
          { id: 'future-self', label: '🌟 Future Self' },
          { id: 'life-areas', label: '🗺️ Life Areas' },
          { id: 'profile', label: '👤 Profile' },
          { id: 'preferences', label: '⚙️ Preferences' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.6rem 1rem',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? '#6366f1' : '#6b7280',
              borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Future Self */}
      {activeTab === 'future-self' && (
        <form onSubmit={handleSaveFutureSelf} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
              Future Self Vision
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Define who you want to become. This identity anchors every goal, routine, and action in SAAR.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Time Horizon</label>
            <select
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              className="form-input"
            >
              <option value={1}>1 Year Horizon (Short-term evolution)</option>
              <option value={3}>3 Years Horizon (Medium-term transformation)</option>
              <option value={5}>5 Years Horizon (Long-term vision)</option>
              <option value={10}>10 Years Horizon (North star identity)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Core Identity Statement *</label>
            <textarea
              required
              rows={3}
              value={identityStatement}
              onChange={(e) => setIdentityStatement(e.target.value)}
              placeholder="e.g. I am a clear, disciplined builder and devoted partner who leads with wisdom, exercises daily, and creates lasting value."
              className="form-input"
            />
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              State who you are becoming in present tense (&ldquo;I am...&rdquo;).
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Core Values (comma separated)</label>
            <input
              type="text"
              value={coreValuesStr}
              onChange={(e) => setCoreValuesStr(e.target.value)}
              placeholder="e.g. Integrity, Vitality, Focus, Compassion, Mastery"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Desired Future States (one per line)</label>
            <textarea
              rows={3}
              value={desiredStatesStr}
              onChange={(e) => setDesiredStatesStr(e.target.value)}
              placeholder="e.g.&#10;Running a high-impact technology studio&#10;Financially independent with diversified assets&#10;In the best cardiovascular shape of my life"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Top Priorities (one per line)</label>
            <textarea
              rows={3}
              value={prioritiesStr}
              onChange={(e) => setPrioritiesStr(e.target.value)}
              placeholder="e.g.&#10;1. Deep work blocks daily&#10;2. Consistent sleep and strength training&#10;3. High-quality family connection"
              className="form-input"
            />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Saving...' : 'Save Future Self Vision'}
          </button>
        </form>
      )}

      {/* Tab 2: Life Areas */}
      {activeTab === 'life-areas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
              Your Life Areas
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>
              The holistic pillars that encompass every dimension of your life.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {lifeAreas.map((area) => (
                <div
                  key={area.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#f9fafb',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: area.color || '#6366f1',
                      }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                      {area.name || area.title || area.type || 'Untitled Area'}
                    </span>
                  </div>
                  {area.isSystem && (
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', background: '#e5e7eb', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Custom Area */}
          <form onSubmit={handleAddLifeArea} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
              + Add Custom Life Area
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Area Name</label>
                <input
                  type="text"
                  required
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="e.g. Creativity & Music"
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ width: '120px' }}>
                <label className="form-label">Color</label>
                <input
                  type="color"
                  value={newAreaColor}
                  onChange={(e) => setNewAreaColor(e.target.value)}
                  className="form-input"
                  style={{ height: '42px', padding: '0.2rem' }}
                />
              </div>

              <button type="submit" disabled={saving || !newAreaName.trim()} className="btn btn-primary" style={{ height: '42px' }}>
                {saving ? 'Adding...' : 'Add Area'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
              User Profile
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Manage your identity and regional settings.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="text"
              disabled
              value={profile?.email || ''}
              className="form-input"
              style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. America/New_York, UTC, Asia/Kolkata"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Locale</label>
              <input
                type="text"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                placeholder="en-US"
                className="form-input"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Updating...' : 'Save Profile'}
          </button>
        </form>
      )}

      {/* Tab 4: Preferences */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
              Daily Habits &amp; Notifications
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Configure your daily growth rhythm and notification schedules.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Daily Growth Session Time</label>
            <input
              type="time"
              value={dailySessionTime}
              onChange={(e) => setDailySessionTime(e.target.value)}
              className="form-input"
              style={{ maxWidth: '180px' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              We will prepare your daily alignment dashboard by this time.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9375rem' }}>
              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => setDailyReminder(e.target.checked)}
              />
              Receive daily morning reminder for 5-minute growth session
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9375rem' }}>
              <input
                type="checkbox"
                checked={emailUpdates}
                onChange={(e) => setEmailUpdates(e.target.checked)}
              />
              Weekly progress and alignment summary email
            </label>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      )}
    </div>
  );
}
