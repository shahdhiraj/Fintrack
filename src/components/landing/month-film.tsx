import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Player, type PlayerRef } from '@remotion/player';
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { cn } from '@/lib/utils';

/*
 * "A month with FinTrack": a 16 second Remotion composition played in the page.
 * The Player renders plain React in the DOM, so Tailwind classes and the theme
 * tokens work here. Sizes are in composition pixels and scale with the player:
 * 1280x720 on wider screens, and a stacked 720x1000 layout on phones so the
 * text stays readable once scaled down.
 * All numbers are sample data.
 */

const FPS = 30;
const SCENE = 120;
const SCENES = 4;
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const CHAPTERS = ['Day 1', 'Day 9', 'Day 19', 'Day 30'] as const;
/** A frame in each scene where everything has arrived; used as the still image under reduced motion. */
const SETTLED = 85;

const Compact = createContext(false);

/** 0 to 1 spring that starts `delay` frames into the current scene. */
function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { stiffness: 100, damping: 20 } });
}

function Rise({ delay = 0, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  const t = useEnter(delay);
  return (
    <div className={className} style={{ opacity: t, transform: `translateY(${(1 - t) * 40}px)` }}>
      {children}
    </div>
  );
}

function Scene({ day, title, body, children }: { day: string; title: string; body: string; children: ReactNode }) {
  const frame = useCurrentFrame();
  const compact = useContext(Compact);
  const opacity = interpolate(frame, [0, 10, SCENE - 10, SCENE], [0, 1, 1, 0], CLAMP);
  return (
    <AbsoluteFill
      className={compact ? 'flex-col justify-center gap-12 px-12' : 'flex-row items-center gap-16 px-24'}
      style={{ opacity }}
    >
      <div className={compact ? 'w-full' : 'w-[470px] shrink-0'}>
        <Rise>
          <p className="font-display text-[40px] font-bold text-primary tabular">{day}</p>
        </Rise>
        <Rise delay={5}>
          <p className="mt-3 font-display text-[68px] font-bold leading-[1.02] tracking-tight text-foreground">{title}</p>
        </Rise>
        <Rise delay={10}>
          <p className="mt-6 text-[28px] leading-snug text-muted-foreground">{body}</p>
        </Rise>
      </div>
      <div className={cn('flex flex-col gap-5', !compact && 'flex-1')}>{children}</div>
    </AbsoluteFill>
  );
}

const ROW = 'flex items-center justify-between rounded-[28px] border border-border bg-background px-9 py-6 text-[30px]';

function Bar({ value, over }: { value: number; over?: boolean }) {
  return (
    <div className="h-5 overflow-hidden rounded-full bg-muted">
      <div
        className={cn('h-full origin-left rounded-full', over ? 'bg-destructive' : 'bg-primary')}
        style={{ transform: `scaleX(${Math.min(value, 1)})` }}
      />
    </div>
  );
}

const LIMITS: [string, number][] = [
  ['Housing', 1800],
  ['Groceries', 500],
  ['Dining Out', 250],
];

function SetLimits() {
  const frame = useCurrentFrame();
  return (
    <Scene day="Day 1" title="Set your limits" body="Decide what each category is worth this month.">
      {LIMITS.map(([name, limit], i) => {
        const start = 14 + i * 12;
        const shown = Math.round(interpolate(frame, [start, start + 28], [0, limit], CLAMP));
        return (
          <Rise key={name} delay={start} className={ROW}>
            <span className="font-medium text-foreground">{name}</span>
            <span className="font-semibold text-foreground tabular">${shown.toLocaleString('en-US')}</span>
          </Rise>
        );
      })}
    </Scene>
  );
}

const SPENDS: [string, string][] = [
  ['Coffee', '$4.80'],
  ['Bus pass', '$42.00'],
  ['Weekly shop', '$86.40'],
];

function LogSpending() {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [20, 80], [0.3, 0.64], CLAMP);
  return (
    <Scene day="Day 9" title="Log as you go" body="A few taps per expense, as it happens.">
      {SPENDS.map(([name, amount], i) => (
        <Rise key={name} delay={14 + i * 14} className={ROW}>
          <span className="font-medium text-foreground">{name}</span>
          <span className="text-muted-foreground tabular">-{amount}</span>
        </Rise>
      ))}
      <Rise delay={56} className="space-y-3 px-2 pt-2">
        <div className="flex justify-between text-[26px]">
          <span className="font-medium text-foreground">Groceries</span>
          <span className="text-muted-foreground tabular">${Math.round(fill * 500)} of $500</span>
        </div>
        <Bar value={fill} />
      </Rise>
    </Scene>
  );
}

function GetTheNudge() {
  const frame = useCurrentFrame();
  const fill = interpolate(frame, [14, 50], [0.8, 1.06], CLAMP);
  const over = fill > 1;
  return (
    <Scene day="Day 19" title="Get the nudge" body="You hear about a problem while there is still time to fix it.">
      <Rise delay={8} className="space-y-3 px-2">
        <div className="flex justify-between text-[26px]">
          <span className="font-medium text-foreground">Transport</span>
          <span className={cn('tabular', over ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
            ${Math.round(fill * 300)} of $300
          </span>
        </div>
        <Bar value={fill} over={over} />
      </Rise>
      <Rise delay={52} className={cn(ROW, 'mt-4 border-destructive/40')}>
        <span className="font-medium text-destructive">Transport is $18 over its limit</span>
      </Rise>
      <Rise delay={70} className={ROW}>
        <span className="font-medium text-foreground">Internet bill</span>
        <span className="text-muted-foreground">Due in 3 days</span>
      </Rise>
    </Scene>
  );
}

const MONTH_BARS = [42, 55, 48, 70, 62, 88];

function Review() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kept = Math.round(interpolate(frame, [30, 75], [0, 5330], CLAMP));
  return (
    <Scene day="Day 30" title="Review and reset" body="See what grew, then adjust next month before it starts.">
      <div className="flex h-[250px] items-end gap-5 px-2">
        {MONTH_BARS.map((h, i) => {
          const t = spring({ frame: frame - 12 - i * 5, fps, config: { stiffness: 100, damping: 20 } });
          return (
            <div
              key={i}
              className={cn('flex-1 origin-bottom rounded-t-2xl', i === MONTH_BARS.length - 1 ? 'bg-primary' : 'bg-primary/30')}
              style={{ height: `${h}%`, transform: `scaleY(${t})` }}
            />
          );
        })}
      </div>
      <Rise delay={30} className={cn(ROW, 'chrome-green bg-primary text-primary-foreground')}>
        <span className="font-medium">Kept this month</span>
        <span className="font-display text-[40px] font-bold tabular">${kept.toLocaleString('en-US')}</span>
      </Rise>
    </Scene>
  );
}

function MonthFilm({ compact = false }: { compact?: boolean }) {
  return (
    <Compact.Provider value={compact}>
    <AbsoluteFill className="bg-card font-body">
      <Sequence durationInFrames={SCENE}>
        <SetLimits />
      </Sequence>
      <Sequence from={SCENE} durationInFrames={SCENE}>
        <LogSpending />
      </Sequence>
      <Sequence from={SCENE * 2} durationInFrames={SCENE}>
        <GetTheNudge />
      </Sequence>
      <Sequence from={SCENE * 3} durationInFrames={SCENE}>
        <Review />
      </Sequence>
    </AbsoluteFill>
    </Compact.Provider>
  );
}

/** True below 640px wide. */
function useNarrow() {
  const query = '(max-width: 639px)';
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

/**
 * The film in a Remotion Player with its own controls: a 44px play/pause button and one
 * button per chapter that also shows progress. It plays while on screen and pauses when
 * scrolled away; with reduced motion it starts paused on a finished frame instead.
 */
export default function MonthFilmPlayer() {
  const wrap = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const inView = useInView(wrap, { amount: 0.5 });
  const reduce = useReducedMotion();
  const narrow = useNarrow();
  const [playing, setPlaying] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [ended, setEnded] = useState(false);

  // Play while visible (unless the visitor prefers less motion).
  useEffect(() => {
    const p = player.current;
    if (!p || reduce) return;
    if (inView) p.play();
    else p.pause();
  }, [inView, reduce]);

  // Keep the controls in step without re-rendering on every frame: progress bars are
  // written straight to the DOM; React state changes only when the chapter does.
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => {
      const f = e.detail.frame;
      const idx = Math.min(SCENES - 1, Math.floor(f / SCENE));
      fills.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleX(${i < idx ? 1 : i > idx ? 0 : (f - i * SCENE) / SCENE})`;
      });
      setChapter((c) => (c === idx ? c : idx));
      setEnded(false);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setEnded(true);
    p.addEventListener('frameupdate', onFrame);
    p.addEventListener('seeked', onFrame as never);
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    p.addEventListener('ended', onEnded);
    return () => {
      p.removeEventListener('frameupdate', onFrame);
      p.removeEventListener('seeked', onFrame as never);
      p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause);
      p.removeEventListener('ended', onEnded);
    };
  }, [narrow]);

  const toggle = () => {
    const p = player.current;
    if (!p) return;
    if (ended) p.seekTo(0);
    p.toggle();
  };
  const jump = (i: number) => {
    const p = player.current;
    if (!p) return;
    p.seekTo(i * SCENE + (p.isPlaying() ? 0 : SETTLED));
  };

  return (
    <div
      ref={wrap}
      className="chrome-stroke overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_20px_40px_-24px_hsl(150_24%_7%_/_0.25)]"
    >
      <Player
        key={narrow ? 'narrow' : 'wide'}
        ref={player}
        component={MonthFilm}
        inputProps={{ compact: narrow }}
        durationInFrames={SCENE * SCENES}
        fps={FPS}
        compositionWidth={narrow ? 720 : 1280}
        compositionHeight={narrow ? 1000 : 720}
        initialFrame={reduce ? SETTLED : 0}
        style={{ width: '100%', aspectRatio: narrow ? '720 / 1000' : '16 / 9' }}
        controls={false}
        clickToPlay
        loop={!reduce}
      />

      <div className="flex items-center gap-2 border-t border-border p-2 sm:gap-3 sm:p-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause film' : ended ? 'Replay film' : 'Play film'}
          className="chrome-green flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:scale-95"
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : ended ? (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
          )}
        </button>
        <div role="group" aria-label="Film chapters" className="grid flex-1 grid-cols-4 gap-1.5">
          {CHAPTERS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => jump(i)}
              aria-label={`Jump to ${label}`}
              aria-current={chapter === i ? 'step' : undefined}
              className={cn(
                'relative flex min-h-11 flex-col items-stretch justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition-colors',
                chapter === i ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span className="tabular">{label}</span>
              <span className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span
                  ref={(el) => {
                    fills.current[i] = el;
                  }}
                  className="block h-full origin-left rounded-full bg-primary"
                  style={{ transform: `scaleX(${reduce && i === 0 ? SETTLED / SCENE : 0})` }}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
