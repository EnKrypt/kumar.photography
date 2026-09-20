import { config } from '~/config';
import type { LayerElements } from './Screen';

export type EngineState = { index: number; caption: number | null; atTop: boolean };

export type Engine = {
  goTo: (index: number) => void;
  step: (delta: number) => void;
  jumpTo: (index: number) => void;
  destroy: () => void;
};

type Gesture = {
  startY: number;
  lastY: number;
  direction: number;
  scroller: HTMLElement | null;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

const DEAD_ZONE = 0.02;

export function createScrollEngine(
  root: HTMLElement,
  layers: (LayerElements | null)[],
  count: number,
  onState: (state: EngineState) => void,
  onSettle: (index: number) => void
): Engine {
  const { outgoingLag, imageDepth, seamBlend, captionWindow, backdropOpacityStart } =
    config.transition;
  const { stepMs, snapDelayMs } = config.scroll;

  let height = root.clientHeight || 1;
  let position = 0;
  let anchor = 0;
  let frame = 0;
  let animation: { target: number; raf: number } | null = null;
  let gesture: Gesture | null = null;
  let wheelTimer: ReturnType<typeof setTimeout> | undefined;
  const visible = new Set<number>([0]);
  const state: EngineState = { index: 0, caption: 0, atTop: true };

  function place(i: number, y: number, opacity: number, feather: number, backdrop: number) {
    const el = layers[i];
    if (!el) return;
    const s = el.root.style;
    s.visibility = 'visible';
    s.willChange = 'transform, opacity';
    s.transform = y ? `translate3d(0, ${y}px, 0)` : '';
    s.opacity = opacity < 1 ? String(opacity) : '';
    const mask = feather >= 0.5 ? `linear-gradient(to bottom, transparent 0, #000 ${feather}px)` : '';
    s.maskImage = mask;
    s.setProperty('-webkit-mask-image', mask);
    if (el.photo) {
      el.photo.style.willChange = 'transform';
      el.photo.style.transform = y ? `translate3d(0, ${y * imageDepth}px, 0)` : '';
    }
    if (el.backdrop) {
      el.backdrop.style.opacity = backdrop < 1 ? String(backdrop) : '';
      el.backdrop.style.transform = y < 0 ? `translate3d(0, ${-y}px, 0)` : '';
    }
  }

  function hide(i: number) {
    const el = layers[i];
    if (!el) return;
    el.root.style.visibility = 'hidden';
    el.root.style.willChange = '';
    if (el.photo) el.photo.style.willChange = '';
    if (el.backdrop) {
      el.backdrop.style.opacity = '';
      el.backdrop.style.transform = '';
    }
  }

  function render() {
    frame = 0;
    const p = position;
    const k = Math.min(Math.floor(p), count - 1);
    const t = p - k;

    const show = new Map<number, [y: number, opacity: number, feather: number, backdrop: number]>();
    show.set(k, [-t * height * (1 - outgoingLag), 1 - t, 0, 1]);
    if (t > 0 && k + 1 < count) {
      const backdrop = backdropOpacityStart + (1 - backdropOpacityStart) * t;
      show.set(k + 1, [(1 - t) * height, 1, seamBlend * height * (1 - t), backdrop]);
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

    const eps = 1.5 / height;
    const arriving = Math.ceil(p - eps);
    const caption = arriving - p <= captionWindow + eps ? arriving : null;
    const index = Math.round(p);
    const atTop = p < eps;
    if (index !== state.index || caption !== state.caption || atTop !== state.atTop) {
      state.index = index;
      state.caption = caption;
      state.atTop = atTop;
      onState({ ...state });
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function setPosition(next: number) {
    position = clamp(next, 0, count - 1);
    schedule();
  }

  function stopAnimation() {
    if (animation) cancelAnimationFrame(animation.raf);
    animation = null;
  }

  function animateTo(index: number, kind: 'gesture' | 'jump') {
    stopAnimation();
    const to = clamp(index, 0, count - 1);
    const from = position;
    const distance = Math.abs(to - from);
    if (distance < 0.001) {
      setPosition(to);
      anchor = to;
      onSettle(to);
      return;
    }
    const duration =
      kind === 'gesture'
        ? clamp(stepMs * distance, 140, stepMs)
        : stepMs * clamp(Math.sqrt(distance), 0.35, 2.5);
    const ease = kind === 'gesture' ? easeOutCubic : easeInOutCubic;
    const start = performance.now();
    const current = { target: to, raf: 0 };
    const tick = (now: number) => {
      const x = Math.min(1, (now - start) / duration);
      position = from + (to - from) * ease(x);
      render();
      if (x < 1) {
        current.raf = requestAnimationFrame(tick);
      } else {
        animation = null;
        anchor = to;
        onSettle(to);
      }
    };
    animation = current;
    current.raf = requestAnimationFrame(tick);
  }

  function commit(direction: number) {
    const nearest = Math.round(position);
    if (direction === 0 || Math.abs(position - nearest) < DEAD_ZONE) {
      animateTo(nearest, 'gesture');
      return;
    }
    animateTo(direction > 0 ? Math.ceil(position) : Math.floor(position), 'gesture');
  }

  function scrollableAncestor(target: EventTarget | null): HTMLElement | null {
    let el = target instanceof Element ? target : null;
    while (el && el !== root) {
      if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 1) {
        const overflow = getComputedStyle(el).overflowY;
        if (overflow === 'auto' || overflow === 'scroll') return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function canScrollFurther(el: HTMLElement, direction: number) {
    if (direction > 0) return el.scrollTop < el.scrollHeight - el.clientHeight - 1;
    if (direction < 0) return el.scrollTop > 1;
    return false;
  }

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      gesture = null;
      return;
    }
    stopAnimation();
    anchor = Math.round(position);
    const y = e.touches[0].clientY;
    gesture = { startY: y, lastY: y, direction: 0, scroller: scrollableAncestor(e.target) };
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!gesture || e.touches.length !== 1) return;
    const y = e.touches[0].clientY;
    const moved = gesture.lastY - y;
    gesture.lastY = y;
    if (Math.abs(moved) > 0.5) gesture.direction = Math.sign(moved);
    if (gesture.scroller && canScrollFurther(gesture.scroller, gesture.direction)) {
      gesture.startY = y;
      return;
    }
    setPosition(anchor + clamp((gesture.startY - y) / height, -1, 1));
  };

  const onTouchEnd = () => {
    if (!gesture) return;
    const direction = gesture.direction || Math.sign(position - anchor);
    gesture = null;
    commit(direction);
  };

  const onWheel = (e: WheelEvent) => {
    const direction = Math.sign(e.deltaY);
    const scroller = scrollableAncestor(e.target);
    if (scroller && canScrollFurther(scroller, direction)) return;
    e.preventDefault();
    if (!direction) return;
    const midGesture = wheelTimer !== undefined;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      wheelTimer = undefined;
    }, snapDelayMs);
    if (midGesture || animation) return;
    animateTo(Math.round(position) + direction, 'jump');
  };

  const resize = new ResizeObserver(() => {
    const next = root.clientHeight;
    if (!next || next === height) return;
    height = next;
    render();
  });

  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchmove', onTouchMove, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });
  root.addEventListener('touchcancel', onTouchEnd, { passive: true });
  root.addEventListener('wheel', onWheel, { passive: false });
  resize.observe(root);
  render();

  return {
    goTo(index) {
      gesture = null;
      animateTo(index, 'jump');
    },
    step(delta) {
      gesture = null;
      const base = animation ? animation.target : Math.round(position);
      animateTo(base + delta, 'jump');
    },
    jumpTo(index) {
      stopAnimation();
      gesture = null;
      anchor = clamp(index, 0, count - 1);
      setPosition(anchor);
    },
    destroy() {
      stopAnimation();
      clearTimeout(wheelTimer);
      cancelAnimationFrame(frame);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
      root.removeEventListener('touchcancel', onTouchEnd);
      root.removeEventListener('wheel', onWheel);
      resize.disconnect();
    }
  };
}
