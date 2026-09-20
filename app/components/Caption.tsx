import { Link } from "react-router";
import type { ImageEntry } from "~/lib/types";
import { PhotoLicense } from "./PhotoLicense";

export function Caption({ image }: { image: ImageEntry }) {
  const { species, location, Caption: Body } = image;
  return (
    <div className="caption">
      <p className="caption-meta">
        <Link className="caption-species" to={`/species/${species.slug}`}>
          {species.name}
        </Link>
        <span className="caption-sep" aria-hidden="true">
          {" · "}
        </span>
        <Link className="caption-location" to={`/locations/${location.slug}`}>
          {location.name}
        </Link>
      </p>
      {Body && (
        <div className="caption-body">
          <Body />
        </div>
      )}
      <PhotoLicense />
    </div>
  );
}
