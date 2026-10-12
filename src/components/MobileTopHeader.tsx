import React from 'react';
import { Disc3, Settings } from 'lucide-react';

export interface MobileTopHeaderProps {
  title?: string;
  format?: string;
  onOpenSettings?: () => void;
}

export const MobileTopHeader: React.FC<MobileTopHeaderProps> = React.memo(({
  title = 'Yoinks Music',
  format = 'MP3',
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 pt-safe-top select-none">
      <div className="w-full px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Left: Brand mark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100/80 shadow-xs">
            <Disc3 className="w-5 h-5 text-blue-600" aria-hidden="true" />
          </div>
          <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </span>
        </div>

        {/* Right: Audio format pill & optional settings gear button */}
        <div className="flex items-center gap-2">
          {format && (
            <span
              className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 select-none shadow-xs"
              aria-label={`Audio format: ${format}`}
            >
              {format}
            </span>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Settings"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

MobileTopHeader.displayName = 'MobileTopHeader';
export default MobileTopHeader;
