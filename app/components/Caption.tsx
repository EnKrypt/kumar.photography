import { Link, useLocation } from "react-router";
import type { ImageEntry } from "~/lib/types";
import { PhotoLicense } from "./PhotoLicense";

export function Caption({ image }: { image: ImageEntry }) {
  const { species, location, Caption: Body } = image;
  const here = useLocation().pathname.replace(/\/$/, "");
  const speciesHref = `/species/${species.slug}`;
  const locationHref = `/locations/${location.slug}`;
  return (
    <div className="caption">
      <p className="caption-meta">
        {here === speciesHref ? (
          <span className="caption-species">{species.name}</span>
        ) : (
          <Link className="caption-species" to={speciesHref}>
            {species.name}
          </Link>
        )}
        <span className="caption-sep" aria-hidden="true">
          {" · "}
        </span>
        {here === locationHref ? (
          <span className="caption-location">{location.name}</span>
        ) : (
          <Link className="caption-location" to={locationHref}>
            {location.name}
          </Link>
        )}
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
