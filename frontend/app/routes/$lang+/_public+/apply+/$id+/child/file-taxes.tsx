import { FormEvent } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { loadApplyChildState } from '~/route-helpers/apply-child-route-helpers.server';
import { clearApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-child', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.child.fileYourTaxes,
  pageTitleI18nKey: 'apply-child:eligibility.file-your-taxes.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const { id } = loadApplyChildState({ params, request, session });

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-child:eligibility.file-your-taxes.page-title') }) };

  return json({ id, csrfToken, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/file-taxes');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  clearApplyState({ params, session });
  return redirect(t('apply-child:eligibility.file-your-taxes.return-btn-link'));
}

export default function ApplyFlowFileYourTaxes() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const taxInfo = <InlineLink to={t('apply-child:eligibility.file-your-taxes.tax-info-href')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  return (
    <>
      <div className="mb-8 space-y-4">
        <p>{t('apply-child:eligibility.file-your-taxes.ineligible-to-apply')}</p>
        <p>{t('apply-child:eligibility.file-your-taxes.tax-not-filed')}</p>
        <p>{t('apply-child:eligibility.file-your-taxes.unable-to-assess')}</p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply-child:eligibility.file-your-taxes.tax-info" components={{ taxInfo }} />
        </p>
        <p>{t('apply-child:eligibility.file-your-taxes.apply-after')}</p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/child/tax-filing" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - File your taxes click">
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply-child:eligibility.file-your-taxes.back-btn')}
        </ButtonLink>
        <Button type="submit" variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - File your taxes click">
          {t('apply-child:eligibility.file-your-taxes.return-btn')}
          {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
        </Button>
      </fetcher.Form>
    </>
  );
}
