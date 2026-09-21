import { useMemo } from "react";
import { site } from "~/content/site";
import { species } from "~/content/species";
import { CollectionPage, collectionMeta } from "~/lib/collection";
import { imagesForSpecies } from "~/lib/content";
import type { Route } from "./+types/species";

function find(slug: string) {
  const entry = species[slug as keyof typeof species];
  const images = entry ? imagesForSpecies(slug) : [];
  return images.length
    ? { name: entry.name, images, link: { href: `https://ebird.org/species/${entry.ebird}`, label: "About this bird" } }
    : null;
}

export function meta({ params }: Route.MetaArgs) {
  return collectionMeta(find(params.slug), `/species/${params.slug}`, (name) => `Photos of ${name} by ${site.name}.`);
}

export default function SpeciesPage({ params }: Route.ComponentProps) {
  const collection = useMemo(() => find(params.slug), [params.slug]);
  return <CollectionPage key={params.slug} collection={collection} />;
}
