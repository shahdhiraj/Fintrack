import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  applyPageCustomization,
  postPageCustomization,
  splitTypographyProps,
  usePageTypography,
  type LandingPageCustomization,
  type PageTypographyProps,
} from "./pageTypography";
import {
  SYLVA_TYPOGRAPHY,
} from "./pageRecipes";

export type LandingPageFrameProps = {
  /**
   * CSS selector for the authored visual layer when a complete page is reused
   * as a scene-only Background. The document stays untouched on disk; its UI
   * is suppressed only inside this catalog frame.
   */
  backgroundCanvasSelector?: string;
  /** Extra authored atmosphere layers (scrims, veils, vignettes) to retain. */
  backgroundVisualSelector?: string;
  className?: string;
  /** Loaded directly when the packaged document is byte-exact. */
  sourceUrl: string;
  /** Set only for derived variants; the frame renders this instead of fetching sourceUrl. */
  srcDoc?: string;
  style?: CSSProperties;
  title: string;
  /**
   * Typography and colour overrides, appended to the loaded document's own
   * head. The packaged file is never rewritten, so it stays byte-exact.
   */
  customization?: LandingPageCustomization;
  /**
   * Runs against the live frame on every load and whenever the callback's own
   * identity changes, which is how a page that exposes a scene API of its own
   * receives slider values. Memoize it on the values it reads.
   */
  applyScene?: (frame: HTMLIFrameElement) => void;
};

export type LandingPageProps = Omit<
  LandingPageFrameProps,
  "sourceUrl" | "title" | "customization" | "backgroundCanvasSelector" | "backgroundVisualSelector"
>;

const URL_FRAME_SANDBOX = "allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts";
const SRCDOC_FRAME_SANDBOX = "allow-downloads allow-forms allow-modals allow-popups allow-scripts";

const BACKGROUND_PRESENTATION_STYLE_ID = "threeui-background-presentation";

export function applyBackgroundPresentation(
  frame: HTMLIFrameElement | null,
  backgroundCanvasSelector?: string,
  backgroundVisualSelector?: string,
) {
  const document = frame?.contentDocument;
  if (!document) return;

  document.getElementById(BACKGROUND_PRESENTATION_STYLE_ID)?.remove();
  document.querySelectorAll("[data-threeui-background-layer]").forEach((element) => {
    element.removeAttribute("data-threeui-background-layer");
    element.removeAttribute("data-threeui-background-fill");
  });

  if (!backgroundCanvasSelector) {
    document.documentElement.removeAttribute("data-threeui-presentation");
    return;
  }

  const canvas = document.querySelector<HTMLElement>(backgroundCanvasSelector);
  if (!canvas) return;

  canvas.setAttribute("data-threeui-background-layer", "");
  canvas.setAttribute("data-threeui-background-fill", "");
  if (backgroundVisualSelector) {
    document.querySelectorAll<HTMLElement>(backgroundVisualSelector).forEach((element) => {
      element.setAttribute("data-threeui-background-layer", "");
    });
  }

  document.documentElement.setAttribute("data-threeui-presentation", "background");
  const presentationStyle = document.createElement("style");
  presentationStyle.id = BACKGROUND_PRESENTATION_STYLE_ID;
  presentationStyle.textContent = `
    html[data-threeui-presentation="background"],
    html[data-threeui-presentation="background"] body {
      width: 100% !important;
      height: 100% !important;
      min-height: 100% !important;
      overflow: hidden !important;
    }
    html[data-threeui-presentation="background"] body * {
      visibility: hidden !important;
      pointer-events: none !important;
    }
    html[data-threeui-presentation="background"] [data-threeui-background-layer],
    html[data-threeui-presentation="background"] [data-threeui-background-layer] * {
      visibility: visible !important;
    }
    html[data-threeui-presentation="background"] [data-threeui-background-fill] {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: none !important;
      max-height: none !important;
      margin: 0 !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(presentationStyle);

  // The original renderer may have measured a split hero or section-sized
  // canvas. Re-run its authored resize path after the layer becomes full-frame.
  frame.contentWindow?.requestAnimationFrame(() => {
    frame.contentWindow?.dispatchEvent(new Event("resize"));
  });
}

export function LandingPageFrame({
  applyScene,
  backgroundCanvasSelector,
  backgroundVisualSelector,
  className = "",
  customization,
  sourceUrl,
  srcDoc,
  style,
  title,
}: LandingPageFrameProps) {
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Re-applied on every change; the load handler covers the first paint and
  // any navigation the page does inside its own frame.
  useEffect(() => {
    applyPageCustomization(frameRef.current, customization);
    postPageCustomization(frameRef.current, customization);
    applyBackgroundPresentation(frameRef.current, backgroundCanvasSelector, backgroundVisualSelector);
    if (frameRef.current) applyScene?.(frameRef.current);
  }, [applyScene, backgroundCanvasSelector, backgroundVisualSelector, customization]);

  return (
    <div
      className={`threeui-background landing-page-frame${className ? ` ${className}` : ""}`}
      data-state={ready ? "ready" : "loading"}
      style={{ position: "relative", overflow: "hidden", background: "#080808", pointerEvents: "auto", ...style }}
    >
      <iframe
        ref={frameRef}
        title={title}
        {...(srcDoc ? { srcDoc } : { src: sourceUrl })}
        sandbox={srcDoc ? SRCDOC_FRAME_SANDBOX : URL_FRAME_SANDBOX}
        loading="eager"
        scrolling="no"
        onLoad={(event) => {
          applyPageCustomization(event.currentTarget, customization);
          postPageCustomization(event.currentTarget, customization);
          applyBackgroundPresentation(event.currentTarget, backgroundCanvasSelector, backgroundVisualSelector);
          applyScene?.(event.currentTarget);
          setReady(true);
        }}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          border: 0,
          background: "#080808",
          // A background presentation begins life as the complete source page.
          // Keep that page visually sealed until onLoad has installed the
          // scene-only CSS, otherwise its authored navigation/copy can flash for
          // one paint before the canvas is isolated.
          opacity: backgroundCanvasSelector && !ready ? 0 : 1,
          pointerEvents: backgroundCanvasSelector && !ready ? "none" : "auto",
        }}
      />
    </div>
  );
}

export const SYLVA_HERO_VARIANTS = ["living-green", "sakura-sunset", "maple-autumn", "sequoia-mist"] as const;
export type SylvaHeroVariant = (typeof SYLVA_HERO_VARIANTS)[number];

export type SylvaHeroProps = LandingPageProps & PageTypographyProps & { variant?: SylvaHeroVariant };

const SYLVA_HERO_BASE_URL = "/landing-pages/inner-green-3d.html";

const SYLVA_HERO_ASSET_DIR = "inner-green-assets/";
const SYLVA_HERO_ASSET_BASE = `${SYLVA_HERO_BASE_URL.replace(/[^/]+$/, "")}${SYLVA_HERO_ASSET_DIR}`;

type SylvaHeroChromeTone = {
  edge: string;
  lift: string;
  panel: string;
  drop: string;
  nearPanel: string;
  mark: string;
  markInk: string;
  plate: string;
};

const SYLVA_HERO_CHROME_TONES: Record<Exclude<SylvaHeroVariant, "living-green">, SylvaHeroChromeTone> = {
  "sakura-sunset": {
    edge: "255, 236, 243",
    lift: "255, 240, 246",
    panel: "48, 33, 43",
    drop: "20, 10, 18",
    nearPanel: "53, 35, 46",
    mark: "#f3e9ee",
    markInk: "#33222c",
    plate: "58, 40, 51",
  },
  "maple-autumn": {
    edge: "228, 240, 246",
    lift: "232, 244, 250",
    panel: "33, 41, 47",
    drop: "8, 14, 18",
    nearPanel: "37, 46, 53",
    mark: "#e8eff2",
    markInk: "#23303a",
    plate: "34, 46, 54",
  },
  "sequoia-mist": {
    edge: "236, 244, 232",
    lift: "238, 246, 232",
    panel: "38, 48, 40",
    drop: "16, 24, 18",
    nearPanel: "43, 54, 44",
    mark: "#eef3e8",
    markInk: "#26302a",
    plate: "48, 60, 50",
  },
};

function sylvaHeroChromeStyle(tone: SylvaHeroChromeTone) {
  return `<style data-threeui-sylva-hero-chrome>
/* ── nav: the authored glass, retoned to the field behind it ────────────── */
.dock {
  border-color: rgba(${tone.edge}, 0.13) !important;
  background:
    linear-gradient(180deg, rgba(${tone.lift}, 0.06), rgba(${tone.lift}, 0) 42%),
    rgba(${tone.panel}, 0.76) !important;
  box-shadow: 0 calc(8 * var(--u)) calc(22 * var(--u)) rgba(${tone.drop}, 0.34),
              inset 0 1px rgba(${tone.lift}, 0.07) !important;
}

.dock-item[data-near="true"] {
  border-color: rgba(${tone.edge}, 0.20) !important;
  background: rgba(${tone.nearPanel}, 0.94) !important;
  box-shadow: 0 calc(7 * var(--u)) calc(16 * var(--u)) rgba(${tone.drop}, 0.32) !important;
}

.dock-mark {
  background: ${tone.mark} !important;
  border-color: ${tone.mark} !important;
  color: ${tone.markInk} !important;
}

.dock-mark[data-near="true"] {
  background: #fff !important;
  border-color: #fff !important;
  color: ${tone.markInk} !important;
}

.dock-item--enter { background: rgba(${tone.lift}, 0.085) !important; }

/* ── the two native controls ────────────────────────────────────────────
   The frosted plate cannot go on the clip elements themselves: their clip is
   cut to the button's whole bloom, so the blur would read as a slab twice the
   button's size. It cannot go inside them either — clip-path makes a backdrop
   root, so a child's backdrop-filter would have nothing behind it to sample.

   So each plate is its own layer outside the reveal clip, sized one unit past
   the native 202 x 60 Explore control and the 88-unit Play control. The small
   overshoot lets the frost meet the button edge instead of stopping inside it. */
.pill-glass {
  position: absolute;
  z-index: 4;
  left: calc(644 * var(--u));
  top: calc(360 * var(--u));
  width: calc(204 * var(--u));
  height: calc(62 * var(--u));
  margin: calc(-31 * var(--u)) 0 0 calc(-102 * var(--u));
  border-radius: 999px;
  pointer-events: none;
  -webkit-backdrop-filter: blur(calc(13 * var(--u))) saturate(1.16);
  backdrop-filter: blur(calc(13 * var(--u))) saturate(1.16);
  background: rgba(${tone.plate}, 0.22);
}

.play-wrap::before {
  content: "";
  position: absolute;
  z-index: -1;
  left: 50%;
  top: 50%;
  width: calc(90 * var(--u));
  height: calc(90 * var(--u));
  margin: calc(-45 * var(--u)) 0 0 calc(-45 * var(--u));
  border-radius: 50%;
  -webkit-backdrop-filter: blur(calc(13 * var(--u))) saturate(1.16);
  backdrop-filter: blur(calc(13 * var(--u))) saturate(1.16);
  background: rgba(${tone.plate}, 0.22);
}
</style>`;
}

const innerGreenSource = "";
const SAKURA_SUNSET_STYLE = "";
const MAPLE_AUTUMN_STYLE = "";
const SEQUOIA_MIST_STYLE = "";
const applySakuraSunsetVariant = (s: string) => s;
const applyMapleAutumnVariant = (s: string) => s;
const applySequoiaMistVariant = (s: string) => s;

const SYLVA_HERO_SCENES: Record<Exclude<SylvaHeroVariant, "living-green">, {
  style: string;
  apply: (source: string) => string;
}> = {
  "sakura-sunset": { style: SAKURA_SUNSET_STYLE, apply: applySakuraSunsetVariant },
  "maple-autumn": { style: MAPLE_AUTUMN_STYLE, apply: applyMapleAutumnVariant },
  "sequoia-mist": { style: SEQUOIA_MIST_STYLE, apply: applySequoiaMistVariant },
};

export function buildSylvaHeroDocument(variant: Exclude<SylvaHeroVariant, "living-green">) {
  const scene = SYLVA_HERO_SCENES[variant];
  const rooted = innerGreenSource
    .replaceAll(SYLVA_HERO_ASSET_DIR, SYLVA_HERO_ASSET_BASE)
    .replace("</head>", `${scene.style}${sylvaHeroChromeStyle(SYLVA_HERO_CHROME_TONES[variant])}</head>`)
    .replace(
      '<div class="pill-clip">',
      '<span class="pill-glass" aria-hidden="true"></span>\n    <div class="pill-clip">',
    );
  if (!rooted.includes("pill-glass")) throw new Error("Sylva hero chrome no longer matches the authored page.");
  return scene.apply(rooted);
}

const SYLVA_HERO_TITLES: Record<SylvaHeroVariant, string> = {
  "living-green": "Sylva — Into the living world",
  "sakura-sunset": "Sylva — Sakura Sunset",
  "maple-autumn": "Sylva — Maple Autumn",
  "sequoia-mist": "Sylva — Sequoia Mist",
};

export function SylvaHero({ variant = "living-green", ...props }: SylvaHeroProps) {
  const safeVariant = SYLVA_HERO_VARIANTS.includes(variant) ? variant : "living-green";
  const [type, frame] = splitTypographyProps(props);
  const customization = usePageTypography(SYLVA_TYPOGRAPHY, type);
  const srcDoc = useMemo(
    () => (safeVariant === "living-green" ? undefined : buildSylvaHeroDocument(safeVariant)),
    [safeVariant],
  );

  return (
    <LandingPageFrame
      {...frame}
      key={safeVariant}
      customization={customization}
      title={SYLVA_HERO_TITLES[safeVariant]}
      sourceUrl={SYLVA_HERO_BASE_URL}
      srcDoc={srcDoc}
    />
  );
}
