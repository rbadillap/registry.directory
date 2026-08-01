'use client';

import { useMemo } from 'react';
import { ChevronDown, Shapes, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  REGISTRY_TYPE_ORDER,
  REGISTRY_TYPE_LABELS,
  REGISTRY_TYPE_ICONS,
} from '@/lib/registry-mappings';
import type { DirectoryEntry, RegistryStats } from '@/lib/types';

interface TypeFilterMenuProps {
  selected: string[];
  onToggle: (slug: string, checked: boolean) => void;
  onClear: () => void;
  components: DirectoryEntry[];
  stats: Record<string, RegistryStats>;
}

// Facet the directory by registry type (ui, blocks, hooks…) with a
// checkbox menu — multiple types compose as OR. Only types present in
// the corpus are offered, in canonical order, deduped by human label
// (ui/components both read "Components" since Phase 2.5).
export function TypeFilterMenu({ selected, onToggle, onClear, components, stats }: TypeFilterMenuProps) {
  const availableTypes = useMemo(() => {
    const present = new Set<string>();
    for (const entry of components) {
      for (const category of stats[entry.url]?.categories ?? []) {
        present.add(category.slug);
      }
    }
    const seenLabels = new Set<string>();
    return REGISTRY_TYPE_ORDER.filter((slug) => {
      if (!present.has(slug)) return false;
      const label = REGISTRY_TYPE_LABELS[slug] ?? slug;
      if (seenLabels.has(label)) return false;
      seenLabels.add(label);
      return true;
    });
  }, [components, stats]);

  const triggerLabel =
    selected.length === 0
      ? 'All types'
      : selected.length === 1
        ? (REGISTRY_TYPE_LABELS[selected[0]!] ?? selected[0])
        : `${selected.length} types`;

  const active = selected.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Filter by registry type"
        className={`inline-flex h-8 items-center gap-2 border border-input bg-background px-3 font-mono text-sm transition-colors hover:text-foreground ${
          active ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        <Shapes className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">{triggerLabel}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 rounded-none font-mono">
        {availableTypes.map((slug) => {
          const Icon = REGISTRY_TYPE_ICONS[slug] ?? Shapes;
          return (
            <DropdownMenuCheckboxItem
              key={slug}
              checked={selected.includes(slug)}
              // keep the menu open while composing a multi-type facet
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(checked) => onToggle(slug, checked === true)}
              className="rounded-none text-sm"
            >
              <Icon className="size-4" aria-hidden="true" />
              {REGISTRY_TYPE_LABELS[slug] ?? slug}
            </DropdownMenuCheckboxItem>
          );
        })}
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onClear} className="rounded-none text-sm text-muted-foreground">
              <X className="size-4" aria-hidden="true" />
              Clear filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
