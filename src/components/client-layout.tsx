import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { AppShell } from '@/components/app-shell';
import { TransactionProvider } from '@/context/transaction-context';
import { FirebaseClientProvider } from '@/firebase';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

/** App-wide providers. Rendered entirely in the browser (no server rendering in the Vite build). */
export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* Every Framer Motion animation honours the OS "reduce motion" setting. */}
      <MotionConfig reducedMotion="user">
        <FirebaseClientProvider>
          <TransactionProvider>
            <SidebarProvider>
              <AppShell>{children}</AppShell>
            </SidebarProvider>
          </TransactionProvider>
        </FirebaseClientProvider>
      </MotionConfig>
      <Toaster />
    </ThemeProvider>
  );
}
