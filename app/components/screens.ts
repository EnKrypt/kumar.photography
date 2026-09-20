import type { ReactNode } from "react";
import type { ImageEntry, OverlaySide } from "~/lib/types";

export type ScreenDef =
  | {
      kind: "image";
      key: string;
      image: ImageEntry;
      title?: ReactNode;
      subtitle?: ReactNode;
      side: OverlaySide;
      hashId: string | null;
    }
  | { kind: "about"; key: "about"; hashId: "about" };

export const imageScreen = (image: ImageEntry): ScreenDef => ({
  kind: "image",
  key: image.id,
  image,
  side: image.overlay,
  hashId: image.id,
});
