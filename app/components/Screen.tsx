import { memo, useCallback, useRef } from "react";
import { About } from "./About";
import { Caption } from "./Caption";
import { Picture } from "./Picture";
import type { ScreenDef } from "./screens";

export type LayerElements = { root: HTMLElement; photo: HTMLElement | null; backdrop: HTMLElement | null };

type Props = {
  def: ScreenDef;
  index: number;
  load: boolean;
  priority: boolean;
  overlayVisible: boolean;
  register: (index: number, elements: LayerElements | null) => void;
};

export const Screen = memo(function Screen({ def, index, load, priority, overlayVisible, register }: Props) {
  const photoRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const rootRef = useCallback(
    (root: HTMLElement | null) =>
      register(index, root ? { root, photo: photoRef.current, backdrop: backdropRef.current } : null),
    [index, register],
  );
  const style = { zIndex: index + 1, visibility: index === 0 ? "visible" : undefined } as const;

  if (def.kind === "about") {
    return (
      <section ref={rootRef} className="screen screen--about" style={style} aria-label="About">
        <About load={load} />
      </section>
    );
  }

  const { image, side, title, subtitle } = def;
  return (
    <section ref={rootRef} className="screen" style={style} data-image-id={image.id}>
      <div className="backdrop" ref={backdropRef} aria-hidden="true">
        <Picture variants={image.variants} alt="" load={load} priority={priority} />
      </div>
      <div className="photo" ref={photoRef}>
        <Picture variants={image.variants} alt={image.alt} load={load} priority={priority} />
      </div>
      <div className={`scrim scrim--${side}${title ? " scrim--title" : ""}`} data-visible={overlayVisible || undefined} aria-hidden="true" />
      <div className={`overlay overlay--${side}`} data-visible={overlayVisible || undefined}>
        {title ? (
          <hgroup className="title-block">
            <h1 className="title">{title}</h1>
            {subtitle && <p className="subtitle">{subtitle}</p>}
          </hgroup>
        ) : (
          <Caption image={image} />
        )}
      </div>
    </section>
  );
});
