import type { ComponentType, ReactNode } from "react";
import type { locations } from "~/content/locations";
import type { species } from "~/content/species";

export type OverlaySide = "left" | "right";
export type SpeciesSlug = keyof typeof species;
export type LocationSlug = keyof typeof locations;

export type ImageVariants = {
  webp: string;
  jpeg: string;
  src: string;
  width: number;
  height: number;
};

export type ImageEntry = {
  id: string;
  alt: string;
  species: { slug: SpeciesSlug; name: string };
  location: { slug: LocationSlug; name: string };
  overlay: OverlaySide;
  Caption: ComponentType | null;
  variants: ImageVariants;
};

export type Landing = {
  title: { node: ReactNode; subtitle?: ReactNode; image: string; overlay: OverlaySide };
  images: string[];
};
