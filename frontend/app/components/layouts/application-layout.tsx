import type { ComponentProps, MouseEvent, ReactNode } from 'react';

import { Link } from '@remix-run/react';

import { faArrowRightFromBracket, faChevronDown, faChevronRight, faCircleUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import { ButtonLink } from '~/components/buttons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '~/components/dropdown-menu';
import { InlineLink } from '~/components/inline-link';
import { LanguageSwitcher } from '~/components/language-switcher';
import { PageTitle } from '~/components/page-title';
import { getClientEnv } from '~/utils/env-utils';
import { scrollAndFocusFromAnchorLink } from '~/utils/link-utils';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { useBreadcrumbs, useBuildInfo, useI18nNamespaces, usePageIdentifier, usePageTitleI18nKey } from '~/utils/route-utils';

export const i18nNamespaces = getTypedI18nNamespaces('gcweb');

export interface ApplicationLayoutProps {
  children?: ReactNode;
  layout: 'protected' | 'public';
}

/**
 * GCWeb Application page template.
 * see: https://wet-boew.github.io/GCWeb/templates/application/application-docs-en.html
 */
export default function ApplicationLayout({ children, layout }: ApplicationLayoutProps) {
  return (
    <>
      <SkipNavigationLinks />
      {layout === 'protected' && <ProtectedPageHeader />}
      {layout === 'public' && <PublicPageHeader />}
      <Breadcrumbs layout={layout} />
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <AppPageTitle />
        {children}
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

function NavigationMenu() {
  const { t } = useTranslation(i18nNamespaces);
  const { SCCH_BASE_URI } = getClientEnv();

  return (
    <div className="sm:w-[260px]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex w-full items-center justify-between bg-slate-200 px-4 py-3 align-middle font-bold text-slate-700 outline-offset-2 hover:bg-neutral-300 focus:bg-neutral-300" id="dropdownNavbarLink" data-testid="menuButton">
            <span className="inline-flex w-full appearance-none items-center gap-4">
              <FontAwesomeIcon icon={faCircleUser} className="size-9 flex-shrink-0" />
              <span>{t('header.menu-title')}</span>
            </span>
            <FontAwesomeIcon icon={faChevronDown} className="size-3 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-svw rounded-t-none sm:w-[260px]" sideOffset={0} align="center">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={t('gcweb:header.menu-dashboard.href', { baseUri: SCCH_BASE_URI })}>{t('gcweb:header.menu-dashboard.text')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={t('gcweb:header.menu-profile.href', { baseUri: SCCH_BASE_URI })}>{t('gcweb:header.menu-profile.text')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={t('gcweb:header.menu-security-settings.href', { baseUri: SCCH_BASE_URI })}>{t('gcweb:header.menu-security-settings.text')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={t('gcweb:header.menu-contact-us.href', { baseUri: SCCH_BASE_URI })}>{t('gcweb:header.menu-contact-us.text')}</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/auth/logout" className="flex items-center justify-between gap-2">
              {t('gcweb:header.menu-sign-out.text')} <FontAwesomeIcon icon={faArrowRightFromBracket} className="size-4 flex-shrink-0" />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ProtectedPageHeader() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <header>
      <PageHeaderBrand />
      <section className="bg-gray-700 text-white">
        <div className="sm:container">
          <div className="flex flex-col items-stretch justify-between sm:flex-row sm:items-center">
            <h2 className="p-4 font-lato text-xl font-semibold sm:p-0 sm:py-3 sm:text-2xl">
              <Link to="/" className="hover:underline">
                {t('gcweb:header.application-title')}
              </Link>
            </h2>
            <NavigationMenu />
          </div>
        </div>
      </section>
    </header>
  );
}

function PublicPageHeader() {
  return (
    <header className="border-b-[3px] border-slate-700">
      <PageHeaderBrand />
    </header>
  );
}

function AppPageTitle(props: Omit<ComponentProps<typeof PageTitle>, 'children'>) {
  const { t } = useTranslation(useI18nNamespaces());
  const pageTitleI18nKey = usePageTitleI18nKey();

  return pageTitleI18nKey && <PageTitle {...props}>{t(pageTitleI18nKey)}</PageTitle>;
}

function PageDetails() {
  const buildInfo = useBuildInfo() ?? {
    buildDate: '2000-01-01T00:00:00Z',
    buildVersion: '0.0.0-00000000-0000',
  };

  const pageIdentifier = usePageIdentifier();

  const { t } = useTranslation(i18nNamespaces);

  return (
    <section className="mb-8 mt-16">
      <h2 className="sr-only">{t('gcweb:page-details.page-details')}</h2>
      <dl id="wb-dtmd" className="space-y-1">
        {!!pageIdentifier && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.screen-id')}</dt>
            <dd>
              <span property="identifier">{pageIdentifier}</span>
            </dd>
          </div>
        )}
        {!!buildInfo.buildDate && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.date-modfied')}</dt>
            <dd>
              <time property="dateModified">{buildInfo.buildDate.slice(0, 10)}</time>
            </dd>
          </div>
        )}
        {!!buildInfo.buildVersion && (
          <div className="flex gap-2">
            <dt>{t('gcweb:page-details.version')}</dt>
            <dd>
              <span property="version">{buildInfo.buildVersion}</span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function PageFooter() {
  const { t } = useTranslation(i18nNamespaces);

  return (
    <footer id="wb-info" className="bg-stone-50">
      <div className="bg-gray-700 text-white">
        <section className="container py-6">
          <h2 className="mb-4">My Service Canada Account</h2>
          <div className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <Link className="hover:underline" to="https://example.com/contact-us">
              Contact Us
            </Link>
            <Link className="hover:underline" to="https://example.com/link-1">
              [Link1]
            </Link>
            <Link className="hover:underline" to="https://example.com/link-2">
              [Link2]
            </Link>
          </div>
        </section>
      </div>
      <div className="container py-7">
        <h2 className="sr-only">{t('gcweb:footer.about-site')}</h2>
        <div className="flex items-center justify-between gap-4">
          <nav aria-labelledby="gc-corporate">
            <h3 id="gc-corporate" className="sr-only">
              {t('gcweb:footer.gc-corporate')}
            </h3>
            <div className="flex flex-col items-start gap-2 text-sm leading-6 sm:flex-row sm:items-center sm:gap-4">
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.terms-conditions.href')}>
                {t('gcweb:footer.terms-conditions.text')}
              </Link>
              <div className="hidden size-0 rounded-full border-[3px] border-slate-700 sm:block"></div>
              <Link className="text-slate-700 hover:underline" to={t('gcweb:footer.privacy.href')}>
                {t('gcweb:footer.privacy.text')}
              </Link>
            </div>
          </nav>
          <div>
            <img src="/assets/wmms-blk.svg" alt={t('gcweb:footer.gc-symbol')} width={300} height={71} className="h-10 w-auto" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function Breadcrumb({ children, to }: { children: ReactNode; to?: string }) {
  // prettier-ignore
  return to === undefined
    ? <span property="name">{children}</span>
    : <InlineLink to={to} property="item" typeof="WebPage"><span property="name">{children}</span></InlineLink>;
}

function Breadcrumbs({ layout }: { layout: 'protected' | 'public' }) {
  const { t } = useTranslation([...i18nNamespaces, ...useI18nNamespaces()]);
  const breadcrumbs = useBreadcrumbs();

  return (
    <nav id="wb-bc" property="breadcrumb" aria-labelledby="breadcrumbs">
      <h2 id="breadcrumbs" className="sr-only">
        {t('gcweb:breadcrumbs.you-are-here')}
      </h2>
      <div className="container mt-4">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-1" typeof="BreadcrumbList">
          {layout === 'protected' && (
            <>
              <li property="itemListElement" typeof="ListItem">
                <Breadcrumb to={breadcrumbs.length !== 0 ? '/home' : undefined}>{t('gcweb:breadcrumbs.home')}</Breadcrumb>
              </li>
              {breadcrumbs.map(({ labelI18nKey, to }) => {
                return (
                  <li key={labelI18nKey} property="itemListElement" typeof="ListItem" className="flex items-center">
                    <FontAwesomeIcon icon={faChevronRight} className="mr-2 size-3 text-slate-700" />
                    <Breadcrumb to={to}>{t(labelI18nKey)}</Breadcrumb>
                  </li>
                );
              })}
            </>
          )}
          {layout === 'public' && (
            <>
              <li property="itemListElement" typeof="ListItem" className="flex items-center">
                <Breadcrumb to={t('gcweb:breadcrumbs.canada-ca-url')}>{t('gcweb:breadcrumbs.canada-ca')}</Breadcrumb>
              </li>
              <li property="itemListElement" typeof="ListItem" className="flex items-center">
                <FontAwesomeIcon icon={faChevronRight} className="mr-2 size-3 text-slate-700" />
                <Breadcrumb to={t('gcweb:breadcrumbs.benefits-url')}>{t('gcweb:breadcrumbs.benefits')}</Breadcrumb>
              </li>
              <li property="itemListElement" typeof="ListItem" className="flex items-center">
                <FontAwesomeIcon icon={faChevronRight} className="mr-2 size-3 text-slate-700" />
                <Breadcrumb to={t('gcweb:breadcrumbs.dental-coverage-url')}>{t('gcweb:breadcrumbs.dental-coverage')}</Breadcrumb>
              </li>
              <li property="itemListElement" typeof="ListItem" className="flex items-center">
                <FontAwesomeIcon icon={faChevronRight} className="mr-2 size-3 text-slate-700" />
                <Breadcrumb to={t('gcweb:breadcrumbs.canadian-dental-care-plan-url')}>{t('gcweb:breadcrumbs.canadian-dental-care-plan')}</Breadcrumb>
              </li>
            </>
          )}
        </ol>
      </div>
    </nav>
  );
}

export interface NotFoundErrorProps {
  error?: unknown;
  layout: 'protected' | 'public';
}

export function NotFoundError({ error, layout }: NotFoundErrorProps) {
  const { t } = useTranslation(i18nNamespaces);
  const home = <InlineLink to="/" />;

  return (
    <>
      {layout === 'protected' && <ProtectedPageHeader />}
      {layout === 'public' && <PublicPageHeader />}
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <PageTitle>
          <span>{t('gcweb:not-found.page-title')}</span>
          <small className="block text-2xl font-normal text-neutral-500">{t('gcweb:not-found.page-subtitle')}</small>
        </PageTitle>
        <p className="mb-8 text-lg text-gray-500">{t('gcweb:not-found.page-message')}</p>
        <ul className="list-disc space-y-2 pl-10">
          <li>
            <Trans ns={i18nNamespaces} i18nKey="gcweb:not-found.page-link" components={{ home }} />
          </li>
        </ul>
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

export interface ServerErrorProps {
  error: unknown;
  layout: 'protected' | 'public';
}

export function ServerError({ error, layout }: ServerErrorProps) {
  const { t } = useTranslation(i18nNamespaces);
  const home = <InlineLink to="/" />;

  return (
    <>
      {layout === 'protected' && <ProtectedPageHeader />}
      {layout === 'public' && <PublicPageHeader />}
      <main className="container" property="mainContentOfPage" resource="#wb-main" typeof="WebPageElement">
        <PageTitle>
          <span>{t('gcweb:server-error.page-title')}</span>
          <small className="block text-2xl font-normal text-neutral-500">{t('gcweb:server-error.page-subtitle')}</small>
        </PageTitle>
        <p className="mb-8 text-lg text-gray-500">{t('gcweb:server-error.page-message')}</p>
        <ul className="list-disc space-y-2 pl-10">
          <li>{t('gcweb:server-error.option-01')}</li>
          <li>
            <Trans ns={i18nNamespaces} i18nKey="gcweb:server-error.option-02" components={{ home }} />
          </li>
        </ul>
        <PageDetails />
      </main>
      <PageFooter />
    </>
  );
}

export function SkipNavigationLinks() {
  const { t } = useTranslation(i18nNamespaces);

  /**
   * handleOnSkipLinkClick is the click event handler for the anchor link.
   * It prevents the default anchor link behavior, scrolls to and focuses
   * on the target element specified by 'anchorElementId', and invokes
   * the optional 'onClick' callback.
   */
  function handleOnSkipLinkClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    scrollAndFocusFromAnchorLink(e.currentTarget.href);
  }

  return (
    <div id="skip-to-content">
      {[
        { to: '#wb-cont', children: t('gcweb:nav.skip-to-content') },
        { to: '#wb-info', children: t('gcweb:nav.skip-to-about') },
      ].map(({ to, children }) => (
        <ButtonLink key={to} to={to} onClick={handleOnSkipLinkClick} variant="primary" className="absolute z-10 mx-2 -translate-y-full transition-all focus:mt-2 focus:translate-y-0">
          {children}
        </ButtonLink>
      ))}
    </div>
  );
}

export function PageHeaderBrand() {
  const { i18n, t } = useTranslation(i18nNamespaces);
  return (
    <div id="wb-bnr">
      <div className="container flex items-center justify-between gap-6 py-2.5 sm:py-3.5">
        <div property="publisher" typeof="GovernmentOrganization">
          <Link to={t('gcweb:header.govt-of-canada.href')} property="url">
            <img className="h-8 w-auto" src={`/assets/sig-blk-${i18n.language}.svg`} alt={t('gcweb:header.govt-of-canada.text')} property="logo" width="300" height="28" decoding="async" />
          </Link>
          <meta property="name" content={t('gcweb:header.govt-of-canada.text')} />
          <meta property="areaServed" typeof="Country" content="Canada" />
          <link property="logo" href="/assets/wmms-blk.svg" />
        </div>
        <section id="wb-lng">
          <h2 className="sr-only">{t('gcweb:header.language-selection')}</h2>
          <LanguageSwitcher>
            <span className="hidden md:block">{t('gcweb:language-switcher.alt-lang')}</span>
            <abbr title={t('gcweb:language-switcher.alt-lang')} className="cursor-help uppercase md:hidden">
              {t('gcweb:language-switcher.alt-lang-abbr')}
            </abbr>
          </LanguageSwitcher>
        </section>
      </div>
    </div>
  );
}
