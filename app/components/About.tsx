import { Link } from 'react-router';
import { about, recentImages, totals } from '~/lib/content';
import { Picture } from './Picture';

const numberFormat = new Intl.NumberFormat('en-IN');
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

/** "2026-09-14" -> "14 Sep 2026", independent of the visitor's locale. */
function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

const TOTALS = [
  { label: 'Species', value: totals.species },
  { label: 'Locations', value: totals.locations },
  { label: 'Total Photos', value: totals.photos }
];

const RECENT_COUNT = 6;

export function About({ load }: { load: boolean }) {
  const Caption = about.Caption;
  const recent = recentImages(RECENT_COUNT);

  return (
    <div className="about">
      <h2 className="about-heading">About Me</h2>
      <figure className="about-figure">
        <div className="about-photo">
          <Picture
            variants={about.variants}
            alt={about.alt}
            load={load}
            sizes="(max-width: 560px) 60vw, 240px"
          />
        </div>
        <figcaption className="about-caption">
          <Caption />
        </figcaption>
      </figure>

      <div className="about-stats">
        <dl className="about-totals">
          {TOTALS.map(({ label, value }) => (
            <div key={label} className="about-total">
              <dt>{label}</dt>
              <dd>{numberFormat.format(value)}</dd>
            </div>
          ))}
        </dl>

        <h3 className="about-subheading">Recent sightings</h3>
        <ol className="about-sightings">
          {recent.map((image) => (
            <li key={image.id}>
              <Link className="sighting-species" to={`/species/${image.species.slug}`}>
                {image.species.name}
              </Link>
              <Link className="sighting-location" to={`/locations/${image.location.slug}`}>
                {image.location.name}
              </Link>
              {image.date && (
                <time className="sighting-date" dateTime={image.date}>
                  {formatDate(image.date)}
                </time>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
