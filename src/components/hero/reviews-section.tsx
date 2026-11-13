import { Star } from 'lucide-react';
import { Frame, SectionHeading, glassClass } from './shared';

const reviews = [
  {
    quote:
      'Our support queue used to take two people all day. Now the agent closes most tickets on its own and we only see the interesting ones.',
    name: 'Jordan Ellis',
    role: 'Head of Support, Northwind',
  },
  {
    quote:
      'The lead agent books more first calls than our old outbound process, and every contact lands in the CRM already enriched.',
    name: 'Priya Nair',
    role: 'Growth Lead, Brightlane',
  },
  {
    quote:
      'We stopped retyping invoices. It reads the PDF, checks the totals and files it. Setup took one afternoon.',
    name: 'Sam Okafor',
    role: 'Operations Manager, Fieldstone',
  },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('');
}

export function ReviewsSection() {
  return (
    <section id="reviews" className="relative w-full overflow-hidden bg-[#000000] py-[120px]">
      <div
        className="pointer-events-none absolute left-1/2 top-[40%] h-[320px] w-[700px] -translate-x-1/2 rounded-full bg-[#2b2344] opacity-60 blur-[120px]"
        aria-hidden="true"
      />
      <Frame className="relative">
        <SectionHeading
          eyebrow="Reviews"
          line1="Teams that handed off"
          line2="the busywork."
          subtitle="What people say after their first month with an agent on the team."
        />

        <div className="mt-[64px] grid grid-cols-1 gap-[24px] md:grid-cols-3">
          {reviews.map(({ quote, name, role }) => (
            <figure key={name} className={`${glassClass} flex flex-col gap-[24px] p-[32px]`}>
              <div className="flex gap-[4px]" aria-label="5 out of 5 stars">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} width={18} height={18} color="#7b39fc" fill="#7b39fc" />
                ))}
              </div>
              <blockquote className="font-['Manrope'] text-[17px] leading-[27px] text-[#f6f7f9]">“{quote}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-[12px]">
                <span className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#7b39fc] font-['Manrope'] text-[14px] font-semibold text-white">
                  {initials(name)}
                </span>
                <span className="flex flex-col">
                  <span className="font-['Inter'] text-[15px] font-medium leading-[22px] text-white">{name}</span>
                  <span className="font-['Manrope'] text-[13px] leading-[20px] text-[#f6f7f9] opacity-70">{role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Frame>
    </section>
  );
}

export default ReviewsSection;
