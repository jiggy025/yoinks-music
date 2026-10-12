import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export interface MobileSearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (q: string) => void;
  isSearching?: boolean;
}

export const QUICK_DISCOVERY_CHIPS = [
  'The Carpenters',
  'Frank Sinatra',
  'The Beatles',
  'Elvis Presley',
  'Simon & Garfunkel',
  'Nat King Cole',
  'ABBA',
] as const;

export const MobileSearchBar: React.FC<MobileSearchBarProps> = React.memo(({
  query,
  setQuery,
  onSearch,
  isSearching = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        onSearch(trimmed);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    onSearch(chip);
  };

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Search Input Container */}
      <form
        role="search"
        onSubmit={handleSubmit}
        className="relative w-full flex items-center"
      >
        <div className="absolute left-3.5 pointer-events-none flex items-center justify-center text-slate-400">
          {isSearching ? (
            <Loader2 className="w-[18px] h-[18px] animate-spin text-blue-600" aria-label="Searching..." />
          ) : (
            <Search className="w-[18px] h-[18px] text-slate-400" aria-hidden="true" />
          )}
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search artists, songs, or albums..."
          aria-label="Search music"
          className="w-full min-h-[48px] pl-10 pr-12 rounded-xl bg-white border border-slate-200/80 text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs transition-all"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search query"
            className="absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </form>

      {/* Quick discovery chips row */}
      <div className="w-full overflow-x-auto scrollbar-none py-0.5 -my-0.5">
        <div className="flex items-center gap-2 min-w-max px-0.5">
          {QUICK_DISCOVERY_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 hover:border-blue-500 hover:text-blue-600 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center cursor-pointer whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

MobileSearchBar.displayName = 'MobileSearchBar';
export default MobileSearchBar;
