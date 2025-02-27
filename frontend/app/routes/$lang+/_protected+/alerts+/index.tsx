import type { LoaderFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';

import { getRaoidcService } from '~/services/raoidc-service.server';
import { getSubscriptionService } from '~/services/subscription-service.server';
import { featureEnabled } from '~/utils/env.server';
import { UserinfoToken } from '~/utils/raoidc-utils.server';
import { getPathById } from '~/utils/route-utils';

export async function loader({ context: { session }, params, request }: LoaderFunctionArgs) {
  featureEnabled('email-alerts');

  const raoidcService = await getRaoidcService();

  await raoidcService.handleSessionValidation(request, session);

  const userInfoToken: UserinfoToken = session.get('userInfoToken');
  const alertSubscription = await getSubscriptionService().getSubscription(userInfoToken.sin ?? '');

  if (!alertSubscription || alertSubscription.registered === false) {
    return redirect(getPathById('$lang+/_protected+/alerts+/subscribe+/index', params));
  } else if (alertSubscription.subscribed === true) {
    return redirect(getPathById('$lang+/_protected+/alerts+/manage+/index', params));
  } else {
    return redirect(getPathById('$lang+/_protected+/alerts+/subscribe+/confirm', params));
  }
}
