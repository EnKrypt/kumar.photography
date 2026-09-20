import type { ImageVariants } from "~/lib/types";

type Props = {
  variants: ImageVariants;
  alt: string;
  load: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

export function Picture({ variants, alt, load, sizes = "100vw", className, priority }: Props) {
  if (!load) return null;
  return (
    <picture>
      <source type="image/webp" srcSet={variants.webp} sizes={sizes} />
      <img
        className={className}
        src={variants.src}
        srcSet={variants.jpeg}
        sizes={sizes}
        alt={alt}
        width={variants.width}
        height={variants.height}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        draggable={false}
      />
    </picture>
  );
}
