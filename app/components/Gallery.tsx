// The page scrolls natively inside a fixed container whose content is one
// viewport tall per screen. The stage is sticky, so nothing actually scrolls
// on screen: each frame, scroll progress p (in screens) is mapped onto
// transforms of the absolutely positioned screen layers. Between screens k and
// k + 1 (t = p - k):
//   outgoing k:     y = -t·H·(1 - outgoingLag), opacity 1 - t
//   incoming k + 1: y = (1 - t)·H, top edge feathered over seamBlend·H·(1 - t),
//                   blurred backdrop opacity rising from backdropOpacityStart to 1
//   sharp image:    extra y·imageDepth relative to its screen; the outgoing
//                   screen's backdrop stays anchored to the viewport
// Only those two layers are visible; the rest are visibility: hidden.

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { config } from "~/config";
import { Navbar } from "./Navbar";
import { Screen, type LayerElements } from "./Screen";
import type { ScreenDef } from "./screens";

type Props = {
  screens: ScreenDef[];
  heading?: string;
};

type Engine = {
  animateTo: (index: number) => void;
  jumpTo: (index: number) => void;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;

function withNeighbours(prev: ReadonlySet<number>, index: number, n: number): ReadonlySet<number> {
  const add = [];
  for (let i = Math.max(0, index - 2); i <= Math.min(n - 1, index + 2); i++) if (!prev.has(i)) add.push(i);
  return add.length ? new Set([...prev, ...add]) : prev;
}

function findScreen(screens: ScreenDef[], id: string): number {
  const exact = screens.findIndex((s) => s.hashId === id);
  if (exact >= 0) return exact;
  return screens.findIndex((s) => s.kind === "image" && s.image.id === id);
}

export function Gallery({ screens, heading }: Props) {
  const n = screens.length;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const layers = useRef<(LayerElements | null)[]>([]);
  const engine = useRef<Engine | null>(null);
  const { hash } = useLocation();

  const [current, setCurrent] = useState(0);
  const [caption, setCaption] = useState<number | null>(0);
  const [atTop, setAtTop] = useState(true);
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) setLoaded((prev) => withNeighbours(prev, current, n));
  }, [started, current, n]);

  const register = useCallback((index: number, elements: LayerElements | null) => {
    layers.current[index] = elements;
  }, []);

  useEffect(() => {
    if (!scrollerRef.current) return;
    const scroller: HTMLDivElement = scrollerRef.current;
    const { outgoingLag, imageDepth, seamBlend, captionWindow, backdropOpacityStart } = config.transition;

    let H = scroller.clientHeight || 1;
    let frame = 0;
    let snapTimer: ReturnType<typeof setTimeout> | undefined;
    let anim: { target: number; raf: number } | null = null;
    let touching = false;
    let direction = 1;
    let lastTop = scroller.scrollTop;
    const visible = new Set<number>([0]);
    const last: { current: number; caption: number | null; atTop: boolean } = {
      current: 0,
      caption: 0,
      atTop: true,
    };

    const progress = () => clamp(scroller.scrollTop / H, 0, n - 1);

    function place(i: number, y: number, opacity: number, feather: number, backdrop: number) {
      const el = layers.current[i];
      if (!el) return;
      const s = el.root.style;
      s.visibility = "visible";
      s.willChange = "transform, opacity";
      s.transform = y ? `translate3d(0, ${y}px, 0)` : "";
      s.opacity = opacity < 1 ? String(opacity) : "";
      const mask = feather >= 0.5 ? `linear-gradient(to bottom, transparent 0, #000 ${feather}px)` : "";
      s.maskImage = mask;
      s.setProperty("-webkit-mask-image", mask);
      if (el.photo) {
        el.photo.style.willChange = "transform";
        el.photo.style.transform = y ? `translate3d(0, ${y * imageDepth}px, 0)` : "";
      }
      if (el.backdrop) {
        el.backdrop.style.opacity = backdrop < 1 ? String(backdrop) : "";
        el.backdrop.style.transform = y < 0 ? `translate3d(0, ${-y}px, 0)` : "";
      }
    }

    function hide(i: number) {
      const el = layers.current[i];
      if (!el) return;
      el.root.style.visibility = "hidden";
      el.root.style.willChange = "";
      if (el.photo) el.photo.style.willChange = "";
      if (el.backdrop) {
        el.backdrop.style.opacity = "";
        el.backdrop.style.transform = "";
      }
    }

    function render() {
      frame = 0;
      const p = progress();
      const k = Math.min(Math.floor(p), n - 1);
      const t = p - k;

      const show = new Map<number, [y: number, opacity: number, feather: number, backdrop: number]>();
      show.set(k, [-t * H * (1 - outgoingLag), 1 - t, 0, 1]); // FR-4 outgoing lag, FR-12 fade
      if (t > 0 && k + 1 < n) {
        const backdrop = backdropOpacityStart + (1 - backdropOpacityStart) * t;
        show.set(k + 1, [(1 - t) * H, 1, seamBlend * H * (1 - t), backdrop]);
      }
      for (const i of visible) {
        if (!show.has(i)) {
          hide(i);
          visible.delete(i);
        }
      }
      for (const [i, [y, opacity, feather, backdrop]] of show) {
        place(i, y, opacity, feather, backdrop);
        visible.add(i);
      }

      const eps = 1.5 / H;
      const arriving = Math.ceil(p - eps);
      const cap = arriving - p <= captionWindow + eps ? arriving : null;
      const cur = Math.round(p);
      const top = scroller.scrollTop < 1.5;
      if (cur !== last.current) setCurrent((last.current = cur));
      if (cap !== last.caption) setCaption((last.caption = cap));
      if (top !== last.atTop) setAtTop((last.atTop = top));
    }

    function syncHash(index: number) {
      const id = screens[index]?.hashId;
      const base = window.location.pathname + window.location.search;
      const url = id ? `${base}#${encodeURIComponent(id)}` : base;
      if (url !== base + window.location.hash) window.history.replaceState(window.history.state, "", url);
    }

    function cancel() {
      if (anim) cancelAnimationFrame(anim.raf);
      anim = null;
    }

    function animateTo(index: number, kind: "step" | "snap" = "step") {
      cancel();
      clearTimeout(snapTimer);
      const target = clamp(index, 0, n - 1);
      const from = scroller.scrollTop;
      const to = target * H;
      const distance = Math.abs(to - from) / H;
      if (distance * H < 1) return syncHash(target);
      const duration = config.scroll.stepMs * clamp(Math.sqrt(distance), 0.35, 2.5);
      const ease = kind === "snap" ? easeOutCubic : easeInOutCubic;
      const start = performance.now();
      const a = { target, raf: 0 };
      const step = (now: number) => {
        const x = Math.min(1, (now - start) / duration);
        scroller.scrollTop = from + (to - from) * ease(x);
        render();
        if (x < 1) a.raf = requestAnimationFrame(step);
        else {
          anim = null;
          syncHash(target);
        }
      };
      anim = a;
      a.raf = requestAnimationFrame(step);
    }

    function jumpTo(index: number) {
      cancel();
      scroller.scrollTop = clamp(index, 0, n - 1) * H;
      lastTop = scroller.scrollTop;
      render();
    }

    function settle() {
      if (touching || anim) return;
      const p = progress();
      const nearest = Math.round(p);
      if (Math.abs(p - nearest) * H <= 2) {
        if (Math.abs(p - nearest) * H > 0.5) animateTo(nearest, "snap");
        else syncHash(nearest);
        return;
      }
      animateTo(direction > 0 ? Math.ceil(p) : Math.floor(p), "snap");
    }

    function scheduleSnap() {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(settle, config.scroll.snapDelayMs);
    }

    const onScroll = () => {
      const top = scroller.scrollTop;
      if (!anim && Math.abs(top - lastTop) >= 1) direction = Math.sign(top - lastTop);
      lastTop = top;
      if (!frame) frame = requestAnimationFrame(render);
      if (!anim) scheduleSnap();
    };
    const onWheel = () => cancel();
    const onTouchStart = () => {
      touching = true;
      cancel();
      clearTimeout(snapTimer);
    };
    const onTouchEnd = () => {
      touching = false;
      scheduleSnap();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
      const base = anim ? anim.target : Math.round(progress());
      let to: number;
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          to = base + 1;
          break;
        case "ArrowUp":
        case "PageUp":
          to = base - 1;
          break;
        case " ":
          if (target?.closest("button, summary")) return;
          to = base + (e.shiftKey ? -1 : 1);
          break;
        case "Home":
          to = 0;
          break;
        case "End":
          to = n - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      animateTo(to);
    };

    const resize = new ResizeObserver(() => {
      const next = scroller.clientHeight;
      if (!next || next === H) return;
      const p = scroller.scrollTop / H;
      H = next;
      cancel();
      scroller.scrollTop = (Math.abs(p - Math.round(p)) < 0.01 ? Math.round(p) : p) * H;
      lastTop = scroller.scrollTop;
      render();
      scheduleSnap();
    });

    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("wheel", onWheel, { passive: true });
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    scroller.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    resize.observe(scroller);
    engine.current = { animateTo, jumpTo };
    render();

    return () => {
      cancel();
      clearTimeout(snapTimer);
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchend", onTouchEnd);
      scroller.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      resize.disconnect();
      engine.current = null;
    };
  }, [n, screens]);

  useEffect(() => {
    let id = hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
    }
    const index = id ? findScreen(screens, id) : -1;
    if (index >= 0) engine.current?.jumpTo(index);
    document.documentElement.classList.remove("dl");
    setStarted(true);
  }, [hash, screens]);

  const aboutIndex = screens.findIndex((s) => s.kind === "about");
  const first = screens[0];
  const hasTitleScreen = first?.kind === "image" && first.title != null;
  const titleOnScreen = hasTitleScreen && caption === 0;

  return (
    <div className="gallery" ref={scrollerRef} style={{ "--screens": n } as CSSProperties}>
      <div className="stage">
        {heading && <h1 className="visually-hidden">{heading}</h1>}
        {screens.map((def, i) => (
          <Screen
            key={def.key}
            def={def}
            index={i}
            load={loaded.has(i)}
            priority={i === 0}
            overlayVisible={caption === i}
            register={register}
          />
        ))}
        <Navbar
          onAbout={aboutIndex >= 0 ? () => engine.current?.animateTo(aboutIndex) : undefined}
          onHome={hasTitleScreen ? () => engine.current?.animateTo(0) : undefined}
          showTitle={!titleOnScreen}
          showTop={!atTop}
          onTop={() => engine.current?.animateTo(0)}
        />
      </div>
      <div className="spacer" aria-hidden="true" />
    </div>
  );
}
