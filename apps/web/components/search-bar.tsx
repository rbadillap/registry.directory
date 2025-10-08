'use client';

import { Search, Plus } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-stone-700/50">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search registries by name, description, or url..."
              className="w-full pl-10 pr-10 py-2 bg-black border border-input rounded-none text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] font-mono text-sm focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              autoComplete="off"
              spellCheck="false"
            />
            {value && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            )}
          </div>

          {/* Add Registry Button */}
          <a
            href="https://github.com/rbadillap/registry.directory"
            target="_blank"
            rel="noreferrer"
            aria-label="Suggest a registry"
            className="flex items-center gap-2 px-4 py-2 rounded-none bg-black border border-rose-700 shadow-lg hover:bg-rose-700/80 hover:scale-105 active:scale-95 transition-all duration-150 group focus-visible:ring-2 focus-visible:ring-rose-700 focus-visible:ring-offset-2 focus-visible:ring-offset-black whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-neutral-100" />
            <span className="hidden sm:inline font-mono text-xs text-neutral-100">Add registry</span>
          </a>
        </div>
      </div>
    </div>
  );
}
