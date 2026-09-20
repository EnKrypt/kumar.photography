import { NotFound } from "~/components/NotFound";
import { site } from "~/content/site";

export function meta() {
  return [{ title: `Not found — ${site.name}` }, { name: "robots", content: "noindex" }];
}

export default function NotFoundRoute() {
  return <NotFound />;
}
