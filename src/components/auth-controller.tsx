'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

const authRoutes = ['/login', '/signup'];
const publicRoutes = ['/', '/login', '/signup']; // Define public routes

export function AuthController({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user is loaded

    const isAuthRoute = authRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);

    if (user && isAuthRoute) {
      router.push('/dashboard');
    } else if (!user && !isPublicRoute) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  // Render a loading skeleton during the initial user check or during route transitions.
  // This prevents content flashing and ensures a smoother user experience.
  if (isUserLoading || (!user && !publicRoutes.includes(pathname))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="space-y-4 p-8 max-w-sm w-full">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full mt-4" />
        </div>
      </div>
    );
  }

  // Once authentication is resolved, render the children.
  // If the user is authenticated and on a public route, they will be redirected by the useEffect.
  // If the user is not authenticated and on a private route, the skeleton is shown until redirection.
  return <>{children}</>;
}
