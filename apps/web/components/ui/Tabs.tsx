'use client';

import React, { type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}: TabsProps) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';

  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 bg-[#F5F2EB] dark:bg-[#1D2129] rounded-lg border border-[rgba(15,17,21,0.06)] dark:border-[rgba(255,255,255,0.08)] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-all duration-150 cursor-pointer select-none ${sizeClasses} ${
              isActive
                ? 'bg-white dark:bg-[#16191F] text-[#0F1115] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#868E96] hover:text-[#0F1115] dark:hover:text-[#FAF8F5]'
            }`}
          >
            {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                  isActive
                    ? 'bg-[#EFECE4] text-[#0F1115] dark:bg-[#272C37] dark:text-[#FAF8F5]'
                    : 'bg-[rgba(15,17,21,0.06)] text-[#868E96] dark:bg-[rgba(255,255,255,0.08)]'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
