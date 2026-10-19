import React from 'react';
import {
  CalendarDays,
  Dumbbell,
  CheckCircle2,
  PhoneOff,
  TrendingUp,
  Settings
} from 'lucide-react';

export type TabId = 'today' | 'fitness' | 'habits' | 'discipline' | 'progress' | 'settings';

interface TabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onSelectTab }) => {
  const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'today', label: 'Today', icon: CalendarDays },
    { id: 'fitness', label: 'Fitness', icon: Dumbbell },
    { id: 'habits', label: 'Habits', icon: CheckCircle2 },
    { id: 'discipline', label: 'Discipline', icon: PhoneOff },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-md pb-safe"
    >
      <div className="max-w-xl mx-auto grid grid-cols-6 items-center px-1 h-16">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors rounded-xl relative ${
                isActive ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 whitespace-nowrap font-medium ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
