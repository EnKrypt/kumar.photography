import { site } from "~/content/site";
import { locationSearch, speciesSearch } from "~/lib/content";

export function loader() {
  const paths = ["/", ...speciesSearch.map((s) => s.href), ...locationSearch.map((l) => l.href)];
  const urls = paths.map((p) => `  <url><loc>${site.url}${p}</loc></url>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
