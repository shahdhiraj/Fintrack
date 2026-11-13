import { Check, Database, Headphones, Plug, Rocket, SlidersHorizontal, Target } from 'lucide-react';
import { Frame, SectionHeading, glassClass } from './shared';

const services = [
  {
    icon: Target,
    title: 'Lead generation',
    body: 'Agents research prospects, enrich contact data and send first-touch outreach that sounds like your team wrote it.',
    points: ['Finds and qualifies leads', 'Personalised outreach', 'Syncs straight to your CRM'],
  },
  {
    icon: Headphones,
    title: 'Customer support',
    body: 'Answer common questions around the clock, resolve tickets end to end and hand the tricky ones to a person.',
    points: ['24/7 replies in seconds', 'Learns from your help docs', 'Clean handoff to humans'],
  },
  {
    icon: Database,
    title: 'Data entry',
    body: 'Pull details out of emails, PDFs and forms, then file them in the right system without copy and paste.',
    points: ['Reads invoices and forms', 'Validates before it writes', 'Full audit trail'],
  },
];

const steps = [
  { icon: Plug, title: 'Connect your tools', body: 'Link your inbox, CRM, help desk and spreadsheets in a few clicks.' },
  { icon: SlidersHorizontal, title: 'Set the rules', body: 'Tell each agent what good looks like and when to ask for help.' },
  { icon: Rocket, title: 'Let it run', body: 'Agents work in the background while you review results in one place.' },
];

const stats = [
  { value: '30h', label: 'saved per person each week' },
  { value: '< 1 min', label: 'average first reply' },
  { value: '99.9%', label: 'uptime across agents' },
  { value: '120+', label: 'tool integrations' },
];

export function ServicesSection() {
  return (
    <section id="services" className="relative w-full bg-[#000000] py-[120px]">
      <Frame>
        <SectionHeading
          eyebrow="Services"
          line1="Agents for the work"
          line2="that slows you down."
          subtitle="Pick the jobs you never want to do by hand again. Each agent is trained on your process and works inside the tools you already use."
        />

        <div className="mt-[64px] grid grid-cols-1 gap-[24px] md:grid-cols-3">
          {services.map(({ icon: Icon, title, body, points }) => (
            <article key={title} className={`${glassClass} flex flex-col gap-[20px] p-[32px]`}>
              <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-[#7b39fc]">
                <Icon width={24} height={24} color="#FFFFFF" />
              </div>
              <div className="flex flex-col gap-[8px]">
                <h3 className="font-['Inter'] text-[22px] font-medium leading-[1.3] tracking-[-0.5px] text-white">{title}</h3>
                <p className="font-['Manrope'] text-[16px] leading-[24px] text-[#f6f7f9] opacity-70">{body}</p>
              </div>
              <ul className="mt-auto flex flex-col gap-[10px] border-t border-[rgba(255,255,255,0.08)] pt-[20px]">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-[10px] font-['Manrope'] text-[14px] leading-[22px] text-[#f6f7f9]">
                    <Check width={16} height={16} color="#7b39fc" strokeWidth={3} />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-[96px] grid grid-cols-1 gap-[48px] lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <SectionHeading
            align="left"
            eyebrow="How it works"
            line1="Up and running"
            line2="in an afternoon."
          />
          <ol className="flex flex-col gap-[16px]">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className={`${glassClass} flex items-start gap-[20px] p-[24px]`}>
                <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#2b2344]">
                  <Icon width={22} height={22} color="#FFFFFF" />
                </span>
                <div className="flex flex-col gap-[4px]">
                  <span className="font-['Manrope'] text-[13px] font-semibold leading-[20px] text-[#7b39fc]">Step {i + 1}</span>
                  <h3 className="font-['Inter'] text-[18px] font-medium leading-[1.3] text-white">{title}</h3>
                  <p className="font-['Manrope'] text-[15px] leading-[24px] text-[#f6f7f9] opacity-70">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <dl className="mt-[96px] grid grid-cols-2 gap-y-[40px] border-y border-[rgba(255,255,255,0.08)] py-[48px] lg:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-[6px] text-center">
              <dt className="order-2 font-['Manrope'] text-[14px] leading-[22px] text-[#f6f7f9] opacity-70">{label}</dt>
              <dd className="order-1 font-['Instrument_Serif'] text-[48px] italic leading-[1] tracking-[-1px] text-white">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Frame>
    </section>
  );
}

export default ServicesSection;
