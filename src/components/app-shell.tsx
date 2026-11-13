
import { isAppRoute } from '@/lib/routes';
import * as React from 'react';
import Link from '@/components/link';
import { usePathname } from '@/lib/navigation';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Repeat,
  MessageSquare,
  Settings,
  HelpCircle,
  Mail,
  Sparkles,
  Loader2,
  Sun,
  Moon,
  Target,
  BarChart3,
  Menu,
  X,
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
import { useDemoMode } from '@/hooks/use-demo-mode';
import { LiveClock } from './live-clock';
import { NotificationsBell } from './notifications-bell';
import { LocalStorageNotice } from './sync-error-banner';
import { useUser } from '@/firebase';
import { MobileTabBar } from './mobile-tab-bar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { localOnly, preferences } = useTransaction();
  const demo = useDemoMode();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // The phone menu is a slide-out panel; close it once a page is chosen.
  React.useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);

  const mainNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/budgets', label: 'Budgets & Goals', icon: Target, badge: 'Active' },
    { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/wallets', label: 'Wallets', icon: Wallet },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  const featuresNav = [
    { href: '/recurring', label: 'Recurring Bills', icon: Repeat },
    { href: '/feedback', label: 'Feedback', icon: MessageSquare },
  ];

  const generalNav = [
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/help', label: 'Help Desk', icon: HelpCircle },
  ];

  const searchPages: SearchPage[] = [...mainNav, ...featuresNav, ...generalNav, { href: '/profile', label: 'Profile' }].map(
    ({ href, label }) => ({ href, label })
  );

  // Everything that is not a signed-in app page (marketing, auth, 404) renders without the sidebar.
  if (!isAppRoute(pathname)) {
    // The sidebar provider wraps everything in a flex row; without flex-1/w-full a
    // public page shrinks to its content width and its centred containers drift left.
    return (
      <AuthController>
        <div className="flex-1 w-full min-w-0">{children}</div>
      </AuthController>
    );
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Oripio';

  return (
    <AuthController>
      <Sidebar side={isMobile ? 'right' : 'left'} className="border-r border-border/60 bg-sidebar transition-all duration-300" collapsible="icon">
        {/* Brand Header */}
        <SidebarHeader className="p-4 border-b border-border/30 space-y-3 transition-all duration-300">
          <div className={cn("flex items-center justify-between transition-all", isCollapsed && "flex-col gap-4 justify-center")}>
            <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform flex-shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <span className="text-lg font-display font-bold tracking-tight text-foreground whitespace-nowrap transition-all">
                  FinTrack
                </span>
              )}
            </Link>
            {isMobile ? (
              <button
                type="button"
                onClick={() => setOpenMobile(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <SidebarTrigger className={cn("h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all", isCollapsed && "mx-auto")} />
            )}
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
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 max-md:h-11 max-md:text-sm",
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
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 max-md:h-11 max-md:text-sm",
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
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "w-full rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 max-md:h-11 max-md:text-sm",
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
                  onClick={demo.toggle}
                  disabled={demo.busy}
                  isActive={demo.isDemoActive}
                  aria-pressed={demo.isDemoActive}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 max-md:h-11 max-md:text-sm",
                    isCollapsed && "justify-center"
                  )}
                  title={demo.isDemoActive ? 'Demo Mode is on — click to remove sample data' : 'Load sample data to explore the app'}
                >
                  {demo.busy ? (
                    <Loader2 className="h-4 w-4 text-emerald-600 flex-shrink-0 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  )}
                  {!isCollapsed && (
                    <span className="flex flex-1 items-center justify-between transition-all">
                      Demo Mode
                      <span
                        className={cn(
                          'px-1.5 text-[10px] font-bold rounded-full',
                          demo.isDemoActive ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {demo.isDemoActive ? 'On' : 'Off'}
                      </span>
                    </span>
                  )}
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

      <SidebarInset className="bg-background min-h-screen min-w-0 flex flex-col">
        {/* Top Navigation Header */}
        <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between gap-2 border-b border-border/40 bg-background/80 px-3 sm:px-4 md:px-8 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Greeting, not a heading: each page has its own h1. */}
            <p className="min-w-0 truncate text-sm sm:text-lg font-extrabold tracking-tight text-foreground">
              <span className="hidden min-[400px]:inline md:hidden lg:inline">Welcome back, </span>
              {displayName} <span aria-hidden="true">👋</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {preferences.showClock && <LiveClock />}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 md:h-9 md:w-9 rounded-full border-border/60 hover:bg-muted/50"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Toggle Theme"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400" />
            </Button>

            <Button asChild variant="outline" size="icon" className="hidden lg:inline-flex h-9 w-9 rounded-full border-border/60 hover:bg-muted/50" title="Help Desk">
              <Link href="/help" aria-label="Help Desk">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="icon" className="hidden lg:inline-flex h-9 w-9 rounded-full border-border/60 hover:bg-muted/50" title="Send feedback">
              <Link href="/feedback" aria-label="Send feedback">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>

            <NotificationsBell />

            <div className="pl-1.5 sm:pl-2 border-l border-border/50">
              <UserNav />
            </div>

            {/* Phones and small tablets: the menu button sits at the right end of the bar. */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpenMobile(!openMobile)}
              aria-label={openMobile ? 'Close menu' : 'Open menu'}
              aria-expanded={openMobile}
              className="h-10 w-10 shrink-0 rounded-full border-border/60 md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <LocalStorageNotice features={localOnly} />
        <main data-app-main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-6">{children}</main>
      </SidebarInset>
      <MobileTabBar />
    </AuthController>
  );
}
