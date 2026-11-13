import Link from '@/components/link';
import { LogoIpsum } from './hero-section';
import { Frame } from './shared';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Services', href: '#services' },
      { label: 'Reviews', href: '#reviews' },
      { label: 'Get Started', href: '/signup' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact us', href: '#contact' },
      { label: 'Sign In', href: '/login' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-[rgba(255,255,255,0.08)] bg-[#000000] pb-[40px] pt-[72px]">
      <Frame>
        <div className="grid grid-cols-2 gap-[40px] md:grid-cols-[2fr_1fr_1fr]">
          <div className="col-span-2 flex flex-col gap-[16px] md:col-span-1">
            <Link href="/hero" className="w-fit">
              <LogoIpsum />
            </Link>
            <p className="max-w-[300px] font-['Manrope'] text-[14px] leading-[22px] text-[#f6f7f9] opacity-70">
              AI agents that take care of lead generation, customer support and data entry while you build.
            </p>
          </div>
          {columns.map(({ title, links }) => (
            <div key={title} className="flex flex-col gap-[12px]">
              <h3 className="font-['Inter'] text-[14px] font-medium leading-[22px] text-white">{title}</h3>
              <ul className="flex flex-col gap-[8px]">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="font-['Manrope'] text-[14px] leading-[22px] text-[#f6f7f9] opacity-70 transition-opacity hover:opacity-100"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-[56px] flex flex-col gap-[8px] border-t border-[rgba(255,255,255,0.08)] pt-[24px] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-['Manrope'] text-[13px] leading-[20px] text-[#f6f7f9] opacity-60">
            © {new Date().getFullYear()} Logoipsum. All rights reserved.
          </p>
          <a href="#top" className="font-['Manrope'] text-[13px] leading-[20px] text-[#f6f7f9] opacity-60 transition-opacity hover:opacity-100">
            Back to top ↑
          </a>
        </div>
      </Frame>
    </footer>
  );
}

export default SiteFooter;
