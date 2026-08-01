'use client';

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  large?: boolean;
}

export function SearchBar({ value, onChange, placeholder = "Search registries and components...", className, large }: SearchBarProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={className}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${large ? "w-5 h-5 left-4" : "w-4 h-4"}`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`w-full pr-10 bg-background border border-input rounded-none text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] font-mono focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${large ? "pl-12 py-3.5 text-base sm:py-4 sm:text-sm" : "pl-10 py-2 text-sm"}`}
          autoComplete="off"
          spellCheck="false"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
    </div>
  );
}
