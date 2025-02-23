import { useEffect, useMemo } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useParams } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { loadApplyAdultState, saveApplyAdultState } from '~/route-helpers/apply-adult-route-helpers.server';
import * as adobeAnalytics from '~/utils/adobe-analytics.client';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT } from '~/utils/locale-utils.server';
import { getLogger } from '~/utils/logging.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData, getPathById } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

enum LivingIndependentlyOption {
  No = 'no',
  Yes = 'yes',
}

export type LivingIndependentlyState = `${LivingIndependentlyOption}`;

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.livingIndependently,
  pageTitleI18nKey: 'apply:living-independently.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  const state = loadApplyAdultState({ params, request, session });
  const t = await getFixedT(request, handle.i18nNamespaces);

  const csrfToken = String(session.get('csrfToken'));
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:living-independently.page-title') }) };

  return json({ id: state.id, csrfToken, meta, defaultState: state.adultState.livingIndependently });
}

export async function action({ context: { session }, params, request }: ActionFunctionArgs) {
  const log = getLogger('apply/living-independently');

  const t = await getFixedT(request, handle.i18nNamespaces);

  /**
   * Schema for living independently.
   */
  const livingIndependentlySchema: z.ZodType<LivingIndependentlyState> = z.nativeEnum(LivingIndependentlyOption, {
    errorMap: () => ({ message: t('apply:living-independently.error-message.living-independently-required') }),
  });

  const formData = await request.formData();
  const expectedCsrfToken = String(session.get('csrfToken'));
  const submittedCsrfToken = String(formData.get('_csrf'));

  if (expectedCsrfToken !== submittedCsrfToken) {
    log.warn('Invalid CSRF token detected; expected: [%s], submitted: [%s]', expectedCsrfToken, submittedCsrfToken);
    throw new Response('Invalid CSRF token', { status: 400 });
  }

  const data = String(formData.get('livingIndependently') ?? '');
  const parsedDataResult = livingIndependentlySchema.safeParse(data);

  if (!parsedDataResult.success) {
    return json({ errors: parsedDataResult.error.format()._errors });
  }

  saveApplyAdultState({ params, request, session, state: { livingIndependently: parsedDataResult.data } });

  if (parsedDataResult.data === LivingIndependentlyOption.Yes) {
    return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/application-delegate', params));
  }

  return redirect(getPathById('$lang+/_public+/apply+/$id+/adult/parent-or-guardian', params));
}

export default function ApplyFlowLivingIndependently() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { csrfToken, defaultState } = useLoaderData<typeof loader>();
  const params = useParams();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  // Keys order should match the input IDs order.
  const errorMessages = useMemo(
    () => ({
      'input-radio-living-independently-option-0': fetcher.data?.errors[0],
    }),
    [fetcher.data?.errors],
  );

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

  useEffect(() => {
    if (hasErrors(errorMessages)) {
      scrollAndFocusToErrorSummary(errorSummaryId);

      if (adobeAnalytics.isConfigured()) {
        adobeAnalytics.pushValidationErrorEvent(errorSummaryItems.map(({ fieldId }) => fieldId));
      }
    }
  }, [errorMessages, errorSummaryItems]);

  return (
    <>
      <div className="my-6 sm:my-8">
        <p id="progress-label" className="sr-only mb-2">
          {t('apply:progress.label')}
        </p>
        <Progress aria-labelledby="progress-label" value={10} size="lg" />
      </div>
      <div className="max-w-prose">
        {errorSummaryItems.length > 0 && <ErrorSummary id={errorSummaryId} errors={errorSummaryItems} />}
        <p className="mb-6" id="living-independently-desc">
          {t('apply:living-independently.description')}
        </p>
        <p className="mb-6 italic" id="form-instructions">
          {t('apply:required-label')}
        </p>
        <fetcher.Form method="post" aria-describedby="form-instructions" noValidate>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <InputRadios
            id="living-independently"
            name="livingIndependently"
            legend={t('apply:living-independently.form-instructions')}
            options={[
              {
                value: LivingIndependentlyOption.Yes,
                children: t('apply:living-independently.radio-options.yes'),
                defaultChecked: defaultState === LivingIndependentlyOption.Yes,
              },
              {
                value: LivingIndependentlyOption.No,
                children: t('apply:living-independently.radio-options.no'),
                defaultChecked: defaultState === LivingIndependentlyOption.No,
              },
            ]}
            required
            errorMessage={errorMessages['input-radio-living-independently-option-0']}
          />
          <div className="mt-8 flex flex-row-reverse flex-wrap items-center justify-end gap-3">
            <Button variant="primary" id="continue-button" disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Continue - Living independently click">
              {t('apply:living-independently.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
            <ButtonLink id="back-button" routeId="$lang+/_public+/apply+/$id+/terms-and-conditions" params={params} disabled={isSubmitting} data-gc-analytics-customclick="ESDC-EDSC:CDCP Online Application Form:Back - Living independently click">
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply:living-independently.back-btn')}
            </ButtonLink>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
