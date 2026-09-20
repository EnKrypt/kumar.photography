import type { ComponentType } from "react";
import * as aboutModule from "~/content/about.mdx";
import * as stats from "~/content/stats.json";
import { landing } from "~/content/landing";
import { locations } from "~/content/locations";
import { site } from "~/content/site";
import { species } from "~/content/species";
import type { ImageEntry, ImageVariants, LocationSlug, OverlaySide, SpeciesSlug } from "./types";

type Picture = { sources: Record<string, string>; img: { src: string; w: number; h: number } };
type MdxModule = { default: ComponentType; frontmatter?: Record<string, unknown>; text?: string };

const pictures = import.meta.glob<Picture>("../content/images/*.{jpg,jpeg,png,webp,avif,tif,tiff}", {
  eager: true,
  import: "default",
  query: "?w=480;960;1440;1920;2560;3840&format=webp;jpg&allowUpscale=true&as=picture",
});
const metadata = import.meta.glob<MdxModule>("../content/images/*.mdx", { eager: true });

const aboutPictures = import.meta.glob<Picture>("../content/*.{jpg,jpeg,png,webp,avif}", {
  eager: true,
  import: "default",
  query: "?w=320;480;640;960;1280&format=webp;jpg&allowUpscale=true&as=picture",
});

const basename = (file: string) => file.slice(file.lastIndexOf("/") + 1);
const stripExt = (file: string) => basename(file).replace(/\.[^.]+$/, "");

function toVariants(pic: Picture, file: string): ImageVariants {
  const { webp, jpeg } = pic.sources;
  if (!webp || !jpeg) throw new Error(`${file}: expected WebP and JPEG variants`);
  const entries = jpeg.split(", ").map((s) => s.split(" "));
  const fallback = entries.find(([, w]) => w === "1920w") ?? entries[entries.length - 1];
  return { webp, jpeg, src: fallback[0], width: pic.img.w, height: pic.img.h };
}

function fail(file: string, message: string): never {
  const error = new Error(`[content] ${file}: ${message}`);
  console.error(`\n${error.message}\n`);
  throw error;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const known = (list: object) => Object.keys(list).map((k) => JSON.stringify(k)).join(", ");

for (const [file, list] of [["species.ts", species], ["locations.ts", locations]] as const) {
  for (const key of Object.keys(list)) {
    if (!SLUG.test(key)) {
      const suggestion = key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      fail(file, `key ${JSON.stringify(key)} is not a URL slug; use lowercase letters, digits and hyphens, e.g. "${suggestion}"`);
    }
  }
}

function buildImages(): Map<string, ImageEntry> {
  const pictureById = new Map<string, [string, Picture]>();
  for (const [file, pic] of Object.entries(pictures)) {
    const id = stripExt(file);
    if (pictureById.has(id)) fail(file, `duplicate image ID "${id}" (IDs are filenames without extension)`);
    pictureById.set(id, [file, pic]);
  }

  const result = new Map<string, ImageEntry>();
  for (const [file, mod] of Object.entries(metadata)) {
    const id = stripExt(file);
    const name = basename(file);
    const pic = pictureById.get(id);
    if (!pic) fail(name, `no image file named "${id}.<ext>" next to it`);
    const fm = mod.frontmatter ?? {};

    const sp = fm.species;
    if (typeof sp !== "string" || !(sp in species))
      fail(name, `\`species\` must be a slug from app/content/species.ts, got ${JSON.stringify(sp)} (defined: ${known(species)})`);

    const loc = fm.location;
    if (typeof loc !== "string" || !(loc in locations))
      fail(name, `\`location\` must be a slug from app/content/locations.ts, got ${JSON.stringify(loc)} (defined: ${known(locations)})`);

    const overlay = fm.overlay;
    if (overlay !== "left" && overlay !== "right")
      fail(name, `\`overlay\` must be "left" or "right", got ${JSON.stringify(overlay)}`);

    const variants = toVariants(pic[1], name);
    if (Math.abs(variants.width / variants.height - 16 / 9) > 0.01)
      fail(basename(pic[0]), `image must be 16:9, got ${variants.width}x${variants.height}`);

    const speciesName = species[sp as SpeciesSlug].name;
    const locationName = locations[loc as LocationSlug].name;
    const caption = mod.text?.trim() ?? "";

    result.set(id, {
      id,
      alt: caption || `${speciesName} at ${locationName}`,
      species: { slug: sp as SpeciesSlug, name: speciesName },
      location: { slug: loc as LocationSlug, name: locationName },
      overlay: overlay as OverlaySide,
      Caption: caption ? mod.default : null,
      variants,
    });
  }

  for (const [id, [file]] of pictureById) {
    if (!result.has(id)) fail(basename(file), `missing metadata file "${id}.mdx"`);
  }
  return result;
}

export const images = buildImages();

export function getImage(id: string, context: string): ImageEntry {
  const image = images.get(id);
  if (!image) fail(context, `unknown image ID "${id}"`);
  return image;
}

getImage(landing.title.image, "landing.tsx title.image");
landing.images.forEach((id) => getImage(id, "landing.tsx images"));

const newestFirst = (a: ImageEntry, b: ImageEntry) =>
  b.id.localeCompare(a.id, "en", { numeric: true });

export function imagesForSpecies(slug: string): ImageEntry[] {
  return [...images.values()].filter((i) => i.species.slug === slug).sort(newestFirst);
}

export function imagesForLocation(slug: string): ImageEntry[] {
  return [...images.values()].filter((i) => i.location.slug === slug).sort(newestFirst);
}

export type SearchItem = { slug: string; name: string; href: string };

const usedSpecies = new Set<string>([...images.values()].map((i) => i.species.slug));
const usedLocations = new Set<string>([...images.values()].map((i) => i.location.slug));

export const speciesSearch: SearchItem[] = Object.entries(species)
  .filter(([slug]) => usedSpecies.has(slug))
  .map(([slug, { name }]) => ({ slug, name, href: `/species/${slug}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const locationSearch: SearchItem[] = Object.entries(locations)
  .filter(([slug]) => usedLocations.has(slug))
  .map(([slug, { name }]) => ({ slug, name, href: `/locations/${slug}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

function buildAbout() {
  const fm = aboutModule.frontmatter ?? {};
  const photo = fm.photo;
  if (typeof photo !== "string") fail("about.mdx", "`photo` (path to the about section photo) is required");
  const key = "../content/" + photo.replace(/^\.\//, "");
  const pic = aboutPictures[key];
  if (!pic) fail("about.mdx", `photo "${photo}" not found next to about.mdx`);
  return {
    Caption: aboutModule.default,
    alt: `Portrait of ${site.name}`,
    variants: toVariants(pic, "about.mdx photo"),
    stats,
  };
}

export const about = buildAbout();
