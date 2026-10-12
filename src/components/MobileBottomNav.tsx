import React from 'react';
import { Search, Library, Settings } from 'lucide-react';

export type MobileTab = 'search' | 'library' | 'settings';

export interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
}

interface NavItem {
  id: MobileTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const MobileBottomNav = React.memo<MobileBottomNavProps>(({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav
      role="navigation"
      aria-label="Main Navigation"
      data-testid="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-safe-bottom select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className={`min-h-[52px] flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-2 transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl cursor-pointer ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-600 font-semibold hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'
                }`}
              />
              <span className="text-[11px] leading-tight tracking-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
