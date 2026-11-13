
import { useState, useEffect } from 'react';
import { useAuth, initiateEmailSignUp } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import Link from '@/components/link';
import { useTheme } from "next-themes";
import { 
  Mail, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  Sun, 
  Moon, 
  Wallet
} from 'lucide-react';

export default function SignupPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please ensure both password fields are identical.',
      });
      return;
    }

    setLoading(true);
    await initiateEmailSignUp(auth, email, password, (error) => {
      setLoading(false);
      let errorMessage = 'Failed to create account.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email address already exists. Please log in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: errorMessage,
      });
    });
  };

  const isLight = mounted && theme === "light";

  return (
    <div className={`flex min-h-screen w-full items-center justify-center relative overflow-hidden transition-colors duration-300 font-body ${
      isLight ? "bg-[#f8fafc] text-[#0f172a]" : "bg-[#080a0c] text-[#ecece8]"
    }`}>
      
      {/* 1. BACKGROUND GLOW BLOBS */}
      <div className="absolute left-1/3 top-1/4 -translate-x-1/2 w-[350px] h-[350px] bg-emerald-500/[0.06] rounded-full blur-[80px] animate-pulse pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 translate-x-1/2 w-[300px] h-[300px] bg-emerald-500/[0.04] rounded-full blur-[70px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

      {/* 2. FLOATING BACK TO HOME & THEME CONTROLS */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] border text-xs font-bold transition-all hover:scale-102 ${
            isLight 
              ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm" 
              : "bg-[#22281f]/74 border-white/10 text-zinc-300 hover:bg-white/5 shadow"
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing</span>
        </Link>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`p-2.5 rounded-[10px] border shadow-lg transition-all hover:scale-105 ${
            isLight 
              ? "bg-white border-slate-200 text-amber-500 shadow-slate-200/30" 
              : "bg-[#22281f]/74 border-white/10 text-sky-400 shadow-black/30 hover:bg-white/5"
          }`}
          title="Toggle Theme"
        >
          {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      {/* 3. MAIN GLASS CARD FORM */}
      <div className={`w-full max-w-md mx-4 relative z-10 transition-all duration-500 ${
        isLight ? "glass-card-light" : "glass-card"
      }`}>
        <div className="p-8 md:p-10 space-y-8">
          
          {/* Form Header */}
          <div className="text-center space-y-2">
            <div className="w-[48px] h-[48px] rounded-[12px] chrome-green flex items-center justify-center mx-auto shadow-md mb-4 transition-transform duration-300 hover:scale-105">
              <Wallet className="w-5 h-5" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Create an account</h1>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-muted-foreground"}`}>
              Enter your email and password to create an account.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className={`text-[10px] font-bold uppercase tracking-wider ${
                isLight ? "text-slate-500" : "text-zinc-400"
              }`}>
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-[10px] pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                    isLight 
                      ? "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-sm" 
                      : "bg-white/5 border border-white/10 text-white focus:bg-white/[0.02] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className={`text-[10px] font-bold uppercase tracking-wider ${
                isLight ? "text-slate-500" : "text-zinc-400"
              }`}>
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  id="password"
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full rounded-[10px] pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                    isLight 
                      ? "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-sm" 
                      : "bg-white/5 border border-white/10 text-white focus:bg-white/[0.02] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  }`}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className={`text-[10px] font-bold uppercase tracking-wider ${
                isLight ? "text-slate-500" : "text-zinc-400"
              }`}>
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-[10px] pl-10 pr-4 py-3 text-xs outline-none transition-all ${
                    isLight 
                      ? "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-sm" 
                      : "bg-white/5 border border-white/10 text-white focus:bg-white/[0.02] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  }`}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full chrome-green chrome-sheen text-white rounded-[10px] py-3.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                loading ? "cursor-not-allowed opacity-80" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Sign Up</span>
              )}
            </button>
          </form>

          {/* Footer Sign In Link */}
          <div className="text-center pt-2 border-t border-slate-200/10">
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-muted-foreground"}`}>
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
