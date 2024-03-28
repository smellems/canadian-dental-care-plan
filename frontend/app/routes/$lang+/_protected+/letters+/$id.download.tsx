import type { LoaderFunctionArgs } from '@remix-run/node';

import { Buffer } from 'node:buffer';

import { getInstrumentationService } from '~/services/instrumentation-service.server';
import { getLettersService } from '~/services/letters-service.server';
import { getRaoidcService } from '~/services/raoidc-service.server';
import { featureEnabled } from '~/utils/env.server';
import { getNameByLanguage } from '~/utils/locale-utils';
import { getLocale } from '~/utils/locale-utils.server';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('view-letters');

  const instrumentationService = getInstrumentationService();

  if (!params.id) {
    instrumentationService.countHttpStatus('letters.download', 400);
    throw new Response(null, { status: 400 });
  }

  const lettersService = getLettersService();
  const raoidcService = await getRaoidcService();
  await raoidcService.handleSessionValidation(request, session);

  //prevent users from entering any ID in the URL and seeing other users' letters
  const letters = session.get('letters');
  const viewLetter = letters.find((letter: { id: string | undefined }) => letter.id === params.id);
  if (!viewLetter) {
    instrumentationService.countHttpStatus('letters.download', 404);
    throw new Response(null, { status: 404 });
  }
  const letterType = (await lettersService.getAllLetterTypes()).find(({ id }) => id === viewLetter.name);
  if (!letterType) {
    instrumentationService.countHttpStatus('letters.download', 404);
    throw new Response(null, { status: 404 });
  }
  const locale = getLocale(request);
  const documentName = getNameByLanguage(locale, letterType);

  const pdfBytes = await lettersService.getPdf(params.id);
  instrumentationService.countHttpStatus('letters.download', 200);

  const decodedPdfBytes = Buffer.from(pdfBytes, 'base64');
  return new Response(decodedPdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': decodedPdfBytes.length.toString(),
      'Content-Disposition': `inline; filename="${documentName}.pdf"`,
    },
  });
}
