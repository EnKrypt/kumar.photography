import { renderFeedPage } from "~/lib/feed";

export function loader() {
  return new Response(renderFeedPage(1), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
