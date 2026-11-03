import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export interface MobileSearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (q: string) => void;
  isSearching?: boolean;
}

export const QUICK_DISCOVERY_CHIPS = [
  'Frank Sinatra',
  'Daft Punk',
  'The Beatles',
  'Taylor Swift',
  'Kendrick Lamar',
  'Queen',
  'Billie Eilish',
  'Fleetwood Mac',
  'Radiohead',
  'Miles Davis',
] as const;

export const MobileSearchBar: React.FC<MobileSearchBarProps> = React.memo(({
  query,
  setQuery,
  onSearch,
  isSearching = false,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

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
    inputRef.current?.focus();
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    onSearch(chip);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Search Input Container */}
      <form
        role="search"
        onSubmit={handleSubmit}
        className="relative w-full flex items-center"
      >
        <div className="absolute left-3.5 pointer-events-none flex items-center justify-center text-zinc-400">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-300" aria-label="Searching..." />
          ) : (
            <Search className="w-4 h-4 text-zinc-400" aria-hidden="true" />
          )}
        </div>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Artists, songs, or albums..."
          aria-label="Search music"
          className="w-full h-11 pl-10 pr-11 rounded-xl bg-zinc-900/70 border border-white/10 text-zinc-100 placeholder:text-zinc-500 text-sm font-normal focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 shadow-inner transition-colors duration-150 [&::-webkit-search-cancel-button]:hidden"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search query"
            className="absolute right-1 w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 active:scale-95 transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </form>

      {/* Quick discovery chips row */}
      <div className="w-full overflow-x-auto scrollbar-none py-0.5 -my-0.5">
        <div className="flex items-center gap-2">
          {QUICK_DISCOVERY_CHIPS.map((chip) => {
            const isCurrent = query.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`min-h-[32px] px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer border select-none active:scale-95 ${
                  isCurrent
                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold shadow-xs'
                    : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 hover:border-white/10'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

MobileSearchBar.displayName = 'MobileSearchBar';
export default MobileSearchBar;
