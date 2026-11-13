import { useState, type FormEvent } from 'react';
import Link from '@/components/link';
import { Clock, Mail, MessageSquare } from 'lucide-react';
import { Frame, SectionHeading, darkButtonClass, glassClass, purpleButtonClass } from './shared';

const inputClass =
  "w-full rounded-[10px] border-[1.5px] border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-[16px] py-[12px] font-['Manrope'] text-[15px] leading-[24px] text-white placeholder:text-[#f6f7f9] placeholder:opacity-40 outline-none transition-colors focus:border-[#7b39fc]";

const labelClass = "flex flex-col gap-[8px] font-['Manrope'] text-[14px] font-medium leading-[22px] text-[#f6f7f9]";

const details = [
  { icon: Mail, title: 'Email us', body: 'hello@example.com' },
  { icon: MessageSquare, title: 'Live chat', body: 'Weekdays, 9am to 6pm' },
  { icon: Clock, title: 'Response time', body: 'Usually within one business day' },
];

/** Closing call to action, styled like the hero CTAs. */
export function CtaBand() {
  return (
    <section className="w-full bg-[#000000] py-[40px]">
      <Frame>
        <div className={`${glassClass} relative overflow-hidden px-[24px] py-[72px] text-center`}>
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7b39fc] opacity-40 blur-[110px]"
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-[640px] flex-col items-center gap-[24px]">
            <h2 className="text-[36px] leading-[1.15] tracking-[-1.5px] text-white sm:text-[52px]">
              <span className="block font-['Inter'] font-medium">Ready to hand off</span>
              <span className="block font-['Instrument_Serif'] font-normal italic">the busywork?</span>
            </h2>
            <p className="font-['Manrope'] text-[18px] leading-[26px] text-[#f6f7f9] opacity-90">
              Start free and launch your first agent today. No credit card needed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-[22px]">
              <Link href="/signup" className={purpleButtonClass}>
                Get Started Free
              </Link>
              <a href="#contact" className={darkButtonClass}>
                Talk to Sales
              </a>
            </div>
          </div>
        </div>
      </Frame>
    </section>
  );
}

export function ContactSection() {
  const [sent, setSent] = useState(false);

  // No backend yet: the form confirms on the page and does not send anything.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
    e.currentTarget.reset();
  };

  return (
    <section id="contact" className="w-full bg-[#000000] py-[120px]">
      <Frame className="grid grid-cols-1 gap-[56px] lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-[40px]">
          <SectionHeading
            align="left"
            eyebrow="Contact us"
            line1="Tell us what"
            line2="you want off your plate."
            subtitle="Share the tasks eating your week and we'll show you how an agent would handle them."
          />
          <ul className="flex flex-col gap-[20px]">
            {details.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-center gap-[16px]">
                <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#2b2344]">
                  <Icon width={20} height={20} color="#FFFFFF" />
                </span>
                <span className="flex flex-col">
                  <span className="font-['Inter'] text-[15px] font-medium leading-[22px] text-white">{title}</span>
                  <span className="font-['Manrope'] text-[14px] leading-[22px] text-[#f6f7f9] opacity-70">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className={`${glassClass} flex flex-col gap-[20px] p-[24px] sm:p-[40px]`}>
          <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
            <label className={labelClass}>
              Name
              <input name="name" required autoComplete="name" placeholder="Your name" className={inputClass} />
            </label>
            <label className={labelClass}>
              Work email
              <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" className={inputClass} />
            </label>
          </div>
          <label className={labelClass}>
            Company
            <input name="company" autoComplete="organization" placeholder="Company name" className={inputClass} />
          </label>
          <label className={labelClass}>
            What should we automate?
            <textarea
              name="message"
              required
              rows={5}
              placeholder="e.g. We spend hours every week copying order details into our spreadsheet."
              className={`${inputClass} resize-none`}
            />
          </label>
          <button type="submit" className={`${purpleButtonClass} w-full`}>
            Send message
          </button>
          <p role="status" className="min-h-[22px] text-center font-['Manrope'] text-[14px] leading-[22px] text-[#f6f7f9]">
            {sent ? "Thanks, we've got your message and will reply within one business day." : ''}
          </p>
        </form>
      </Frame>
    </section>
  );
}

export default ContactSection;
