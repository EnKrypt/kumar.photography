import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { Navbar } from './Navbar';
import { createScrollEngine, type Engine, type EngineState } from './scroll-engine';
import { Screen, type LayerElements } from './Screen';
import type { ScreenDef } from './screens';

type Props = {
  screens: ScreenDef[];
  heading?: string;
};

function withNeighbours(prev: ReadonlySet<number>, index: number, n: number): ReadonlySet<number> {
  const add = [];
  for (let i = Math.max(0, index - 2); i <= Math.min(n - 1, index + 2); i++) if (!prev.has(i)) add.push(i);
  return add.length ? new Set([...prev, ...add]) : prev;
}

function findScreen(screens: ScreenDef[], id: string): number {
  const exact = screens.findIndex((s) => s.hashId === id);
  if (exact >= 0) return exact;
  return screens.findIndex((s) => s.kind === 'image' && s.image.id === id);
}

export function Gallery({ screens, heading }: Props) {
  const n = screens.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const layers = useRef<(LayerElements | null)[]>([]);
  const engine = useRef<Engine | null>(null);
  const { hash } = useLocation();

  const [view, setView] = useState<EngineState>({ index: 0, caption: 0, atTop: true });
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) setLoaded((prev) => withNeighbours(prev, view.index, n));
  }, [started, view.index, n]);

  const register = useCallback((index: number, elements: LayerElements | null) => {
    layers.current[index] = elements;
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;
    const syncHash = (index: number) => {
      const id = screens[index]?.hashId;
      const base = window.location.pathname + window.location.search;
      const url = id ? `${base}#${encodeURIComponent(id)}` : base;
      if (url !== base + window.location.hash) {
        window.history.replaceState(window.history.state, '', url);
      }
    };

    const created = createScrollEngine(rootRef.current, layers.current, n, setView, syncHash);
    engine.current = created;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")) return;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          created.step(1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          created.step(-1);
          break;
        case ' ':
          if (target?.closest('button, summary, a')) return;
          created.step(e.shiftKey ? -1 : 1);
          break;
        case 'Home':
          created.goTo(0);
          break;
        case 'End':
          created.goTo(n - 1);
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      created.destroy();
      engine.current = null;
    };
  }, [n, screens]);

  useEffect(() => {
    let id = hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {}
    const index = id ? findScreen(screens, id) : -1;
    if (index >= 0) engine.current?.jumpTo(index);
    document.documentElement.classList.remove('dl');
    setStarted(true);
  }, [hash, screens]);

  const aboutIndex = screens.findIndex((s) => s.kind === 'about');
  const first = screens[0];
  const hasTitleScreen = first?.kind === 'image' && first.title != null;
  const titleOnScreen = hasTitleScreen && view.caption === 0;

  return (
    <div className="gallery" ref={rootRef}>
      <div className="stage">
        {heading && <h1 className="visually-hidden">{heading}</h1>}
        {screens.map((def, i) => (
          <Screen
            key={def.key}
            def={def}
            index={i}
            load={loaded.has(i)}
            priority={i === 0}
            overlayVisible={view.caption === i}
            register={register}
          />
        ))}
        <Navbar
          onAbout={aboutIndex >= 0 ? () => engine.current?.goTo(aboutIndex) : undefined}
          onHome={hasTitleScreen ? () => engine.current?.goTo(0) : undefined}
          showTitle={!titleOnScreen}
          showTop={!view.atTop}
          onTop={() => engine.current?.goTo(0)}
        />
      </div>
    </div>
  );
}
