import { useMemo } from "react";
import { locations } from "~/content/locations";
import { site } from "~/content/site";
import { CollectionPage, collectionMeta } from "~/lib/collection";
import { imagesForLocation } from "~/lib/content";
import type { Route } from "./+types/location";

function find(slug: string) {
  const entry = locations[slug as keyof typeof locations];
  const images = entry ? imagesForLocation(slug) : [];
  return images.length ? { name: entry.name, images } : null;
}

export function meta({ params }: Route.MetaArgs) {
  return collectionMeta(find(params.slug), `/locations/${params.slug}`, (name) => `Bird photos at ${name} by ${site.name}.`);
}

export default function LocationPage({ params }: Route.ComponentProps) {
  const collection = useMemo(() => find(params.slug), [params.slug]);
  return <CollectionPage key={params.slug} collection={collection} />;
}
