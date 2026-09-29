'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { FutureSelfCard } from '@/components/domain/FutureSelfCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

export default function FutureSelfPage() {
  const [identity, setIdentity] = useState('I lead an intentional, high-impact life focused on physical vitality, intellectual depth, and continuous personal growth.');
  const [horizon, setHorizon] = useState('3-Year Horizon (2029)');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editIdentity, setEditIdentity] = useState(identity);

  const desiredStates = [
    {
      area: 'mind' as const,
      vision: 'Calm emotional resilience, daily contemplative reading, and clear deep-work blocks without distraction.',
      supportingBehaviors: ['20m Morning stillness or reading', 'No digital interruptions before 10 AM'],
    },
    {
      area: 'health' as const,
      vision: 'Exceptional cardiovascular endurance, functional movement, and restorative 8-hour sleep baseline.',
      supportingBehaviors: ['4x Weekly Zone 2 aerobic sessions', 'Consistent 10:30 PM sleep schedule'],
    },
    {
      area: 'career' as const,
      vision: 'Architecting world-class resilient systems that solve foundational human problems with craftsmanship.',
      supportingBehaviors: ['Daily 90m deep design sprint', 'Weekly continuous learning log'],
    },
    {
      area: 'relationships' as const,
      vision: 'Unrushed, attentive presence with family and high-trust collaborative partnerships.',
      supportingBehaviors: ['Device-free family dinners', 'Weekly deliberate catch-up calls'],
    },
  ];

  const fetchFutureSelf = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>('/api/v1/future-self');
      if (res.ok && res.data?.identityStatement) {
        setIdentity(res.data.identityStatement);
        setEditIdentity(res.data.identityStatement);
      }
    } catch {
      // Keep editorial defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFutureSelf();
  }, [fetchFutureSelf]);

  const handleSave = async () => {
    try {
      await apiClient.post('/api/v1/future-self', {
        identityStatement: editIdentity,
        horizonYears: 3,
      });
      setIdentity(editIdentity);
      setIsEditOpen(false);
    } catch {
      setIdentity(editIdentity);
      setIsEditOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.06)] pb-5">
        <span className="text-xs uppercase tracking-widest text-[#868E96] font-semibold block mb-1">
          Identity Anchor
        </span>
        <h1 className="text-3xl font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
          Future Self.
        </h1>
        <p className="text-sm text-[#868E96] mt-1 max-w-2xl leading-relaxed">
          The Future Self is not a fantasy avatar. It is your concrete destination: the virtues, capabilities, and life rhythms you are deliberately cultivating through today’s behavior.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton height={200} variant="rectangular" />
        </div>
      ) : (
        <FutureSelfCard
          identityStatement={identity}
          targetHorizon={horizon}
          desiredStates={desiredStates}
          currentEvidenceCount={14}
          onEdit={() => {
            setEditIdentity(identity);
            setIsEditOpen(true);
          }}
        />
      )}

      {/* Narrative Alignment Note */}
      <Card variant="subtle" padding="md" className="border-l-4 border-l-[#4D5091] dark:border-l-[#818CF8]">
        <h4 className="text-sm font-serif font-semibold text-[#0F1115] dark:text-[#FAF8F5]">
          Behavioral Bridge to the Future Self
        </h4>
        <p className="text-xs text-[#868E96] mt-1 leading-relaxed">
          Every completed task and habit occurrence logged in SAAR is automatically analyzed against these desired states. When a persistent execution gap occurs, the Adaptive Growth Engine recommends gentle schedule recalibrations.
        </p>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Refine Future Self Identity"
        description="Clarify who you are becoming in one clear, aspirational statement."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="growth" size="sm" onClick={handleSave}>
              Save Identity
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Identity Statement"
            value={editIdentity}
            onChange={(e) => setEditIdentity(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
