'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Repeat,
  MessageSquare,
  Settings,
  HelpCircle,
  Zap,
  Mail,
  Bell,
  Sparkles,
  Sun,
  Moon,
  Target,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { UserNav } from './user-nav';
import { GlobalSearch, type SearchPage } from './global-search';
import { AuthController } from './auth-controller';
import { AddTransactionDialog } from './transactions/add-transaction-dialog';
import { useTransaction } from '@/context/transaction-context';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loadDemoData } = useTransaction();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { user } = useUser();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const mainNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/budgets', label: 'Budgets & Goals', icon: Target, badge: 'Active' },
    { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/wallets', label: 'Wallets', icon: Wallet },
  ];

  const featuresNav = [
    { href: '/recurring', label: 'Recurring Bills', icon: Repeat },
    { href: '/feedback', label: 'Feedback', icon: MessageSquare },
  ];

  const generalNav = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/help', label: 'Help Desk', icon: HelpCircle },
  ];

  const searchPages: SearchPage[] = [...mainNav, ...featuresNav, ...generalNav].map(
    ({ href, label }) => ({ href, label })
  );

  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return <AuthController>{children}</AuthController>;
  }

  const handleLoadDemo = () => {
    loadDemoData();
    toast({
      title: 'Demo Financial Data Loaded 🚀',
      description: 'Loaded sample income, transactions, and bill subscriptions.',
    });
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Oripio';

  return (
    <AuthController>
      <Sidebar className="border-r border-border/60 bg-sidebar transition-all duration-300" collapsible="icon">
        {/* Brand Header */}
        <SidebarHeader className="p-4 border-b border-border/30 space-y-3 transition-all duration-300">
          <div className={cn("flex items-center justify-between transition-all", isCollapsed && "flex-col gap-4 justify-center")}>
            <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              {!isCollapsed && (
                <span className="text-lg font-extrabold tracking-tight text-foreground whitespace-nowrap transition-all">
                  Finlo Flash
                </span>
              )}
            </Link>
            <SidebarTrigger className={cn("h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all", isCollapsed && "mx-auto")} />
          </div>

          {/* Quick Search */}
          {!isCollapsed ? (
            <div className="transition-all duration-300">
              <GlobalSearch pages={searchPages} />
            </div>
          ) : (
            <div className="flex justify-center py-1 transition-all duration-300">
              <GlobalSearch pages={searchPages} isCollapsed />
            </div>
          )}
        </SidebarHeader>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 transition-all duration-300">
          {/* Main Menu */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5 transition-all">
                MAIN MENU
              </p>
            )}
            <SidebarMenu className="space-y-0.5">
              {mainNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
                        isActive
                          ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        isCollapsed && "justify-center px-0"
                      )}
                    >
                      <Link 
                        href={item.href} 
                        className={cn(
                          "flex items-center w-full", 
                          isCollapsed ? "justify-center" : "justify-between"
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className={cn("h-4 w-4 transition-colors flex-shrink-0", isActive ? "text-emerald-600 dark:text-emerald-400 stroke-[2.5]" : "text-muted-foreground")} />
                          {!isCollapsed && <span className="transition-all">{item.label}</span>}
                        </div>
                        {!isCollapsed && item.badge && (
                          <span
                            className={cn(
                              "px-1.5 py-0.2 text-[10px] font-bold rounded-full transition-all",
                              isActive
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>

          {/* Features Menu */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5 transition-all">
                FEATURES
              </p>
            )}
            <SidebarMenu className="space-y-0.5">
              {featuresNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
                        isActive
                          ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        isCollapsed && "justify-center px-0"
                      )}
                    >
                      <Link 
                        href={item.href} 
                        className={cn(
                          "flex items-center w-full", 
                          isCollapsed ? "justify-center" : "justify-between"
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className={cn("h-4 w-4 transition-colors flex-shrink-0", isActive ? "text-emerald-600 dark:text-emerald-400 stroke-[2.5]" : "text-muted-foreground")} />
                          {!isCollapsed && <span className="transition-all">{item.label}</span>}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>

          {/* General Menu */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-1.5 transition-all">
                GENERAL
              </p>
            )}
            <SidebarMenu className="space-y-0.5">
              {generalNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200",
                        isActive
                          ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        isCollapsed && "justify-center px-0"
                      )}
                    >
                      <Link 
                        href={item.href} 
                        className={cn(
                          "flex items-center w-full", 
                          isCollapsed ? "justify-center" : "justify-between"
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className={cn("h-4 w-4 transition-colors flex-shrink-0", isActive ? "text-emerald-600 dark:text-emerald-400 stroke-[2.5]" : "text-muted-foreground")} />
                          {!isCollapsed && <span className="transition-all">{item.label}</span>}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLoadDemo}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? "Demo Mode" : undefined}
                >
                  <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  {!isCollapsed && <span className="transition-all">Demo Mode</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </div>

        {/* Sidebar Footer with Add Transaction Button */}
        <SidebarFooter className="p-3 border-t border-border/30 transition-all duration-300">
          <AddTransactionDialog isCollapsed={isCollapsed} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background min-h-screen flex flex-col">
        {/* Top Navigation Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="sm:hidden" />
            <h1 className="text-sm sm:text-lg font-extrabold tracking-tight text-foreground flex items-center gap-1.5 transition-all">
              Welcome back, {displayName} 👋
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border/60 hover:bg-muted/50"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle Theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400" />
            </Button>

            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/60 hover:bg-muted/50">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/60 hover:bg-muted/50">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-border/60 hover:bg-muted/50 relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
            </Button>

            <div className="pl-2 border-l border-border/50">
              <UserNav />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </SidebarInset>
    </AuthController>
  );
}
