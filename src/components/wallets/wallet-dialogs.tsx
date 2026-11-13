
import { useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTransaction } from '@/context/transaction-context';
import { useToast } from '@/hooks/use-toast';
import { WALLET_COLORS, WALLET_TYPES, type Wallet, type WalletColor, type WalletType } from '@/lib/types';
import { cn, formatMoney } from '@/lib/utils';
import { WalletSelect } from './wallet-select';

/** Literal class names so Tailwind keeps them in the build. */
export const WALLET_GRADIENTS: Record<WalletColor, string> = {
  emerald: 'from-emerald-600 to-teal-500',
  sky: 'from-sky-600 to-cyan-500',
  violet: 'from-violet-600 to-fuchsia-500',
  amber: 'from-amber-500 to-orange-500',
  rose: 'from-rose-600 to-pink-500',
  slate: 'from-slate-700 to-slate-500',
};

export function WalletDialog({ wallet, trigger }: { wallet?: Wallet; trigger: ReactNode }) {
  const { addWallet, updateWallet } = useTransaction();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [opening, setOpening] = useState('0');
  const [color, setColor] = useState<WalletColor>('emerald');

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setName(wallet?.name ?? '');
      setType(wallet?.type ?? 'bank');
      setOpening(String(wallet?.openingBalance ?? 0));
      setColor(wallet?.color ?? 'emerald');
    }
    setOpen(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const openingBalance = parseFloat(opening || '0');
    if (!name.trim() || Number.isNaN(openingBalance)) {
      toast({ variant: 'destructive', title: 'Check the form', description: 'A name and a valid starting balance are required.' });
      return;
    }
    const data = { name: name.trim(), type, color, openingBalance: Math.round(openingBalance * 100) / 100 };
    if (wallet) {
      updateWallet(wallet.id, data);
      toast({ title: 'Wallet updated', description: `${data.name} saved.` });
    } else {
      addWallet(data);
      toast({ title: 'Wallet created 👛', description: `${data.name} starts at ${formatMoney(data.openingBalance)}.` });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{wallet ? 'Edit Wallet' : 'New Wallet'}</DialogTitle>
            <DialogDescription className="text-xs">
              A wallet is any place money lives: a bank account, a card, cash, savings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="wallet-name" className="text-xs font-bold">Name</Label>
            <Input id="wallet-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Checking" maxLength={40} required className="h-9 text-xs rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Type</Label>
              <Select value={type} onValueChange={(v: WalletType) => setType(v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl" aria-label="Wallet type"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {WALLET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.emoji} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wallet-opening" className="text-xs font-bold">Starting balance</Label>
              <Input id="wallet-opening" type="number" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} className="h-9 text-xs rounded-xl" />
            </div>
          </div>
          {type === 'credit' && (
            <p className="text-[11px] text-muted-foreground -mt-2">
              For a card you owe money on, enter the current debt as a negative number (e.g. -250).
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Colour</Label>
            <div className="flex gap-2" role="radiogroup" aria-label="Wallet colour">
              {WALLET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full bg-gradient-to-br ring-offset-2 ring-offset-background transition',
                    WALLET_GRADIENTS[c],
                    color === c ? 'ring-2 ring-foreground' : 'opacity-70 hover:opacity-100'
                  )}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold">Cancel</Button>
            <Button type="submit" className="rounded-xl chrome-green chrome-sheen text-white text-xs font-bold">
              {wallet ? 'Save Changes' : 'Create Wallet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TransferDialog({ trigger, defaultFromId }: { trigger: ReactNode; defaultFromId?: string }) {
  const { wallets, walletBalances, addTransfer } = useTransaction();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fromId, setFromId] = useState<string | undefined>();
  const [toId, setToId] = useState<string | undefined>();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const from = defaultFromId ?? wallets[0]?.id;
      setFromId(from);
      setToId(wallets.find((w) => w.id !== from)?.id);
      setAmount('');
      setDate(new Date());
      setNote('');
    }
    setOpen(next);
  };

  const parsed = parseFloat(amount);
  const fromBalance = fromId ? walletBalances[fromId] ?? 0 : 0;
  const fromWallet = wallets.find((w) => w.id === fromId);
  const overdraw = parsed > 0 && fromWallet?.type !== 'credit' && parsed > fromBalance;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId) {
      toast({ variant: 'destructive', title: 'Pick two wallets', description: 'Choose where the money comes from and where it goes.' });
      return;
    }
    if (fromId === toId) {
      toast({ variant: 'destructive', title: 'Same wallet', description: 'Source and destination must be different.' });
      return;
    }
    if (!(parsed > 0)) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Enter an amount greater than zero.' });
      return;
    }
    addTransfer({ fromWalletId: fromId, toWalletId: toId, amount: Math.round(parsed * 100) / 100, date, note: note.trim() });
    const toName = wallets.find((w) => w.id === toId)?.name;
    toast({ title: 'Transfer recorded 🔁', description: `${formatMoney(parsed)} from ${fromWallet?.name} to ${toName}.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Transfer Between Wallets</DialogTitle>
            <DialogDescription className="text-xs">
              Moves money between your wallets. Transfers are not counted as income or spending.
            </DialogDescription>
          </DialogHeader>

          {wallets.length < 2 ? (
            <p className="text-sm text-muted-foreground py-4">You need at least two wallets to make a transfer.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">From</Label>
                  <WalletSelect value={fromId} onChange={setFromId} allowNone={false} />
                  {fromId && <p className="text-[11px] text-muted-foreground">Balance {formatMoney(fromBalance)}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">To</Label>
                  <WalletSelect value={toId} onChange={setToId} allowNone={false} excludeId={fromId} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="transfer-amount" className="text-xs font-bold">Amount</Label>
                  <Input id="transfer-amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="h-9 text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Date</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-start h-9 text-xs rounded-xl font-normal">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {format(date, 'MMM d, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                          if (d) setDate(d);
                          setCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {overdraw && (
                <p className="text-[11px] font-semibold text-amber-600">
                  This is more than the {formatMoney(fromBalance)} available. The wallet will go negative.
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="transfer-note" className="text-xs font-bold">Note</Label>
                <Input id="transfer-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional, e.g. Monthly savings" maxLength={80} className="h-9 text-xs rounded-xl" />
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold">Cancel</Button>
            <Button type="submit" disabled={wallets.length < 2} className="rounded-xl chrome-green chrome-sheen text-white text-xs font-bold">
              Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
