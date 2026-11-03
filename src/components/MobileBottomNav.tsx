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
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-4">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className={`min-h-[52px] flex-1 flex flex-col items-center justify-center gap-1 py-1 px-2 transition-transform duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-xl cursor-pointer ${
                isActive
                  ? 'text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300 font-normal'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-150 ${
                  isActive ? 'stroke-[2.2px] scale-105 text-zinc-100' : 'stroke-[1.75px]'
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
export default MobileBottomNav;
