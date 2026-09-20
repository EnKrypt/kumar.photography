import { about } from '~/lib/content';
import { PhotoLicense } from './PhotoLicense';
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

const TOTALS: {
  key: 'lifeList' | 'photographed' | 'checklists';
  label: string;
}[] = [
  { key: 'lifeList', label: 'Life list' },
  { key: 'photographed', label: 'Photographed' },
  { key: 'checklists', label: 'Checklists' }
];

export function About({ load }: { load: boolean }) {
  const Caption = about.Caption;

  return (
    <div className="about">
      <h2 className="about-heading">About Me</h2>
      <figure className="about-figure">
        <div className="about-photo">
          <Picture
            variants={about.variants}
            alt={about.alt}
            load={load}
            sizes="(max-width: 760px) 40vw, 320px"
          />
        </div>
        <figcaption className="about-caption">
          <Caption />
          <PhotoLicense />
        </figcaption>
      </figure>

      <div className="about-stats">
        <dl className="about-totals">
          {TOTALS.map(({ key, label }) => (
            <div key={key} className="about-total">
              <dt>{label}</dt>
              <dd>
                {about.stats
                  ? numberFormat.format(about.stats.totals[key])
                  : '—'}
              </dd>
            </div>
          ))}
        </dl>

        <h3 className="about-subheading">Recent sightings</h3>
        <ol className="about-sightings">
          {about.stats
            ? about.stats.recentSightings.slice(0, 8).map((s, i) => (
                <li key={`${s.species}-${s.date}-${i}`}>
                  <span className="sighting-species">{s.species}</span>
                  <span className="sighting-location">{s.location}</span>
                  <time className="sighting-date" dateTime={s.date}>
                    {formatDate(s.date)}
                  </time>
                </li>
              ))
            : Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="sighting-placeholder" />
              ))}
        </ol>
      </div>
    </div>
  );
}
