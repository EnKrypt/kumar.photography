import { site } from "~/content/site";

export function PhotoLicense() {
  return (
    <p className="photo-license">
      © {site.name} ·{" "}
      <a
        href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
        rel="license noopener noreferrer"
        target="_blank"
      >
        CC BY-NC-ND 4.0
      </a>
    </p>
  );
}
