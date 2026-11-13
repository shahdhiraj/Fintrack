import type { ElementType } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Soft hyphens in the longest names, so they wrap with a hyphen (shown only when they wrap). */
export const softHyphenate = (name: string) => name.replace('Entertainment', 'Entertain­ment').replace('Subscriptions', 'Subscrip­tions');

/**
 * Categories arranged in a circle around a big "+" button. Positions are percentages of the
 * square, so spacing grows with its size and a label never reaches the next item.
 */
export function CategoryWheel<T extends string>({
  categories,
  icons,
  onPick,
  onAdd,
  className,
}: {
  categories: readonly T[];
  icons: Record<string, ElementType>;
  onPick: (category: T) => void;
  onAdd: () => void;
  className?: string;
}) {
  const step = (2 * Math.PI) / Math.max(1, categories.length);
  const radius = 37; // % of the square: leaves room for the labels inside the edge

  return (
    <div className={cn('relative aspect-square w-full max-w-[460px] rounded-3xl border border-border/40 bg-muted/10', className)}>
      <button
        type="button"
        aria-label="Add transaction"
        onClick={onAdd}
        className="absolute left-1/2 top-1/2 z-10 flex h-[22%] w-[22%] min-h-16 min-w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full chrome-green chrome-sheen transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-1/2 w-1/2 max-h-10 max-w-10 stroke-[2.5] text-white" aria-hidden="true" />
      </button>

      {categories.map((category, index) => {
        const angle = step * index - Math.PI / 2; // start at the top
        const Icon = icons[category] || MoreHorizontal;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onPick(category)}
            className="group absolute flex w-[84px] flex-col items-center gap-1"
            // The icon's centre sits on the circle; the label hangs below it.
            style={{ left: `${50 + radius * Math.cos(angle)}%`, top: `${50 + radius * Math.sin(angle)}%`, transform: 'translate(-50%, -22px)' }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card shadow-sm transition-all duration-200 group-hover:scale-110 group-hover:border-emerald-600 group-hover:bg-emerald-500/10">
              <Icon className="h-[18px] w-[18px] text-muted-foreground transition-colors group-hover:text-emerald-600" aria-hidden="true" />
            </span>
            <span className="max-w-full text-center text-[11px] font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-emerald-600">
              {softHyphenate(category)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
