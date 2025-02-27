import { useEffect } from 'react';

import { Outlet, useNavigate, useParams } from '@remix-run/react';

import { handle as layoutHandle } from '~/routes/$lang+/_public+/apply+/_route';
import { RouteHandleData, getPathById } from '~/utils/route-utils';

export const handle = {
  // ensure that the parent layout's i18n namespaces are loaded
  i18nNamespaces: [...layoutHandle.i18nNamespaces],
} as const satisfies RouteHandleData;

/**
 * The parent route of all /apply/{id}/* routes, used to
 * redirect to /apply if the flow has not yet been initialized.
 */
export default function Route() {
  const navigate = useNavigate();
  const params = useParams();

  const path = getPathById('$lang+/_public+/apply+/index', params);

  useEffect(() => {
    // redirect to start if the flow has not yet been initialized
    const flowState = sessionStorage.getItem('flow.state');

    if (flowState !== 'active') {
      navigate(path, { replace: true });
    }
  }, [navigate, path]);

  return <Outlet />;
}
