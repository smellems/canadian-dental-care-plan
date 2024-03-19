import { useEffect } from 'react';

import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { faChevronLeft, faChevronRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import pageIds from '../../../page-ids.json';
import { Button, ButtonLink } from '~/components/buttons';
import { ErrorSummary, createErrorSummaryItems, hasErrors, scrollAndFocusToErrorSummary } from '~/components/error-summary';
import { InputRadios } from '~/components/input-radios';
import { Progress } from '~/components/progress';
import { getApplyFlow } from '~/routes-flow/apply-flow';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import { getFixedT, redirectWithLocale } from '~/utils/locale-utils.server';
import { mergeMeta } from '~/utils/meta-utils';
import { RouteHandleData } from '~/utils/route-utils';
import { getTitleMetaTags } from '~/utils/seo-utils';
import { cn } from '~/utils/tw-utils';

export const handle = {
  i18nNamespaces: getTypedI18nNamespaces('apply', 'gcweb'),
  pageIdentifier: pageIds.public.apply.typeOfApplication,
  pageTitleI18nKey: 'apply:eligibility.type-of-application.page-title',
} as const satisfies RouteHandleData;

export const meta: MetaFunction<typeof loader> = mergeMeta(({ data }) => {
  return data ? getTitleMetaTags(data.meta.title) : [];
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id, state } = await applyFlow.loadState({ request, params });

  const t = await getFixedT(request, handle.i18nNamespaces);
  const meta = { title: t('gcweb:meta.title.template', { title: t('apply:eligibility.type-of-application.page-title') }) };

  return json({ id, meta, state: state.applicationDelegate });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const applyFlow = getApplyFlow();
  const { id } = await applyFlow.loadState({ request, params });

  const formSchema = z.object({
    applicationDelegate: z.string(),
  });

  const formData = Object.fromEntries(await request.formData());
  const parsedDataResult = formSchema.safeParse(formData);

  if (!parsedDataResult.success) {
    return json({
      errors: parsedDataResult.error.format(),
      formData: formData as Partial<z.infer<typeof formSchema>>,
    });
  }

  const sessionResponseInit = await applyFlow.saveState({
    request,
    params,
    state: { applicationDelegate: parsedDataResult.data },
  });

  return parsedDataResult.data.applicationDelegate === 'TRUE' ? redirectWithLocale(request, `/apply/${id}/application-delegate`, sessionResponseInit) : redirectWithLocale(request, `/apply/${id}/tax-filing`, sessionResponseInit);
}

export default function ApplyFlowTypeOfApplication() {
  const { t } = useTranslation(handle.i18nNamespaces);
  const { id, state } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const isSubmitting = fetcher.state !== 'idle';
  const errorSummaryId = 'error-summary';

  useEffect(() => {
    if (fetcher.data?.formData && hasErrors(fetcher.data.formData)) {
      scrollAndFocusToErrorSummary(errorSummaryId);
    }
  }, [fetcher.data]);

  function getErrorMessage(errorI18nKey?: string): string | undefined {
    if (!errorI18nKey) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(`apply:eligibility.type-of-application.error-message.${errorI18nKey}` as any);
  }

  const errorMessages = {
    'input-radios-application-delegate': getErrorMessage(fetcher.data?.errors.applicationDelegate?._errors[0]),
  };

  const errorSummaryItems = createErrorSummaryItems(errorMessages);

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
        <fetcher.Form method="post" aria-describedby="form-instructions" noValidate>
          <InputRadios
            id="application-delegate"
            name="applicationDelegate"
            legend={t('apply:eligibility.type-of-application.form-instructions')}
            options={[
              { value: 'FALSE', children: t('apply:eligibility.type-of-application.radio-options.personal'), defaultChecked: state?.applicationDelegate === 'FALSE' },
              { value: 'TRUE', children: t('apply:eligibility.type-of-application.radio-options.delegate'), defaultChecked: state?.applicationDelegate === 'TRUE' },
            ]}
            required
            errorMessage={errorMessages['input-radios-application-delegate']}
          />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink id="back-button" to={`/apply/${id}/terms-and-conditions`} disabled={isSubmitting}>
              <FontAwesomeIcon icon={faChevronLeft} className="me-3 block size-4" />
              {t('apply:eligibility.type-of-application.back-btn')}
            </ButtonLink>
            <Button variant="primary" id="continue-button" disabled={isSubmitting}>
              {t('apply:eligibility.type-of-application.continue-btn')}
              <FontAwesomeIcon icon={isSubmitting ? faSpinner : faChevronRight} className={cn('ms-3 block size-4', isSubmitting && 'animate-spin')} />
            </Button>
          </div>
        </fetcher.Form>
      </div>
    </>
  );
}
