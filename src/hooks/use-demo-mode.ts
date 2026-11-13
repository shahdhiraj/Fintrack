
import { useState } from 'react';
import { useTransaction } from '@/context/transaction-context';
import { toast } from '@/hooks/use-toast';

/** Toggle Demo Mode: loads a tagged sample dataset, or removes only that dataset. */
export function useDemoMode() {
  const { isDemoActive, loadDemoData, clearDemoData } = useTransaction();
  const [busy, setBusy] = useState(false);

  const run = async (action: 'load' | 'clear') => {
    if (busy) return;
    setBusy(true);
    try {
      if (action === 'load') {
        await loadDemoData();
        toast({
          title: 'Demo Mode on 🚀',
          description: 'Loaded sample wallets, transactions, transfers and bills. Your own data is untouched.',
        });
      } else {
        await clearDemoData();
        toast({ title: 'Demo Mode off', description: 'All sample data was removed. Your own records were kept.' });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: action === 'load' ? 'Could not load demo data' : 'Could not clear demo data',
        description: (error as Error).message,
      });
    } finally {
      setBusy(false);
    }
  };

  return {
    isDemoActive,
    busy,
    enable: () => run('load'),
    disable: () => run('clear'),
    toggle: () => run(isDemoActive ? 'clear' : 'load'),
  };
}
