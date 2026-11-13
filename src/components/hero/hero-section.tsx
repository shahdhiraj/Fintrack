import Link from '@/components/link';
import { ChevronDown } from 'lucide-react';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260215_121759_424f8e9c-d8bd-4974-9567-52709dfb6842.mp4';

const DEFAULT_DASHBOARD_SRC =
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2400&q=80';

// Inter, Instrument Serif and Cabin are only used here, so they load with this section.
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cabin:wght@500&family=Inter:wght@500&family=Instrument+Serif:ital@1&family=Manrope:wght@400;500;600&display=swap';

const navLinkClass =
  "flex items-center px-[10px] py-[4px] font-['Manrope'] font-medium text-[14px] leading-[22px] text-white";

const ctaClass =
  "px-[24px] py-[14px] rounded-[10px] font-['Cabin'] font-medium text-[16px] leading-[1.7]";

export function LogoIpsum() {
  return (
    <svg width="134" height="25" viewBox="0 0 134 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Logoipsum">
      <path
        d="M12.5 0C5.6 0 0 5.6 0 12.5S5.6 25 12.5 25 25 19.4 25 12.5 19.4 0 12.5 0Zm0 4.2a8.3 8.3 0 0 1 7.6 5H4.9a8.3 8.3 0 0 1 7.6-5Zm0 16.6a8.3 8.3 0 0 1-7.6-5h15.2a8.3 8.3 0 0 1-7.6 5Zm-8.2-8.3c0-.4 0-.8.1-1.2h16.2c.1.4.1.8.1 1.2s0 .8-.1 1.2H4.4c-.1-.4-.1-.8-.1-1.2Z"
        fill="#FFFFFF"
      />
      <text
        x="32"
        y="18.5"
        fill="#FFFFFF"
        fontFamily="Manrope, sans-serif"
        fontWeight="800"
        fontSize="16"
        letterSpacing="0.6"
      >
        LOGOIPSUM
      </text>
    </svg>
  );
}

export function HeroSection({ dashboardSrc = DEFAULT_DASHBOARD_SRC }: { dashboardSrc?: string }) {
  return (
    <section className="relative w-full overflow-hidden bg-[#000000]">
      <link rel="stylesheet" href={FONTS_HREF} />

      {/* Background video: 120% of the container, centered, anchored to the bottom */}
      <video
        className="absolute bottom-0 left-1/2 z-0 h-[120%] w-[120%] max-w-none -translate-x-1/2 object-cover object-bottom"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      {/* Blurred black pill */}
      <div
        className="pointer-events-none absolute left-1/2 top-[215px] z-[1] h-[384px] w-[801px] -translate-x-1/2 rounded-full bg-[#000000] blur-[77.5px]"
        aria-hidden="true"
      />

      <div className="relative z-[2]">
        {/* Navbar */}
        <header className="mx-auto flex h-[102px] w-full max-w-[1440px] items-center justify-between px-4 py-[16px] lg:px-[120px]">
          <div className="flex items-center gap-[80px]">
            <Link href="/" className="shrink-0">
              <LogoIpsum />
            </Link>
            <nav className="hidden items-center gap-[10px] lg:flex">
              <Link href="/" className={navLinkClass}>
                Home
              </Link>
              <a href="#services" className={`${navLinkClass} gap-[3px]`}>
                Services
                <ChevronDown width={24} height={24} color="#FFFFFF" />
              </a>
              <a href="#reviews" className={navLinkClass}>
                Reviews
              </a>
              <a href="#contact" className={navLinkClass}>
                Contact us
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-[12px]">
            <Link
              href="/login"
              className="rounded-[8px] bg-white px-[16px] py-[8px] font-['Manrope'] text-[14px] font-semibold leading-[22px] text-[#171717] shadow-[inset_0_0_0_1px_#d4d4d4]"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-[8px] bg-[#7b39fc] px-[16px] py-[8px] font-['Manrope'] text-[14px] font-semibold leading-[22px] text-[#fafafa] shadow-[0px_4px_16px_rgba(23,23,23,0.04)]"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero content */}
        <div className="mx-auto mt-[162px] flex max-w-[871px] flex-col items-center gap-[24px] px-4">
          <div className="flex flex-col gap-[10px] text-center">
            <h1 className="text-[44px] leading-[1.15] tracking-[-2px] text-white sm:text-[76px]">
              <span className="block font-['Inter'] font-medium">Automate repetitive.</span>
              <span className="block font-['Instrument_Serif'] font-normal italic">Focus on growth.</span>
            </h1>
            <p className="mx-auto max-w-[613px] font-['Manrope'] text-[18px] font-normal leading-[26px] text-[#f6f7f9] opacity-90">
              The next-generation AI agent platform that handles lead generation, customer support, and data entry while
              you build.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-[22px]">
            <Link href="/signup" className={`${ctaClass} bg-[#7b39fc] text-white`}>
              Get Started Free
            </Link>
            <button type="button" className={`${ctaClass} bg-[#2b2344] text-[#f6f7f9]`}>
              Watch 2min Demo
            </button>
          </div>
        </div>

        {/* Dashboard image */}
        <div className="mt-[80px] flex justify-center pb-[40px]">
          <div className="w-[1163px] max-w-[90vw] rounded-[24px] border-[1.5px] border-transparent bg-[rgba(255,255,255,0.05)] p-[22.5px] backdrop-blur-[10px]">
            <img src={dashboardSrc} alt="Product dashboard" className="block h-auto w-full rounded-[8px] object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
