'use client';

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /* When set, the empty input shows these phrases in rotation (blur in,
     hold, blur out) instead of the static placeholder. The first phrase is
     the working placeholder; the rest are example queries — Tab accepts the
     one on screen. */
  phrases?: string[];
  className?: string;
  large?: boolean;
  onFocus?: () => void;
}

// Keep in sync with the visual shape of `placeholder-cycle` in globals.css:
// the keyframes describe fractions of this duration.
const PHRASE_CYCLE_MS = 4000;

export function SearchBar({ value, onChange, placeholder = "Search registries and components...", phrases, className, large, onFocus }: SearchBarProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  const animated = !!phrases && phrases.length > 0 && value === '';
  const currentPhrase = phrases?.[phraseIndex] ?? '';
  // Phrase 0 is the job label, not a query — Tab only accepts real examples.
  const completable = animated && phraseIndex > 0;

  useEffect(() => {
    if (!phrases || phrases.length < 2) return;
    const id = setInterval(
      () => setPhraseIndex((current) => (current + 1) % phrases.length),
      PHRASE_CYCLE_MS
    );
    return () => clearInterval(id);
  }, [phrases]);

  const handleClear = () => {
    onChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && !e.shiftKey && completable) {
      e.preventDefault();
      onChange(currentPhrase);
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${large ? "w-5 h-5 left-4" : "w-4 h-4"}`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={animated ? "" : placeholder}
          aria-label={placeholder}
          className={`w-full pr-10 bg-background border border-input rounded-none text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] font-mono focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${large ? "pl-12 py-3.5 text-base sm:py-4 sm:text-sm" : "pl-10 py-2 text-sm"}`}
          autoComplete="off"
          spellCheck="false"
        />
        {animated && (
          <div
            className={`absolute inset-y-0 flex items-center pointer-events-none overflow-hidden text-muted-foreground font-mono ${large ? "left-12 right-10 text-base sm:text-sm" : "left-10 right-10 text-sm"}`}
          >
            <span
              key={phraseIndex}
              aria-hidden="true"
              className="animate-placeholder-cycle motion-reduce:hidden truncate"
              style={{ animationDuration: `${PHRASE_CYCLE_MS}ms` }}
            >
              {currentPhrase}
            </span>
            <span aria-hidden="true" className="hidden motion-reduce:inline truncate">
              {phrases[0]}
            </span>
          </div>
        )}
        {completable && focused && (
          <span
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline text-[10px] font-mono uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 pointer-events-none"
          >
            tab
          </span>
        )}
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
