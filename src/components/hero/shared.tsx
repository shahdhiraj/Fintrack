import type { ReactNode } from 'react';

/** Same horizontal frame as the hero navbar: 1440px max, 120px gutters on desktop. */
export function Frame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-4 lg:px-[120px] ${className}`}>{children}</div>;
}

/** Glass surface matching the hero's dashboard frame. */
export const glassClass =
  'rounded-[24px] border-[1.5px] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] backdrop-blur-[10px]';

export const purpleButtonClass =
  "inline-flex items-center justify-center px-[24px] py-[14px] rounded-[10px] bg-[#7b39fc] font-['Cabin'] font-medium text-[16px] leading-[1.7] text-white transition-opacity hover:opacity-90";

export const darkButtonClass =
  "inline-flex items-center justify-center px-[24px] py-[14px] rounded-[10px] bg-[#2b2344] font-['Cabin'] font-medium text-[16px] leading-[1.7] text-[#f6f7f9] transition-opacity hover:opacity-90";

/** Two-line heading in the hero's type pairing: Inter line, then Instrument Serif italic line. */
export function SectionHeading({
  eyebrow,
  line1,
  line2,
  subtitle,
  align = 'center',
}: {
  eyebrow: string;
  line1: string;
  line2: string;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  const alignClass = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left';
  return (
    <div className={`flex max-w-[720px] flex-col gap-[16px] ${alignClass}`}>
      <span className="rounded-full bg-[#2b2344] px-[12px] py-[4px] font-['Manrope'] text-[13px] font-semibold leading-[20px] text-[#f6f7f9]">
        {eyebrow}
      </span>
      <h2 className="text-[36px] leading-[1.15] tracking-[-1.5px] text-white sm:text-[52px]">
        <span className="block font-['Inter'] font-medium">{line1}</span>
        <span className="block font-['Instrument_Serif'] font-normal italic">{line2}</span>
      </h2>
      {subtitle && (
        <p className="max-w-[560px] font-['Manrope'] text-[18px] leading-[26px] text-[#f6f7f9] opacity-70">{subtitle}</p>
      )}
    </div>
  );
}
