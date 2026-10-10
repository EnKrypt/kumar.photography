import { config } from "~/config";
import { landing } from "~/content/landing";
import channelImage from "~/content/preview.jpg?w=144&format=jpg&as=url";
import { site } from "~/content/site";
import { outings } from "./content";
import type { ImageEntry, Outing } from "./types";

const { perPage, imageWidth } = config.feed;

const host = new URL(site.url).host;
const absolute = (path: string) => site.url + path;
const channelTitle = `${site.name}: Bird Photography`;

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const formatDate = (date: string) => longDate.format(new Date(`${date}T00:00:00Z`));

const asRfc822 = (date: string) => new Date(`${date}T12:00:00+05:30`).toUTCString();

function pickWidth(srcset: string, width: number): string {
  const candidates = srcset
    .split(", ")
    .map((candidate) => {
      const [url, size] = candidate.split(" ");
      return { url, width: Number.parseInt(size, 10) };
    })
    .sort((a, b) => a.width - b.width);
  return (candidates.filter((c) => c.width <= width).pop() ?? candidates[0]).url;
}

const landingRank = new Map(landing.images.map((id, index) => [id, index]));

/**
 * The photo that represents an outing: the landing page's title image if it is
 * from that day, else whichever of its photos the landing page lists first, else
 * the first in gallery order.
 */
function leadImage(outing: Outing): ImageEntry {
  const hero = outing.images.find((image) => image.id === landing.title.image);
  if (hero) return hero;

  let curated: ImageEntry | undefined;
  let bestRank = Infinity;
  for (const image of outing.images) {
    const rank = landingRank.get(image.id);
    if (rank !== undefined && rank < bestRank) {
      bestRank = rank;
      curated = image;
    }
  }
  return curated ?? outing.images[0];
}

function itemXml(outing: Outing): string {
  const lead = leadImage(outing);
  const link = absolute(`/locations/${outing.location.slug}#${lead.id}`);
  const image = absolute(pickWidth(lead.variants.jpeg, imageWidth));
  const height = Math.round((imageWidth * lead.variants.height) / lead.variants.width);
  const counts = `${plural(outing.images.length, "photo")} · ${plural(outing.speciesNames.length, "species", "species")}`;

  const summary = [
    `<p><a href="${escapeXml(link)}"><img src="${escapeXml(image)}" alt="${escapeXml(lead.alt)}" width="${imageWidth}" height="${height}" /></a></p>`,
    `<p>${escapeXml(counts)}</p>`,
    `<p>${escapeXml(outing.speciesNames.join(", "))}</p>`,
    `<p><a href="${escapeXml(link)}">See the photos</a></p>`,
  ].join("");

  const categories = outing.speciesNames.map((name) => `    <category>${escapeXml(name)}</category>`);

  return [
    "  <item>",
    `    <title>${escapeXml(`${formatDate(outing.date)} · ${outing.location.name}`)}</title>`,
    `    <link>${escapeXml(link)}</link>`,
    `    <guid isPermaLink="false">${host}:outing:${outing.date}</guid>`,
    `    <pubDate>${asRfc822(outing.date)}</pubDate>`,
    ...categories,
    `    <media:content url="${escapeXml(image)}" medium="image" type="image/jpeg" width="${imageWidth}" height="${height}" />`,
    `    <description>${escapeXml(summary)}</description>`,
    "  </item>",
  ].join("\n");
}

export const feedPath = (page: number) => (page <= 1 ? "/feed.xml" : `/feed/${page}.xml`);

export const feedPageCount = () => Math.max(1, Math.ceil(outings().length / perPage));

export function renderFeedPage(page: number): string {
  const all = outings();
  const pages = Math.max(1, Math.ceil(all.length / perPage));
  const items = all.slice((page - 1) * perPage, page * perPage);

  const paging: [string, number][] = [
    ["self", page],
    ["first", 1],
    ...(page > 1 ? ([["prev", page - 1]] as [string, number][]) : []),
    ...(page < pages ? ([["next", page + 1]] as [string, number][]) : []),
    ["last", pages],
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>${escapeXml(channelTitle)}</title>
  <link>${site.url}/</link>
  <description>${escapeXml(site.description)}</description>
  <language>${site.lang}</language>
  <copyright>© ${site.name}, CC BY-NC-ND 4.0</copyright>
  <image>
    <url>${absolute(channelImage)}</url>
    <title>${escapeXml(channelTitle)}</title>
    <link>${site.url}/</link>
    <width>144</width>
    <height>81</height>
  </image>
${all[0] ? `  <lastBuildDate>${asRfc822(all[0].date)}</lastBuildDate>\n` : ""}${paging
    .map(([rel, target]) => `  <atom:link rel="${rel}" href="${absolute(feedPath(target))}" type="application/rss+xml" />`)
    .join("\n")}
${items.map(itemXml).join("\n")}
</channel>
</rss>
`;
}
