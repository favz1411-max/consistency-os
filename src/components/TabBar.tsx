import React from 'react';
import {
  CheckSquare,
  Calendar,
  BarChart2,
  Settings
} from 'lucide-react';

export type TabId = 'today' | 'calendar' | 'progress' | 'settings';

interface TabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onSelectTab }) => {
  const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'today', label: 'Today', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav
      aria-label="Primary Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md pb-safe"
    >
      <div className="max-w-lg mx-auto grid grid-cols-4 items-center px-3 h-16 gap-1.5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-center gap-1.5 min-h-[42px] px-2.5 py-2 rounded-2xl text-xs font-semibold transition-colors duration-75 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
