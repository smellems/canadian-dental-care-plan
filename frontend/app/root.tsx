import { Suspense, useContext } from 'react';

import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { getToast } from 'remix-toast';

import SessionTimeout from './components/session-timeout';
import { Toaster } from './components/toaster';
// import cdcpStyleSheet from '~/cdcp.css';
import { ClientEnv } from '~/components/client-env';
import { NonceContext } from '~/components/nonce-context';
import fontNotoSansStyleSheet from '~/fonts/noto-sans.css';
import tailwindStyleSheet from '~/tailwind.css';
import { readBuildInfo } from '~/utils/build-info.server';
import { getPublicEnv } from '~/utils/env.server';
import { useDocumentTitleI18nKey, useI18nNamespaces, usePageTitleI18nKey } from '~/utils/route-utils';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: fontNotoSansStyleSheet },
  { rel: 'stylesheet', href: tailwindStyleSheet },
  // { rel: 'stylesheet', href: cdcpStyleSheet },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const buildInfo = readBuildInfo('build-info.json');
  const publicEnv = getPublicEnv();
  const { toast, headers } = await getToast(request);

  return json(
    {
      buildInfo: buildInfo ?? {
        buildDate: '2000-01-01T00:00:00Z',
        buildId: '0000',
        buildRevision: '00000000',
        buildVersion: '0.0.0-00000000-0000',
      },
      env: publicEnv,
      toast,
    },
    {
      headers,
    },
  );
}

/**
 * Custom hook to get the translated document title based on internationalization keys.
 *
 * @function
 * @returns {string|undefined} - Translated document title or undefined if no internationalization key is provided.
 *
 * @description
 * This hook initializes the translation function and retrieves internationalization keys for the
 * document title and page title. It returns the translated document title or undefined if no key is provided.
 */
function useDocumentTitle() {
  const ns = useI18nNamespaces();
  const { t } = useTranslation(ns);
  const documentTitleI18nKey = useDocumentTitleI18nKey();
  const pageTitleI18nKey = usePageTitleI18nKey();
  const i18nKey = documentTitleI18nKey ?? pageTitleI18nKey;
  return i18nKey && (t(i18nKey) as string); // as string otherwise it's typeof any
}

export default function App() {
  const { nonce } = useContext(NonceContext);
  const { env, toast } = useLoaderData<typeof loader>();
  const ns = useI18nNamespaces();
  const { i18n } = useTranslation(ns);
  const documentTitle = useDocumentTitle();

  return (
    <html lang={i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{documentTitle}</title>
        <Meta />
        <Links />
      </head>
      <body vocab="http://schema.org/" typeof="WebPage">
        <Suspense>
          <Outlet />
          <Toaster toast={toast} />
          <SessionTimeout promptBeforeIdle={env.SESSION_TIMEOUT_PROMPT_SECONDS * 1000} timeout={env.SESSION_TIMEOUT_SECONDS * 1000} />
        </Suspense>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <ClientEnv env={env} nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}
