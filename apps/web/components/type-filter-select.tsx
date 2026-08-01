'use client';

import { useMemo } from 'react';
import { Shapes } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@workspace/ui/components/select';
import {
  REGISTRY_TYPE_ORDER,
  REGISTRY_TYPE_LABELS,
  REGISTRY_TYPE_ICONS,
} from '@/lib/registry-mappings';
import type { DirectoryEntry, RegistryStats } from '@/lib/types';

interface TypeFilterSelectProps {
  value: string;
  onChange: (type: string) => void;
  components: DirectoryEntry[];
  stats: Record<string, RegistryStats>;
}

// Facet the directory by registry type (ui, blocks, hooks…). Only types
// that exist somewhere in the corpus are offered, in canonical order —
// all computed from the stats prop already on the client.
export function TypeFilterSelect({ value, onChange, components, stats }: TypeFilterSelectProps) {
  const availableTypes = useMemo(() => {
    const present = new Set<string>();
    for (const entry of components) {
      for (const category of stats[entry.url]?.categories ?? []) {
        present.add(category.slug);
      }
    }
    return REGISTRY_TYPE_ORDER.filter((slug) => present.has(slug));
  }, [components, stats]);

  const SelectedIcon = value !== 'all' ? (REGISTRY_TYPE_ICONS[value] ?? Shapes) : Shapes;
  const selectedLabel = value !== 'all' ? (REGISTRY_TYPE_LABELS[value] ?? value) : 'All types';

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        aria-label="Filter by registry type"
        className={`rounded-none border-input bg-background font-mono text-sm shadow-none ${
          value !== 'all' ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        <span className="flex items-center gap-2">
          <SelectedIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{selectedLabel}</span>
        </span>
      </SelectTrigger>
      <SelectContent align="end" className="rounded-none font-mono">
        <SelectItem value="all" className="rounded-none text-sm">
          <span className="flex items-center gap-2">
            <Shapes className="size-4" aria-hidden="true" />
            All types
          </span>
        </SelectItem>
        {availableTypes.map((slug) => {
          const Icon = REGISTRY_TYPE_ICONS[slug] ?? Shapes;
          return (
            <SelectItem key={slug} value={slug} className="rounded-none text-sm">
              <span className="flex items-center gap-2">
                <Icon className="size-4" aria-hidden="true" />
                {REGISTRY_TYPE_LABELS[slug] ?? slug}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
