import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Amounts in the user's chosen currency, e.g. "Nrs. 1,234.50". See src/lib/currency.ts. */
export { formatMoney, formatMoneyRounded, formatMoneyCompact, currencySymbol } from './currency'
