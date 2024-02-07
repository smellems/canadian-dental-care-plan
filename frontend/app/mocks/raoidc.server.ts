import { HttpResponse, http } from 'msw';

import { getEnv } from '~/utils/env.server';
import { getLogger } from '~/utils/logging.server';

const log = getLogger('raoidc.server');

/**
 * Server-side MSW mocks for the RAOIDC authentication service.
 */
export function getRaoidcMockHandlers() {
  log.info('Initializing RAOIDC mock handlers');
  const { AUTH_RAOIDC_BASE_URL } = getEnv();

  return [
    //
    // OIDC `/.well-known/openid-configuration` endpoint mock
    //
    http.get(`${AUTH_RAOIDC_BASE_URL}/.well-known/openid-configuration`, async ({ request }) => {
      log.debug('Handling request for [%s]', request.url);
      return HttpResponse.json(getOpenidConfiguration(AUTH_RAOIDC_BASE_URL));
    }),
  ];
}

function getOpenidConfiguration(authBaseUrl: string) {
  return {
    issuer: 'GC-ECAS-MOCK',
    authorization_endpoint: `${authBaseUrl}/authorize`,
    token_endpoint: `${authBaseUrl}/token`,
    jwks_uri: `${authBaseUrl}/jwks`,
    scopes_supported: ['openid', 'profile'],
    claims_supported: ['sub', 'sin', 'birthdate'],
    response_types_supported: ['code'],
    subject_types_supported: ['pairwise'],
    id_token_signing_alg_values_supported: ['RS256', 'RS512'],
    userinfo_endpoint: `${authBaseUrl}/userinfo`,
    revocation_endpoint: `${authBaseUrl}/revoke`,
    grant_types_supported: 'authorization_code',
    id_token_encryption_alg_values_supported: ['RSA-OAEP-256'],
    id_token_encryption_enc_values_supported: ['A256GCM'],
    userinfo_signing_alg_values_supported: ['RS256', 'RS512'],
    userinfo_encryption_alg_values_supported: ['RSA-OAEP-256'],
    userinfo_encryption_enc_values_supported: ['A256GCM'],
  };
}
