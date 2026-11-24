import type { Config } from "@react-router/dev/config";
import { copyFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { config } from "./app/config.ts";
import { parseFrontmatter } from "./app/frontmatter/parse-frontmatter.ts";

/**
 * We need to render the feed pages, then one page per species and location.
 * This runs outside Vite, so it cannot reuse app/lib/content.ts and has to re-derive
 * what an outing is: a collection of images from one date at one location, the same key
 * `outings()` groups by. Keep the two in step.
 */
function contentPaths(): string[] {
  const dir = "app/content/images";
  const species = new Set<string>();
  const locations = new Set<string>();
  const outings = new Set<string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(`${dir}/${file}`, "utf8"));
    const fm = match ? parseFrontmatter(match[1], file) : {};
    if (typeof fm?.species === "string") species.add(fm.species);
    if (typeof fm?.location === "string") locations.add(fm.location);
    const date = /^(\d{4}-\d{2}-\d{2})/.exec(file)?.[1];
    if (date && typeof fm?.location === "string") outings.add(`${date} ${fm.location}`);
  }
  const pages = Math.max(1, Math.ceil(outings.size / config.feed.perPage));
  return [
    ...Array.from({ length: pages }, (_, i) => (i === 0 ? "/feed.xml" : `/feed/${i + 1}.xml`)),
    ...[...species].map((slug) => `/species/${slug}`),
    ...[...locations].map((slug) => `/locations/${slug}`),
  ];
}

export default {
  ssr: false,
  prerender: () => ["/", "/sitemap.xml", "/robots.txt", ...contentPaths()],
  buildEnd({ reactRouterConfig }) {
    const client = path.join(reactRouterConfig.buildDirectory, "client");
    const fallback = path.join(client, "__spa-fallback.html");
    if (existsSync(fallback)) copyFileSync(fallback, path.join(client, "404.html"));
  },
} satisfies Config;
