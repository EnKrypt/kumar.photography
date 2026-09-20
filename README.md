# kumar.photography

My bird photography website. Go to https://arvind.io for my blog.

This is a statically generated site. Created using React Router 8 and Vite 8.

## Usage

If you want to generate a build for this website for whatever reason, you'll need to first sort out everything within the `app/content` folder:

1. Edit the contents of `app/content/site.ts` with accurate information for your use case, and to avoid impersonating me (that's a big no-no).
2. Populate `app/content/images/` and add images of your own. This repo does not contain the images that are used by https://kumar.photography.
3. Match `app/content/images/*.mdx` to match the same file names as the images with appropriate content.
4. Edit the contents of `app/content/species.ts` and `app/content/locations.ts` with information pertaining to your images.
5. Add `app/content/dp.jpg` with your display picture.
6. Finally modify `app/content/landing.tsx` and `app/content/about.mdx` with accurate information for your use case, and to avoid impersonating me.

If you don't populate the images, or leave any broken references to file names, species or location slugs, the build will fail.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in build/client
npm run preview    # serves build/client like a static host, http://localhost:4173
npm run typecheck
```

## Layout

| Path | What is there |
| --- | --- |
| `app/content/` | Everything editable: photographs, their `.mdx` metadata, the shared species and location lists, page layout configurations, website metadata. |
| `app/components/Gallery.tsx` | The scroll engine with the transition formulas. |
| `app/config.ts` | Transition, fade, snapping and typography tunables. |
| `app/lib/content.ts` | Loads and validates all content at build time. |
| `app/frontmatter/` | The MDX frontmatter plugin and its parser. |
| `scripts/serve.mjs` | Static server for `npm run preview`, since `vite preview` handles 404 pages differently. |

## Content

Each photograph is `images/<id>.jpg` plus `images/<id>.mdx`, where the filename is the image
ID. Species and location pages sort by that ID, newest first, so it must start with a sortable
date. Frontmatter holds the metadata; the MDX body is an optional caption, for photographs
with something worth pointing out:

```mdx
---
species: little-egret     # slug from species.ts
location: saul-kere       # slug from locations.ts
overlay: left             # overlay side: left or right
---

A **Little Egret** holding a small fish in its beak
```

Frontmatter is one `key: value` per line; nesting, lists and block values are rejected. Add
new slugs to `species.ts` / `locations.ts`, and list an ID in `landing.tsx` to put it on the
landing page. Pages are generated for every slug at least one photograph uses.

Content mistakes fail the build with a message naming the file, for example a photo that is
not 16:9, a slug that does not exist, or an `.mdx` with no photo beside it.

## Hosting

`build/client` is a plain static folder and can be directly uploaded or hosted on a provider.

## License

Code is MIT ([LICENSE](LICENSE)). The photographs are CC BY-NC-ND 4.0 ([LICENSE-PHOTOS.md](LICENSE-PHOTOS.md)) and are not tracked in this repo.
