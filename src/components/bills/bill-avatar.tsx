import { useEffect, useState, type ReactNode } from 'react';
import { isAllowedBillImage } from '@/lib/bill-image';
import { cn } from '@/lib/utils';

/**
 * A bill's picture (uploaded thumbnail or https link). Shows `fallback` (the category icon or
 * the bill's initial) when there is no picture or it fails to load.
 */
export function BillAvatar({
  imageUrl,
  name,
  fallback,
  className,
}: {
  imageUrl?: string | null;
  name: string;
  fallback: ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [imageUrl]);
  const show = isAllowedBillImage(imageUrl) && !failed;

  return (
    <div className={cn('flex shrink-0 items-center justify-center overflow-hidden', className)} aria-hidden="true">
      {show ? (
        <img
          src={imageUrl as string}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          title={name}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
