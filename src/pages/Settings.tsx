
import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import { sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';
import { Bell, Database, Download, KeyRound, Loader2, LogOut, Monitor, Moon, Palette, Sparkles, Sun, Trash2, User, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth, useUser } from '@/firebase';
import { useTransaction } from '@/context/transaction-context';
import { useDemoMode } from '@/hooks/use-demo-mode';
import { useToast } from '@/hooks/use-toast';
import { download } from '@/lib/export';
import { WalletSelect } from '@/components/wallets/wallet-select';
import { CurrencySetting } from '@/components/settings/currency-setting';
import { SettingsNav } from '@/components/settings/settings-nav';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toCsv } from '@/lib/finance';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: Wallet },
  { id: 'data', label: 'Data', icon: Database },
];

export default function SettingsPage() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const demo = useDemoMode();
  const { preferences, updatePreferences, transactions, recurringBills, wallets, transfers, feedback, deleteAllData, goals, goalContributions, debts, debtPayments } = useTransaction();

  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
  }, [user]);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 50) {
      toast({ variant: 'destructive', title: 'Invalid name', description: 'Use 2 to 50 characters.' });
      return;
    }
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      toast({ title: 'Profile updated', description: `You'll be greeted as ${name}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update failed', description: (error as Error).message });
    } finally {
      setSavingName(false);
    }
  };

  const resetPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: 'Email sent', description: `A password-reset link was sent to ${user.email}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not send email', description: (error as Error).message });
    }
  };

  const stamp = format(new Date(), 'yyyy-MM-dd');
  const walletName = (id?: string) => wallets.find((w) => w.id === id)?.name ?? '';

  const exportCsv = () => {
    const rows = [
      ['Date', 'Description', 'Type', 'Category', 'Amount', 'Wallet'],
      ...transactions.map((t) => [
        format(t.date.toDate(), 'yyyy-MM-dd'),
        t.description,
        t.type,
        t.category,
        (t.type === 'expense' ? -t.amount : t.amount).toFixed(2),
        walletName(t.walletId),
      ]),
    ];
    download(`fintrack-transactions-${stamp}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
    toast({ title: 'Export ready', description: `${transactions.length} transactions exported to CSV.` });
  };

  const exportJson = () => {
    const ts = (t?: { toDate: () => Date } | null) => (t ? t.toDate().toISOString() : null);
    const data = {
      exportedAt: new Date().toISOString(),
      transactions: transactions.map((t) => ({ ...t, date: ts(t.date) })),
      recurringBills: recurringBills.map((b) => ({ ...b, dueDate: ts(b.dueDate), lastPaidAt: ts(b.lastPaidAt) })),
      wallets: wallets.map((w) => ({ ...w, createdAt: ts(w.createdAt) })),
      walletTransfers: transfers.map((t) => ({ ...t, date: ts(t.date) })),
      savingsGoals: goals.map((g) => ({ ...g, targetDate: ts(g.targetDate), createdAt: ts(g.createdAt) })),
      goalContributions: goalContributions.map((c) => ({ ...c, date: ts(c.date) })),
      debts: debts.map((d) => ({ ...d, startDate: ts(d.startDate), dueDate: ts(d.dueDate), createdAt: ts(d.createdAt) })),
      debtPayments: debtPayments.map((p) => ({ ...p, date: ts(p.date) })),
      preferences,
    };
    download(`fintrack-backup-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
    toast({ title: 'Backup ready', description: 'All your data was exported to JSON.' });
  };

  const wipe = async () => {
    setDeleting(true);
    try {
      await deleteAllData();
      toast({ title: 'All data deleted', description: 'Your transactions, bills, wallets, transfers, goals and debts were removed.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed', description: (error as Error).message });
    } finally {
      setDeleting(false);
    }
  };

  const created = user?.metadata.creationTime ? new Date(user.metadata.creationTime) : null;
  const lastLogin = user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, reminders and data.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <SettingsNav sections={SECTIONS} bottomRef={bottomRef} />

        <div className="space-y-5">
          {/* Profile */}
          <Card id="profile" className="rounded-2xl border-border/50 scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription className="text-xs">How you appear in the app, and your sign-in details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={saveName} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="display-name" className="text-xs font-bold">Display name</Label>
                  <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} className="h-9 rounded-xl" />
                </div>
                <Button type="submit" disabled={savingName || displayName.trim() === (user?.displayName ?? '')} className="rounded-xl chrome-green chrome-sheen text-white text-xs font-bold gap-2">
                  {savingName && <Loader2 className="w-4 h-4 animate-spin" />} Save
                </Button>
              </form>
              <Separator />
              <dl className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="font-semibold truncate">{user?.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Member since</dt>
                  <dd className="font-semibold">{created ? format(created, 'MMM d, yyyy') : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last sign-in</dt>
                  <dd className="font-semibold">{lastLogin ? format(lastLogin, 'MMM d, yyyy h:mm a') : '—'}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-xl text-xs gap-2" onClick={resetPassword} disabled={!user?.email}>
                  <KeyRound className="w-4 h-4" /> Send password-reset email
                </Button>
                <Button variant="outline" className="rounded-xl text-xs gap-2" onClick={() => signOut(auth)}>
                  <LogOut className="w-4 h-4" /> Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card id="appearance" className="rounded-2xl border-border/50 scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription className="text-xs">Theme and header display.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map((t) => (
                  <button
                    key={t.value}
                    role="radio"
                    aria-checked={theme === t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      'rounded-xl border p-4 flex flex-col items-center gap-2 text-sm font-semibold transition-all',
                      theme === t.value ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-border/60 hover:bg-muted/40'
                    )}
                  >
                    <t.icon className="w-5 h-5" /> {t.label}
                  </button>
                ))}
              </div>
              <SettingRow label="Show live date & time" description="Display a real-time clock in the top bar.">
                <Switch checked={preferences.showClock} onCheckedChange={(v) => updatePreferences({ showClock: v })} aria-label="Show live clock" />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card id="notifications" className="rounded-2xl border-border/50 scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription className="text-xs">What appears under the bell in the top bar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow label="Upcoming bill reminders" description="Show bills that are due soon.">
                <Switch checked={preferences.billReminders} onCheckedChange={(v) => updatePreferences({ billReminders: v })} aria-label="Upcoming bill reminders" />
              </SettingRow>
              <SettingRow label="Remind me" description="How far ahead a bill counts as due soon.">
                <Select
                  value={String(preferences.reminderDays)}
                  onValueChange={(v) => updatePreferences({ reminderDays: Number(v) })}
                  disabled={!preferences.billReminders}
                >
                  <SelectTrigger className="w-36 h-9 text-xs rounded-xl" aria-label="Reminder window"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[1, 3, 7, 14].map((d) => (
                      <SelectItem key={d} value={String(d)} className="text-xs">{d} day{d > 1 ? 's' : ''} before</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Overdue alerts" description="Flag bills whose due date has passed.">
                <Switch checked={preferences.overdueAlerts} onCheckedChange={(v) => updatePreferences({ overdueAlerts: v })} aria-label="Overdue alerts" />
              </SettingRow>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card id="preferences" className="rounded-2xl border-border/50 scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-base">Preferences</CardTitle>
              <CardDescription className="text-xs">Defaults for new records, and how amounts are shown.</CardDescription>
            </CardHeader>
            <CardContent>
              <SettingRow label="Default wallet" description="New transactions and bills use this wallet unless you choose another.">
                <WalletSelect
                  value={preferences.defaultWalletId || undefined}
                  onChange={(id) => updatePreferences({ defaultWalletId: id ?? '' })}
                  className="w-48"
                />
              </SettingRow>
              <Separator className="my-5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Currency</h3>
                <p className="text-xs text-muted-foreground">How amounts are shown across the app, reports and exports.</p>
              </div>
              <div className="mt-3">
                <CurrencySetting value={preferences.currency} onChange={(currency) => updatePreferences({ currency })} />
              </div>
            </CardContent>
          </Card>

          {/* Data */}
          <Card id="data" className="rounded-2xl border-border/50 scroll-mt-20">
            <CardHeader>
              <CardTitle className="text-base">Data</CardTitle>
              <CardDescription className="text-xs">Export, demo data and deletion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  ['Transactions', transactions.length],
                  ['Bills', recurringBills.length],
                  ['Wallets', wallets.length],
                  ['Transfers', transfers.length],
                  ['Feedback', feedback.length],
                  ['Goals', goals.length],
                  ['Debts', debts.length],
                ].map(([label, n]) => (
                  <div key={label} className="rounded-xl bg-muted/40 p-3">
                    <p className="text-lg font-extrabold tabular-nums">{n}</p>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              <SettingRow label="Export" description="Download a copy of your data.">
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl text-xs gap-1.5" onClick={exportCsv} disabled={transactions.length === 0}>
                    <Download className="w-4 h-4" /> CSV
                  </Button>
                  <Button variant="outline" className="rounded-xl text-xs gap-1.5" onClick={exportJson}>
                    <Download className="w-4 h-4" /> JSON
                  </Button>
                </div>
              </SettingRow>

              <SettingRow
                label="Demo Mode"
                description={demo.isDemoActive ? 'Sample data is loaded. Turning it off removes only the sample records.' : 'Load sample wallets, transactions and bills to explore.'}
              >
                <Button variant="outline" className="rounded-xl text-xs gap-1.5" onClick={demo.toggle} disabled={demo.busy}>
                  {demo.busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-600" />}
                  {demo.isDemoActive ? 'Turn off' : 'Turn on'}
                </Button>
              </SettingRow>

              <Separator />

              <SettingRow label="Delete all data" description="Permanently remove every transaction, bill, wallet and transfer. This cannot be undone." danger>
                <ConfirmDialog
                  title="Delete all of your data?"
                  description={
                    <>
                      <p>
                        This permanently deletes {transactions.length} transactions, {recurringBills.length} bills, {wallets.length} wallets,{' '}
                        {transfers.length} transfers, {goals.length} goals and {debts.length} debts. Your account and feedback are kept.
                      </p>
                      <p>Consider exporting a JSON backup first.</p>
                    </>
                  }
                  confirmText="DELETE"
                  actionLabel="Delete everything"
                  onConfirm={wipe}
                  trigger={
                    <Button variant="outline" className="rounded-xl text-xs gap-1.5 text-rose-600 border-rose-500/40 bg-gradient-to-b from-card to-rose-500/10 hover:to-rose-500/20 hover:text-rose-600" disabled={deleting}>
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete all
                    </Button>
                  }
                />
              </SettingRow>
            </CardContent>
          </Card>
          {/* Marks the end of the page for the section menu. */}
          <div ref={bottomRef} aria-hidden="true" className="h-px" />
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, description, children, danger }: { label: string; description: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <p className={cn('text-sm font-semibold', danger && 'text-rose-600')}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
