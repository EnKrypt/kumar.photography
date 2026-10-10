import type { Config } from "@react-router/dev/config";
import { copyFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { config } from "./app/config.ts";
import { parseFrontmatter } from "./app/frontmatter/parse-frontmatter.ts";

function contentPaths(): string[] {
  const dir = "app/content/images";
  const species = new Set<string>();
  const locations = new Set<string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mdx"))) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(`${dir}/${file}`, "utf8"));
    const fm = match ? parseFrontmatter(match[1], file) : {};
    if (typeof fm?.species === "string") species.add(fm.species);
    if (typeof fm?.location === "string") locations.add(fm.location);
  }
  return [
    ...[...species].map((slug) => `/species/${slug}`),
    ...[...locations].map((slug) => `/locations/${slug}`),
  ];
}

function feedPaths(): string[] {
  const dates = new Set<string>();
  for (const file of readdirSync("app/content/images")) {
    const date = /^(\d{4}-\d{2}-\d{2}).*\.mdx$/.exec(file)?.[1];
    if (date) dates.add(date);
  }
  const pages = Math.max(1, Math.ceil(dates.size / config.feed.perPage));
  return Array.from({ length: pages }, (_, i) => (i === 0 ? "/feed.xml" : `/feed/${i + 1}.xml`));
}

export default {
  ssr: false,
  prerender: () => ["/", "/sitemap.xml", "/robots.txt", ...feedPaths(), ...contentPaths()],
  buildEnd({ reactRouterConfig }) {
    const client = path.join(reactRouterConfig.buildDirectory, "client");
    const fallback = path.join(client, "__spa-fallback.html");
    if (existsSync(fallback)) copyFileSync(fallback, path.join(client, "404.html"));
  },
} satisfies Config;
