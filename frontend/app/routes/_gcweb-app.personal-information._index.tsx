import type { ReactNode } from 'react';

import { type LoaderFunctionArgs, json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { lookupService } from '~/services/lookup-service.server';
import { userService } from '~/services/user-service.server';
import { getNameByLanguage, getTypedI18nNamespaces } from '~/utils/locale-utils';

const i18nNamespaces = getTypedI18nNamespaces('personal-information');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'personal-information:index.breadcrumbs.home', to: '/' }, { labelI18nKey: 'personal-information:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'personal-information:index.page-title',
} as const satisfies RouteHandleData;

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await userService.getUserId();
  const userInfo = await userService.getUserInfo(userId);

  if (!userInfo) {
    throw new Response(null, { status: 404 });
  }
  const preferredLanguage = userInfo.preferredLanguage ? await lookupService.getPreferredLanguage(userInfo?.preferredLanguage) : undefined;

  return json({ user: userInfo, preferredLanguage });
}

export default function PersonalInformationIndex() {
  const { user, preferredLanguage } = useLoaderData<typeof loader>();
  const { i18n, t } = useTranslation(i18nNamespaces);

  return (
    <>
      <h1 id="wb-cont" property="name">
        {t('personal-information:index.page-title')}
      </h1>
      <p>{t('personal-information:index.on-file')}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <PersonalInformationSection title={t('personal-information:index.full-name')} icon="glyphicon-user">
          {`${user.firstName} ${user.lastName}`}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-preferred-language-button" className="btn btn-primary btn-lg" to="/personal-information/preferred-language/edit">
              {t('personal-information:index.change-preferred-language')}
            </Link>
          }
          title={t('personal-information:index.preferred-language')}
          icon="glyphicon-globe"
        >
          {preferredLanguage && getNameByLanguage(i18n.language, preferredLanguage)}
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-home-address-button" className="btn btn-primary btn-lg" to="/personal-information/address/edit">
              {t('personal-information:index.change-addresses')}
            </Link>
          }
          title={t('personal-information:index.addresses')}
          icon="glyphicon-map-marker"
        >
          <dl>
            <dt>{t('personal-information:index.home-address')}</dt>
            <dd className="whitespace-pre-line">{user.homeAddress}</dd>
            <dt>{t('personal-information:index.mailing-address')}</dt>
            <dd className="whitespace-pre-line">{user.mailingAddress}</dd>
          </dl>
        </PersonalInformationSection>
        <PersonalInformationSection
          footer={
            <Link id="change-phone-number-button" className="btn btn-primary btn-lg" to="/personal-information/phone-number/edit">
              {t('personal-information:index.change-phone-number')}
            </Link>
          }
          title={t('personal-information:index.phone-number')}
          icon="glyphicon-earphone"
        >
          {user.phoneNumber}
        </PersonalInformationSection>
      </div>
    </>
  );
}

interface PersonalInformationSectionProps {
  children: ReactNode;
  footer?: ReactNode;
  title: ReactNode;
  icon?: string;
}

function PersonalInformationSection({ children, footer, title, icon }: PersonalInformationSectionProps) {
  return (
    <section className="panel panel-info !m-0 flex flex-col">
      <header className="panel-heading">
        <h2 className="h3 panel-title">
          {icon && <span className={clsx('glyphicon', icon, 'pull-right')} aria-hidden="true"></span>}
          {title}
        </h2>
      </header>
      <div className="panel-body">{children}</div>
      {footer && <footer className="panel-footer mt-auto">{footer}</footer>}
    </section>
  );
}
