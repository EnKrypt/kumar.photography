import type { MetaDescriptor } from "react-router";
import previewImage from "~/content/preview.jpg?w=1920&format=jpg&as=url";
import { site } from "~/content/site";

const absolute = (path: string) => (path.startsWith("http") ? path : site.url + path);

export function pageMeta({
  title,
  description = site.description,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}): MetaDescriptor[] {
  const url = absolute(path);
  const preview = absolute(previewImage);
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
    { property: "og:image", content: preview },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: "1920" },
    { property: "og:image:height", content: "1080" },
    { property: "og:image:alt", content: site.description },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: preview },
    { name: "twitter:image:alt", content: site.description },
  ];
  if (site.twitter) tags.push({ name: "twitter:site", content: site.twitter });
  return tags;
}
