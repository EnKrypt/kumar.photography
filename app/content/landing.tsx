import type { Landing } from "~/lib/types";

export const landing: Landing = {
  title: {
    node: (
      <>
        <span className="title-first">arvind</span> <span className="title-last">kumar</span>
      </>
    ),
    subtitle: <>bird photography</>,
    image: "2026-09-06-pied-bushchat",
    overlay: "right",
  },
  images: [
    "2026-08-09-white-throated-kingfisher",
    "2026-08-09-little-egret",
    "2026-08-09-purple-heron",
    "2026-08-09-oriental-darter",
    "2026-08-09-eurasian-coot-1"
  ],
};
