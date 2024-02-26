import type { ChangeEvent } from 'react';

import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useSearchParams } from '@remix-run/react';

import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { InlineLink } from '~/components/inline-link';
import { InputSelect } from '~/components/input-select';
import { getInteropService } from '~/services/interop-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { getUserService } from '~/services/user-service.server';
import { getTypedI18nNamespaces } from '~/utils/locale-utils';
import type { RouteHandleData } from '~/utils/route-utils';

const i18nNamespaces = getTypedI18nNamespaces('letters');

export const handle = {
  breadcrumbs: [{ labelI18nKey: 'letters:index.page-title' }],
  i18nNamespaces,
  pageIdentifier: 'CDCP-0002',
  pageTitleI18nKey: 'letters:index.page-title',
} as const satisfies RouteHandleData;

const orderEnumSchema = z.enum(['asc', 'desc']);

export async function loader({ request }: LoaderFunctionArgs) {
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request);

  /**
   * @url Create a new URL object from request URL
   * @sort This accesses the URL's search parameter and retrieves the value associated with the 'sort' parameter, allows the client to specify how the data should be sorted via the URL
   */
  const url = new URL(request.url);
  const sortOrder = orderEnumSchema.catch('desc').parse(url.searchParams.get('sort'));

  const userService = getUserService();
  const interopService = getInteropService();
  const userId = await userService.getUserId();
  const letters = await interopService.getLetterInfoByClientId(userId, 'clientId', sortOrder); // TODO where and what is clientId?
  const letterTypes = (await interopService.getAllLetterTypes()).filter(({ code }) => letters.some(({ name }) => name === code));
  return json({ letters, letterTypes, sortOrder });
}

export default function LettersIndex() {
  const [, setSearchParams] = useSearchParams();
  const { i18n, t } = useTranslation(i18nNamespaces);
  const { letters, letterTypes, sortOrder } = useLoaderData<typeof loader>();

  function handleOnSortOrderChange(e: ChangeEvent<HTMLSelectElement>) {
    setSearchParams((prev) => {
      prev.set('sort', e.target.value);
      return prev;
    });
  }

  return (
    <>
      <p className="mb-8 border-b border-gray-200 pb-8 text-lg text-gray-500">{t('letters:index.subtitle')}</p>
      <div className="my-6">
        <InputSelect
          id="sort-order"
          value={sortOrder}
          onChange={handleOnSortOrderChange}
          label={t('letters:index.filter')}
          name="sortOrder"
          options={[
            { value: orderEnumSchema.enum.desc, children: t('letters:index.newest') },
            { value: orderEnumSchema.enum.asc, children: t('letters:index.oldest') },
          ]}
        />
      </div>
      <ul className="divide-y border-y">
        {letters.map((letter) => {
          const letterType = letterTypes.find(({ code }) => code === letter.name);
          const letterName = letterType ? letterType[i18n.language === 'fr' ? 'nameFr' : 'nameEn'] : letter.name;
          return (
            <li key={letter.id} className="py-4 sm:py-6">
              <InlineLink reloadDocument to={`/letters/${letter.referenceId}/download`} className="font-lato font-semibold">
                {letterName}
              </InlineLink>
              <p className="mt-1 text-sm text-gray-500">{t('letters:index.date', { date: letter.issuedOn })}</p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
