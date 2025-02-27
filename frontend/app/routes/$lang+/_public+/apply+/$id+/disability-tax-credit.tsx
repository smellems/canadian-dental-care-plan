import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { Link, useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { differenceInYears, parse } from 'date-fns';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { loadApplyAdultState, saveApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum DisabilityTaxCreditOption {
  No = 'no',
  Yes = 'yes',
}

export type DisabilityTaxCreditState = `${DisabilityTaxCreditOption}`;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.disabilityTaxCredit,
  pageTitleI18nKey: 'apply:disability-tax-credit.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:disability-tax-credit.page-title') }) };

  const parseDateOfBirth = parse(state.adultState.dateOfBirth ?? '', 'yyyy-MM-dd', new Date());
  const age = differenceInYears(new Date(), parseDateOfBirth);
  if (age < 18 || age > 64) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/date-of-birth', params));
  }

  return json({ id: state.id, csrfToken, meta, defaultState: state.adultState.disabilityTaxCredit });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/disability-tax-credit');
  const state = loadApplyAdultState({ params, request, session });

  const t = await getFixedT(request, handle.i18nNamespaces);

  const disabilityTaxCreditSchema: z.ZodType<DisabilityTaxCreditState> = z.nativeEnum(DisabilityTaxCreditOption, {
    errorMap: () => ({ message: t('apply:disability-tax-credit.error-message.disability-tax-credit-required') }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = formData.get('disabilityTaxCredit');
  const parsedDataResult = disabilityTaxCreditSchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format()._errors });
  }

  saveApplyAdultState({ params, request, session, state: { disabilityTaxCredit: parsedDataResult.data } });

  const parseDateOfBirth = parse(state.adultState.dateOfBirth ?? '', 'yyyy-MM-dd', new Date());
  const age = differenceInYears(new Date(), parseDateOfBirth);
  if (age < 18 || age > 64) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/date-of-birth', params));
  }

  if (parsedDataResult.data === DisabilityTaxCreditOption.No && state.adultState.allChildrenUnder18) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/apply-children', params));
  }

  if (parsedDataResult.data === DisabilityTaxCreditOption.No) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/dob-eligibility', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/applicant-information', params));
}

export default function ApplyFlowDisabilityTaxCredit() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-disability-tax-credit-radios-option-0': fetcher.data?.errors[0],
    }),
    [fetcher.data?.errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [errorMessages]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={35} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <p className="mb-5">{t('apply:disability-tax-credit.non-refundable')}</p>
        <p className="mb-5">
          <Trans ns={handle.i18nNamespaces} i18nKey="apply:disability-tax-credit.more-info" components={{ dtcLink: <Link to={t('apply:disability-tax-credit.dtc-link')} className="text-slate-700 underline hover:text-blue-700 focus:text-blue-700" /> }} />
        </p>
        <p className="mb-6 italic" id="form-instructions">
          {t('apply:required-label')}
        </p>
        <fetcher.Form method="post" aria-describedby="form-instructions" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="disability-tax-credit-radios"
            name="disabilityTaxCredit"
            legend={t('apply:disability-tax-credit.form-label')}
            options={[
              { value: DisabilityTaxCreditOption.Yes, children: t('apply:disability-tax-credit.radio-options.yes'), defaultChecked: defaultState === DisabilityTaxCreditOption.Yes },
              { value: DisabilityTaxCreditOption.No, children: t('apply:disability-tax-credit.radio-options.no'), defaultChecked: defaultState === DisabilityTaxCreditOption.No },
            ]}
            errorMessage={errorMessages['input-radio-disability-tax-credit-radios-option-0']}
            required
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Disability tax credit click">
              {t('apply:disability-tax-credit.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
            <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/adult/date-of-birth" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Disability tax credit click">
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply:disability-tax-credit.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
