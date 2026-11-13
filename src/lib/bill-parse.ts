/**
 * Read the numbers out of a bill's text (from OCR or typed in) and check its arithmetic.
 * Pure functions, no React: easy to test with sample bills.
 *
 * It finds the merchant, dates, line items, subtotal, discount, VAT/tax/service charge and the
 * printed total, then calculates what the total should be and compares the two.
 */

export type BillLine = { label: string; amount: number };

export type ParsedBill = {
  merchant: string | null;
  items: BillLine[];
  subtotal: number | null;
  discount: number | null;
  /** VAT, tax, service charge: added on top. */
  charges: BillLine[];
  /** The total printed on the bill, if found. */
  printedTotal: number | null;
  /** Subtotal (or the sum of items) minus discount plus charges. */
  calculatedTotal: number | null;
  /** Sum of the line items alone. */
  itemsSum: number | null;
  /** True when printed and calculated totals agree (within 1 unit). Null when one is missing. */
  totalsMatch: boolean | null;
  /** Best amount to record: the printed total, else the calculated one. */
  suggestedAmount: number | null;
  billDate: Date | null;
  dueDate: Date | null;
  /** A date with a year from 2070 on looks like Bikram Sambat (B.S.); it is not converted. */
  bsDateText: string | null;
};

const TOTAL = /\b(grand\s*total|net\s*(total|amount|payable)|total\s*(amount|due|payable)?|amount\s*(due|payable)|balance\s*due|payable\s*amount|to\s*pay)\b/i;
const SUBTOTAL = /\b(sub[\s-]*total|gross\s*(total|amount)|taxable\s*(amount|value)|total\s*before\s*(tax|vat))\b/i;
const DISCOUNT = /\b(discount|disc\.?|less|rebate|offer)\b/i;
const CHARGE = /\b(vat|tax|gst|service\s*charge|svc\.?\s*charge|s\.?\s*c\.?|tsc|surcharge)\b/i;
// Lines whose numbers are identifiers, not money.
const NOT_MONEY = /\b(phone|tel|mobile|mob|fax|pan|vat\s*no|vat\s*reg|reg\.?\s*no|invoice\s*(no|#)|bill\s*(no|#)|receipt\s*(no|#)|account|a\/c|customer\s*id|meter|table|token|order\s*(no|#)|qty|quantity|time|page)\b/i;
const CURRENCY = /(n?rs\.?|npr|inr|usd|रु\.?|₹|\$)/gi;

/** "1,23,456.50" / "1 234.50" / "1234" -> number. OCR often reads "." as "," at the cents. */
function toNumber(raw: string): number | null {
  let s = raw.replace(/\s/g, '');
  // "1.234,50" (European) is rare on these bills; treat a final ",dd" as decimals.
  if (/,\d{2}$/.test(s) && !/\.\d{2}$/.test(s)) s = s.replace(/,(\d{2})$/, '.$1');
  s = s.replace(/,/g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** The amount at the end of a line, and the label before it. */
function lineAmount(line: string): { label: string; amount: number } | null {
  const cleaned = line.replace(CURRENCY, ' ').replace(/[:|]/g, ' ').trim();
  // Thousands separators are commas only: a space usually separates qty, rate and amount.
  const m = cleaned.match(/(-?\d{1,3}(?:,\d{2,3})+(?:[.,]\d{1,2})?|-?\d+(?:[.,]\d{1,2})?)\s*(?:\/-|-)?\s*$/);
  if (!m || m.index === undefined) return null;
  const amount = toNumber(m[1]);
  if (amount === null) return null;
  const label = cleaned.slice(0, m.index).replace(/[\s.\-x×*@]+$/i, '').replace(/\s{2,}/g, ' ').trim();
  return { label, amount };
}

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

/** First date on the line, as a JS Date; BS-looking years are reported separately. */
function findDate(line: string): { date: Date | null; bs: string | null } | null {
  const iso = line.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  const dmy = line.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  const named = line.match(/\b(\d{1,2})\s*([a-z]{3,9})\.?,?\s*(\d{4})\b/i) || line.match(/\b([a-z]{3,9})\.?\s*(\d{1,2}),?\s*(\d{4})\b/i);

  let y: number, mo: number, d: number, text: string;
  if (iso) {
    [text, y, mo, d] = [iso[0], +iso[1], +iso[2] - 1, +iso[3]];
  } else if (dmy) {
    // Day first, as on bills in Nepal and most of the world.
    [text, d, mo, y] = [dmy[0], +dmy[1], +dmy[2] - 1, +dmy[3]];
    if (y < 100) y += 2000;
  } else if (named) {
    const dayFirst = /^\d/.test(named[1]);
    const monthName = (dayFirst ? named[2] : named[1]).toLowerCase().slice(0, 4).replace(/t$/, '');
    const month = MONTHS[monthName] ?? MONTHS[monthName.slice(0, 3)];
    if (month === undefined) return null;
    [text, d, mo, y] = [named[0], +(dayFirst ? named[1] : named[2]), month, +named[3]];
  } else return null;

  if (y >= 2070 && y <= 2100) return { date: null, bs: text };
  if (mo < 0 || mo > 11 || d < 1 || d > 31 || y < 2000 || y > 2069) return null;
  const date = new Date(y, mo, d);
  return date.getMonth() === mo ? { date, bs: null } : null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function parseBillText(text: string): ParsedBill {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  let merchant: string | null = null;
  const items: BillLine[] = [];
  const charges: BillLine[] = [];
  let subtotal: number | null = null;
  let discount: number | null = null;
  let printedTotal: number | null = null;
  let billDate: Date | null = null;
  let dueDate: Date | null = null;
  let bsDateText: string | null = null;

  for (const line of lines) {
    const date = findDate(line);
    if (date) {
      if (date.bs) bsDateText ??= date.bs;
      if (date.date) {
        if (/\bdue\b|\bpay\s*by\b|\blast\s*date\b/i.test(line)) dueDate ??= date.date;
        else billDate ??= date.date;
      }
    }

    if (!merchant && /[a-z]{3}/i.test(line) && !/\b(invoice|bill|receipt|tax|vat|pan|date|tel|phone)\b/i.test(line) && !lineAmount(line)) {
      merchant = line.slice(0, 60);
    }

    if (NOT_MONEY.test(line) || (date && !/\d+[.,]\d{2}\s*$/.test(line))) continue;
    const hit = lineAmount(line);
    if (!hit || hit.amount === 0) continue;
    const label = hit.label || line;

    // Order matters: "Sub total" contains "total"; "Total VAT" is a charge.
    if (SUBTOTAL.test(line)) subtotal = hit.amount;
    else if (CHARGE.test(line) && !/\btotal\s*(amount|due|payable)?\s*$/i.test(label)) charges.push({ label, amount: Math.abs(hit.amount) });
    else if (DISCOUNT.test(line)) discount = (discount ?? 0) + Math.abs(hit.amount);
    else if (TOTAL.test(line)) printedTotal = hit.amount; // the last "total" line wins (grand total comes last)
    else if (/[a-z]/i.test(label) && Math.abs(hit.amount) < 10_000_000) items.push({ label, amount: hit.amount });
  }

  const itemsSum = items.length ? round2(items.reduce((s, i) => s + i.amount, 0)) : null;
  const base = subtotal ?? itemsSum;
  const chargesSum = charges.reduce((s, c) => s + c.amount, 0);
  const calculatedTotal = base === null ? null : round2(base - (discount ?? 0) + chargesSum);
  const totalsMatch = printedTotal !== null && calculatedTotal !== null ? Math.abs(printedTotal - calculatedTotal) <= 1 : null;

  return {
    merchant,
    items,
    subtotal,
    discount,
    charges,
    printedTotal,
    calculatedTotal,
    itemsSum,
    totalsMatch,
    suggestedAmount: printedTotal ?? calculatedTotal,
    billDate,
    dueDate,
    bsDateText,
  };
}
