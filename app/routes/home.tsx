import { Gallery } from "~/components/Gallery";
import { imageScreen, type ScreenDef } from "~/components/screens";
import { landing } from "~/content/landing";
import { site } from "~/content/site";
import { getImage } from "~/lib/content";
import { pageMeta } from "~/lib/seo";

const titleImage = getImage(landing.title.image, "landing.tsx title.image");

const screens: ScreenDef[] = [
  {
    kind: "image",
    key: "title",
    image: titleImage,
    title: landing.title.node,
    subtitle: landing.title.subtitle,
    side: landing.title.overlay,
    hashId: null,
  },
  ...landing.images.map((id) => imageScreen(getImage(id, "landing.tsx images"))),
  { kind: "about", key: "about", hashId: "about" },
];

export function meta() {
  return pageMeta({ title: `${site.name}: Bird Photography`, path: "/", image: titleImage });
}

export default function Home() {
  return <Gallery screens={screens} />;
}
