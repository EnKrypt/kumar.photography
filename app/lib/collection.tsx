import { useMemo } from "react";
import { Gallery } from "~/components/Gallery";
import { NotFound } from "~/components/NotFound";
import { imageScreen } from "~/components/screens";
import { site } from "~/content/site";
import { pageMeta } from "./seo";
import type { ImageEntry } from "./types";

type Collection = { name: string; images: ImageEntry[] } | null;

export function collectionMeta(collection: Collection, path: string, describe: (name: string) => string) {
  if (!collection) return [{ title: `Not found — ${site.name}` }, { name: "robots", content: "noindex" }];
  return pageMeta({
    title: `${collection.name} — ${site.name}`,
    description: describe(collection.name),
    path,
  });
}

export function CollectionPage({ collection }: { collection: Collection }) {
  const screens = useMemo(() => collection?.images.map(imageScreen) ?? [], [collection]);
  if (!collection || screens.length === 0) return <NotFound />;
  return <Gallery screens={screens} heading={collection.name} />;
}
