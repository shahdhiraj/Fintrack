
import { useState } from 'react';
import { Bug, Lightbulb, LifeBuoy, Loader2, MessageCircle, Star, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTransaction } from '@/context/transaction-context';
import { useToast } from '@/hooks/use-toast';
import type { FeedbackType } from '@/lib/types';
import { cn } from '@/lib/utils';

export const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: typeof Bug; hint: string }[] = [
  { value: 'general', label: 'General', icon: MessageCircle, hint: 'Thoughts on the app' },
  { value: 'feature', label: 'Feature idea', icon: Lightbulb, hint: 'Something you want' },
  { value: 'bug', label: 'Bug report', icon: Bug, hint: 'Something broke' },
  { value: 'support', label: 'Get help', icon: LifeBuoy, hint: 'A question for us' },
];

const MAX_MESSAGE = 2000;

export function FeedbackForm({
  defaultType = 'general',
  types = FEEDBACK_TYPES.map((t) => t.value),
  showRating = true,
}: {
  defaultType?: FeedbackType;
  types?: FeedbackType[];
  showRating?: boolean;
}) {
  const { submitFeedback } = useTransaction();
  const { toast } = useToast();
  const [type, setType] = useState<FeedbackType>(defaultType);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const options = FEEDBACK_TYPES.filter((t) => types.includes(t.value));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3 || message.trim().length < 10) {
      toast({ variant: 'destructive', title: 'A little more detail', description: 'Add a subject (3+ characters) and a message (10+ characters).' });
      return;
    }
    setSending(true);
    try {
      await submitFeedback({ type, subject: subject.trim(), message: message.trim(), rating: showRating && rating ? rating : undefined });
      setSent(true);
      setSubject('');
      setMessage('');
      setRating(0);
      toast({ title: 'Thanks! 🙌', description: type === 'support' ? 'Your request was received.' : 'Your feedback was sent.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not send', description: (error as Error).message });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="py-10 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
        <div>
          <p className="font-bold">Received. Thank you!</p>
          <p className="text-sm text-muted-foreground">It&apos;s saved to your account and listed below.</p>
        </div>
        <Button variant="outline" className="rounded-xl text-xs" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {options.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Feedback type">
          {options.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={type === t.value}
              onClick={() => setType(t.value)}
              className={cn(
                'rounded-xl border p-3 text-left transition-all',
                type === t.value ? 'border-emerald-500 bg-emerald-500/10' : 'border-border/60 hover:bg-muted/40'
              )}
            >
              <t.icon className={cn('w-4 h-4 mb-1.5', type === t.value ? 'text-emerald-600' : 'text-muted-foreground')} />
              <p className="text-xs font-bold">{t.label}</p>
              <p className="text-[10px] text-muted-foreground">{t.hint}</p>
            </button>
          ))}
        </div>
      )}

      {showRating && type !== 'support' && (
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">How would you rate the app?</Label>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(rating === n ? 0 : n)}
                className="p-0.5"
              >
                <Star className={cn('w-6 h-6 transition-colors', (hover || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="fb-subject" className="text-xs font-bold">Subject</Label>
        <Input id="fb-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="A short summary" className="h-9 text-sm rounded-xl" required />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Label htmlFor="fb-message" className="text-xs font-bold">Message</Label>
          <span className="text-[10px] text-muted-foreground tabular-nums">{message.length}/{MAX_MESSAGE}</span>
        </div>
        <Textarea
          id="fb-message"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
          placeholder={type === 'bug' ? 'What did you do, what did you expect, and what happened instead?' : 'Tell us more…'}
          className="min-h-[120px] text-sm rounded-xl"
          required
        />
      </div>
      <Button type="submit" disabled={sending} className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2">
        {sending && <Loader2 className="w-4 h-4 animate-spin" />}
        {type === 'support' ? 'Send request' : 'Send feedback'}
      </Button>
    </form>
  );
}
