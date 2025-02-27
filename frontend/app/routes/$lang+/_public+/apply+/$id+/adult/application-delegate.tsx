import { FormEvent } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Trans, useTranslation } from 'react-i18next';

import pageIds from '../../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { InlineLink } from '~/components/inline-link';
import { clearApplyState, loadApplyState } from '~/route-helpers/apply-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply-adult', 'apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.adult.applicationDelegate,
  pageTitleI18nKey: 'apply-adult:eligibility.application-delegate.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const { id } = loadApplyState({ params, session });

  const csrfToken = String(session.get('csrfToken'));

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply-adult:eligibility.application-delegate.page-title') }) };

  return json({ id, csrfToken, meta });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/application-delegate');

  const t = await getFixedT(request, handle.i18nNamespaces);

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  clearApplyState({ params, session });

  return redirect(t('apply-adult:eligibility.application-delegate.return-btn-link'));
}

export default function ApplyFlowApplicationDelegate() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';

  const contactServiceCanada = <InlineLink to={t('apply-adult:eligibility.application-delegate.contact-service-canada-href')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const preparingToApply = <InlineLink to={t('apply-adult:eligibility.application-delegate.preparing-to-apply-href')} className="external-link font-lato font-semibold" newTabIndicator target="_blank" />;
  const span = <span className="whitespace-nowrap" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    fetcher.submit(event.currentTarget, { method: 'POST' });
    sessionStorage.removeItem('flow.state');
  }

  return (
    <>
      <div className="mb-8 space-y-4">
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:eligibility.application-delegate.contact-representative" components={{ contactServiceCanada, span }} />
        </p>
        <p>
          <Trans ns={handle.i18nNamespaces} i18nKey="apply-adult:eligibility.application-delegate.prepare-to-apply" components={{ preparingToApply }} />
        </p>
      </div>
      <fetcher.Form method="post" onSubmit={handleSubmit} noValidate className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <ButtonLink type="button" routeId="$lang+/_public+/apply+/$id+/type-application" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Applying on behalf of someone click">
          <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
          {t('apply-adult:eligibility.application-delegate.back-btn')}
        </ButtonLink>
        <Button type="submit" variant="primary" data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Exit - Applying on behalf of someone click">
          {t('apply-adult:eligibility.application-delegate.return-btn')}
          {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="ms-3 block size-4 animate-spin" />}
        </Button>
      </fetcher.Form>
    </>
  );
}
