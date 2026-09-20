import type { MetaDescriptor } from "react-router";
import { site } from "~/content/site";
import type { ImageEntry } from "./types";

const absolute = (path: string) => (path.startsWith("http") ? path : site.url + path);

export function pageMeta({
  title,
  description = site.description,
  path,
  image,
}: {
  title: string;
  description?: string;
  path: string;
  image?: ImageEntry;
}): MetaDescriptor[] {
  const url = absolute(path);
  const tags: MetaDescriptor[] = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: site.name },
    { property: "og:locale", content: site.locale },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (site.twitter) tags.push({ name: "twitter:site", content: site.twitter });
  if (image) {
    const src = absolute(image.variants.src);
    tags.push(
      { property: "og:image", content: src },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1920" },
      { property: "og:image:height", content: "1080" },
      { property: "og:image:alt", content: image.alt },
      { name: "twitter:image", content: src },
      { name: "twitter:image:alt", content: image.alt },
    );
  }
  return tags;
}
