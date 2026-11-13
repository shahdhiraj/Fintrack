
import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, HardDrive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { firebaseConfig } from '@/firebase/config';

const COMMAND = 'npm run deploy:rules';
const DISMISS_KEY = 'fintrack:local-notice-dismissed';

/**
 * Informational notice while some features are stored on this device because
 * Firestore refused them (the security rules haven't been deployed yet).
 * Everything still works; data uploads automatically once the rules are live.
 */
export function LocalStorageNotice({ features }: { features: string[] }) {
  const [dismissed, setDismissed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === features.join(','));
    } catch {
      setDismissed(false);
    }
  }, [features]);

  if (dismissed || features.length === 0) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, features.join(','));
    } catch {
      /* ignore */
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div role="status" className="mx-4 md:mx-6 mt-4 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-xs text-sky-950 dark:text-sky-100">
      <div className="flex items-start gap-3">
        <HardDrive className="h-4 w-4 mt-0.5 flex-shrink-0 text-sky-600" />
        <div className="flex-1 space-y-2">
          <p>
            <span className="font-bold">Saving {features.join(', ')} on this device for now.</span>{' '}
            <span className={open ? 'inline' : 'hidden md:inline'}>
              Everything works, but these won&apos;t appear on your other devices until the Firestore rules are deployed.
              Your data then uploads automatically.
            </span>
          </p>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="min-h-9 font-semibold text-sky-700 underline underline-offset-2 dark:text-sky-200 md:hidden"
          >
            {open ? 'Hide details' : 'Details'}
          </button>
          <div className={open ? 'flex flex-wrap items-center gap-2' : 'hidden flex-wrap items-center gap-2 md:flex'}>
            <code className="rounded-md bg-sky-500/15 px-2 py-1 font-mono font-semibold">{COMMAND}</code>
            <Button size="sm" variant="outline" onClick={copy} className="h-7 gap-1 rounded-lg border-sky-500/40 bg-gradient-to-b from-transparent to-sky-500/10 text-[11px] hover:to-sky-500/20">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button asChild size="sm" variant="outline" className="h-7 gap-1 rounded-lg border-sky-500/40 bg-gradient-to-b from-transparent to-sky-500/10 text-[11px] hover:to-sky-500/20">
              <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`} target="_blank" rel="noreferrer">
                Open Firebase Rules <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="-mr-2 -mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sky-700 hover:bg-sky-500/15 dark:text-sky-200">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
