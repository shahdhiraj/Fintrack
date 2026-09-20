'use client';

import { useUser, useAuth } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { updateProfile } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50, { message: 'Name must be at most 50 characters.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    // IMPORTANT: Set defaultValues to empty strings to avoid uncontrolled->controlled warning
    defaultValues: {
      displayName: '',
    },
  });

  // Use useEffect to reset the form once the user data is available.
  // This prevents hydration errors by ensuring the form's initial state is consistent.
  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !auth.currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to update your profile.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
        toast({ title: 'Success', description: 'Your profile has been updated.' });
    } catch (error) {
        const firebaseError = error as { message?: string };
        toast({ variant: 'destructive', title: 'Update failed', description: firebaseError.message || 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isUserLoading || !user) {
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Your Information</CardTitle>
                    <CardDescription>View and manage your account details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="flex items-center space-x-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-10 w-28" />
                     </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                     </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                     </div>
                     <Skeleton className="h-10 w-24" />
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>View and manage your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex items-center space-x-6">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={user.photoURL || '/user-avatar-placeholder.png'} alt="User avatar" />
                        <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                     <Button type="button" variant="outline" disabled>Change Picture</Button>
                </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <div>
                    <Label>Email</Label>
                    <Input value={user.email || 'No email associated.'} disabled className="mt-2" />
                </div>

              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
