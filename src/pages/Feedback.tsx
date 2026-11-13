
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackForm } from '@/components/feedback/feedback-form';
import { FeedbackHistory } from '@/components/feedback/feedback-history';
import { useTransaction } from '@/context/transaction-context';

export default function FeedbackPage() {
  const { feedback } = useTransaction();
  const rated = feedback.filter((f) => f.rating);
  const avg = rated.length ? rated.reduce((a, f) => a + (f.rating ?? 0), 0) / rated.length : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Feedback</h1>
        <p className="text-sm text-muted-foreground">Report a bug, suggest a feature or tell us what you think.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3 rounded-2xl border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Send feedback</CardTitle>
            <CardDescription className="text-xs">Every message is saved to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Your submissions</CardTitle>
            <CardDescription className="text-xs">
              {feedback.length} sent{avg !== null && ` · average rating ${avg.toFixed(1)} / 5`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackHistory />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
