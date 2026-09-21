import { useState } from "react";
import { Link } from "react-router";
import { landing } from "~/content/landing";
import { locationSearch, speciesSearch } from "~/lib/content";
import { ArrowUpIcon, BirdIcon, PinIcon } from "./icons";
import { Search } from "./Search";

type Props = {
  onAbout?: () => void;
  onHome?: () => void;
  showTitle: boolean;
  showTop: boolean;
  onTop: () => void;
};

export function Navbar({ onAbout, onHome, showTitle, showTop, onTop }: Props) {
  const [expanded, setExpanded] = useState<"species" | "location" | null>(null);
  const hiddenProps = showTitle ? {} : { tabIndex: -1, "aria-hidden": true as const };
  const topHiddenProps = showTop ? {} : { tabIndex: -1, "aria-hidden": true as const };

  return (
    <nav className="navbar" aria-label="Site" data-expanded={expanded ?? undefined}>
      <div className="navbar-title" data-visible={showTitle || undefined}>
        {onHome ? (
          <button type="button" className="nav-title" onClick={onHome} {...hiddenProps}>
            {landing.title.node}
          </button>
        ) : (
          <Link className="nav-title" to="/" {...hiddenProps}>
            {landing.title.node}
          </Link>
        )}
      </div>
      <div className="navbar-end">
        <div className="navbar-links">
          <button
            type="button"
            className="nav-item nav-top"
            onClick={onTop}
            data-visible={showTop || undefined}
            aria-label="Back to top"
            {...topHiddenProps}
          >
            <span className="nav-top-label">Back to top</span>
            <ArrowUpIcon />
          </button>
          {onAbout ? (
            <button type="button" className="nav-item" onClick={onAbout}>
              About
            </button>
          ) : (
            <Link className="nav-item" to="/#about">
              About
            </Link>
          )}
        </div>
        <div className="navbar-search">
          <Search
            id="search-species"
            label="Search by bird"
            items={speciesSearch}
            icon={<BirdIcon />}
            expanded={expanded === "species"}
            onExpandedChange={(open) => setExpanded(open ? "species" : null)}
          />
          <Search
            id="search-location"
            label="Search by location"
            items={locationSearch}
            icon={<PinIcon />}
            expanded={expanded === "location"}
            onExpandedChange={(open) => setExpanded(open ? "location" : null)}
          />
        </div>
      </div>
    </nav>
  );
}
