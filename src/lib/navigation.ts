/**
 * Small adapters over React Router with the same shape the app used under
 * Next.js (`usePathname`, `useRouter().push`, `useSearchParams().get`), so
 * components didn't need rewriting during the move to Vite.
 */
import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams as useRRSearchParams } from 'react-router-dom';

export function usePathname(): string {
  return useLocation().pathname;
}

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (to: string) => navigate(to),
      replace: (to: string) => navigate(to, { replace: true }),
      back: () => navigate(-1),
    }),
    [navigate]
  );
}

export function useSearchParams(): URLSearchParams {
  return useRRSearchParams()[0];
}
