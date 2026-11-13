import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
  alt: string;
  /** Fill the nearest positioned parent (like the old Next.js `fill`). */
  fill?: boolean;
  /** Load eagerly (above the fold). */
  priority?: boolean;
};

/** Plain <img> with lazy loading and async decoding, plus a `fill` mode. */
export default function Image({ fill, priority, className, ...rest }: Props) {
  return (
    <img
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn(fill && 'absolute inset-0 h-full w-full', className)}
      {...rest}
    />
  );
}
