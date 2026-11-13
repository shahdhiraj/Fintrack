
import { useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Confirmation for destructive actions. With `confirmText`, the user must
 * type that word before the action button is enabled.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  actionLabel = 'Delete',
  confirmText,
  destructive = true,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: ReactNode;
  actionLabel?: string;
  confirmText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [typed, setTyped] = useState('');
  const locked = Boolean(confirmText) && typed !== confirmText;

  return (
    <AlertDialog onOpenChange={(o) => !o && setTyped('')}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-2">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {confirmText && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              Type <span className="font-mono font-bold text-foreground">{confirmText}</span> to confirm.
            </p>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus className="h-9 rounded-xl" aria-label={`Type ${confirmText} to confirm`} />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={locked}
            onClick={() => void onConfirm()}
            className={cn('rounded-xl', destructive && 'btn-danger')}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
