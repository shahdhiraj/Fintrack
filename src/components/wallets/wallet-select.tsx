
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransaction } from '@/context/transaction-context';
import { WALLET_TYPES } from '@/lib/types';
import { cn } from '@/lib/utils';

const NONE = '__none__';

/** Wallet picker. `value` undefined means "no wallet". */
export function WalletSelect({
  value,
  onChange,
  className,
  allowNone = true,
  excludeId,
  placeholder = 'Select a wallet',
}: {
  value: string | undefined;
  onChange: (walletId: string | undefined) => void;
  className?: string;
  allowNone?: boolean;
  excludeId?: string;
  placeholder?: string;
}) {
  const { wallets } = useTransaction();
  const options = wallets.filter((w) => w.id !== excludeId);

  return (
    <Select value={value ?? (allowNone ? NONE : undefined)} onValueChange={(v) => onChange(v === NONE ? undefined : v)}>
      <SelectTrigger className={cn('h-9 text-xs rounded-xl', className)}>
        <SelectValue placeholder={options.length ? placeholder : 'No wallets yet'} />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {allowNone && (
          <SelectItem value={NONE} className="text-xs text-muted-foreground">
            No wallet
          </SelectItem>
        )}
        {options.map((w) => (
          <SelectItem key={w.id} value={w.id} className="text-xs">
            {WALLET_TYPES.find((t) => t.value === w.type)?.emoji ?? '👛'} {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
