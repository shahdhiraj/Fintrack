import { useId, useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BillAvatar } from './bill-avatar';
import { isAllowedBillImage, probeImage, resizeBillImage } from '@/lib/bill-image';

/** Picture for a bill: upload a file (resized to a small thumbnail) or paste an https link. */
export function BillImageField({
  value,
  onChange,
  name,
  fallback,
}: {
  value?: string;
  onChange: (next: string | undefined) => void;
  name: string;
  fallback: React.ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const linkId = useId();
  const errorId = useId();
  const [mode, setMode] = useState<'idle' | 'link'>('idle');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await resizeBillImage(file));
      setMode('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'This image could not be used.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const applyLink = async () => {
    const url = link.trim();
    if (!isAllowedBillImage(url) || url.startsWith('data:')) {
      setError('Paste a full image link that starts with https://');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await probeImage(url);
      onChange(url);
      setMode('idle');
      setLink('');
    } catch {
      setError('That link did not load as an image. Check that it points to the picture itself.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <BillAvatar imageUrl={value} name={name} fallback={fallback} className="h-12 w-12 rounded-xl border border-border/60 bg-muted text-xl" />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5 rounded-xl text-xs" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy && mode === 'idle' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />}
            Upload
          </Button>
          <Button
            type="button"
            variant={mode === 'link' ? 'secondary' : 'outline'}
            size="sm"
            className="h-9 gap-1.5 rounded-xl text-xs"
            onClick={() => {
              setMode(mode === 'link' ? 'idle' : 'link');
              setError('');
            }}
            aria-expanded={mode === 'link'}
            aria-controls={linkId}
            disabled={busy}
          >
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Use a link
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5 rounded-xl text-xs text-muted-foreground" onClick={() => onChange(undefined)} disabled={busy}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {mode === 'link' && (
        <div id={linkId} className="flex gap-2">
          <Input
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void applyLink();
              }
            }}
            placeholder="https://example.com/logo.png"
            aria-label="Image link"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="h-9 rounded-xl text-xs"
            autoFocus
          />
          <Button type="button" size="sm" className="h-9 rounded-xl text-xs" onClick={() => void applyLink()} disabled={busy || !link.trim()}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : 'Apply'}
          </Button>
        </div>
      )}

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Optional. A logo or photo shown next to this bill.</p>
      )}
    </div>
  );
}
