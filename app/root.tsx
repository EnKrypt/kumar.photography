import type { ReactNode } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts
} from 'react-router';
import type { Route } from './+types/root';
import { config, fontFamily, googleFontsHref } from './config';
import { site } from './content/site';
import { NotFound } from './components/NotFound';
import './app.css';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  { rel: 'stylesheet', href: googleFontsHref },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
];

const configCss = `:root{
--font-family:"${fontFamily}",Georgia,"Times New Roman",serif;
--weight-normal:${config.font.weights.normal};
--weight-bold:${config.font.weights.bold};
--title-size:${config.font.sizePx.title}px;
--caption-size:${config.font.sizePx.caption}px;
--subtitle-size:${config.font.sizePx.subtitle}px;
--fade-ms:${config.captionFadeMs}ms;
}`;

const deepLinkScript = `if(location.hash.length>1){var d=document.documentElement;d.classList.add("dl");setTimeout(function(){d.classList.remove("dl")},3000)}`;

const fontGateScript = `var f=document.documentElement;f.classList.add("fl");var r=function(){f.classList.remove("fl")};(document.fonts?document.fonts.ready:Promise.resolve()).then(r);setTimeout(r,2000)`;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang={site.lang} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#12110f" />
        <style dangerouslySetInnerHTML={{ __html: configCss }} />
        <script dangerouslySetInnerHTML={{ __html: deepLinkScript }} />
        <script dangerouslySetInnerHTML={{ __html: fontGateScript }} />
        <script
          src={site.umami.umamiScriptUrl}
          data-website-id={site.umami.umamiSiteId}
          defer
        ></script>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />;
  const message = error instanceof Error ? error.message : 'Unknown error';
  return (
    <main className="message-page">
      <h1>Something went wrong</h1>
      {import.meta.env.DEV && <pre>{message}</pre>}
      <p>
        <a href="/">Back to the gallery</a>
      </p>
    </main>
  );
}
