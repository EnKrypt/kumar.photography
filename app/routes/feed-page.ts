import { feedPageCount, renderFeedPage } from "~/lib/feed";
import type { Route } from "./+types/feed-page";

export function loader({ params }: Route.LoaderArgs) {
  const page = Number(params.page);
  if (!Number.isInteger(page) || page < 2 || page > feedPageCount()) {
    return new Response("Not found\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(renderFeedPage(page), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
