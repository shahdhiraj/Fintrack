
import { useUser } from '@/firebase';
import { useRouter, usePathname } from '@/lib/navigation';
import { useEffect } from 'react';
import { isAppRoute, isAuthRoute } from '@/lib/routes';
import { Skeleton } from './ui/skeleton';


export function AuthController({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user is loaded

    // Only the signed-in app needs an account. Marketing pages, auth pages and unknown
    // URLs (which render the 404 page) stay public.
    if (user && isAuthRoute(pathname)) {
      router.push('/dashboard');
    } else if (!user && isAppRoute(pathname)) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  // Render a loading skeleton during the initial user check or during route transitions.
  // This prevents content flashing and ensures a smoother user experience.
  // Marketing pages and the 404 render straight away. App pages wait for a user; auth pages
  // wait for the check so a signed-in visitor never sees the login form flash before redirecting.
  const waiting = isAppRoute(pathname) ? isUserLoading || !user : isAuthRoute(pathname) && (isUserLoading || !!user);
  if (waiting) {
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
