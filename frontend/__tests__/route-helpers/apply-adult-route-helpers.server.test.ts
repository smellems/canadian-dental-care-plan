import { Params } from '@remix-run/react';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApplyAdultState, applicantInformationStateHasPartner, validateApplyAdultStateForReview } from '~/route-helpers/apply-adult-route-helpers.server';
import { ApplyState } from '~/route-helpers/apply-route-helpers.server';

vi.mock('@remix-run/node', () => ({
  redirect: vi.fn((to: string) => `MockedRedirect(${to})`),
}));

vi.mock('~/utils/env.server', () => ({
  getEnv: vi.fn(() => ({
    MARITAL_STATUS_CODE_MARRIED: 1,
    MARITAL_STATUS_CODE_COMMONLAW: 2,
  })),
}));

vi.mock('~/utils/route-utils', () => ({
  getPathById: vi.fn((path: string, params: Params) => `MockedPath(${path}, ${JSON.stringify(params)})`),
}));

describe('apply-route-helpers.server', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('applicantInformationStateHasPartner', () => {
    it('should return true for marital status code "1" for MARRIED', () => {
      const result = applicantInformationStateHasPartner({ maritalStatus: '1' });
      expect(result).toBe(true);
    });

    it('should return true for marital status code  "2" for COMMONLAW', () => {
      const result = applicantInformationStateHasPartner({ maritalStatus: '2' });
      expect(result).toBe(true);
    });

    it('should return false for other marital status codes', () => {
      const result = applicantInformationStateHasPartner({ maritalStatus: '99' });
      expect(result).toBe(false);
    });
  });

  describe('validateApplyAdultStateForReview', () => {
    const params: Params = {
      lang: 'en',
      id: '00000000-0000-0000-0000-000000000000',
    };

    const baseState = {
      id: '00000000-0000-0000-0000-000000000000',
      lastUpdatedOn: '',
    };

    it('should redirect if typeOfApplication is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: undefined,
      };

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is delegate', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'delegate',
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/application-delegate, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if typeOfApplication is not adult', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'child',
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if adultState is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/type-application, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: undefined,
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/tax-filing, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if taxFiling2023 is no', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: 'no',
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/file-taxes, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dateOfBirth is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: 'yes',
          dateOfBirth: undefined,
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/date-of-birth, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it("should redirect if applicantInformation is undefined'", () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: 'yes',
          dateOfBirth: '1900-01-01',
          applicantInformation: undefined,
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if partnerInformation is undefined and applicant has partner', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: 'yes',
          dateOfBirth: '1900-01-01',
          applicantInformation: {
            firstName: 'First Name',
            lastName: 'Last Name',
            maritalStatus: '1',
            socialInsuranceNumber: '000-000-001',
          },
          partnerInformation: undefined,
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/partner-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if partnerInformation is not undefined and applicant has no partner', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: 'yes',
          dateOfBirth: '1900-01-01',
          applicantInformation: {
            firstName: 'First Name',
            lastName: 'Last Name',
            maritalStatus: '99',
            socialInsuranceNumber: '000-000-001',
          },
          partnerInformation: {
            confirm: true,
            dateOfBirth: '1900-01-01',
            firstName: 'First Name',
            lastName: 'Last Name',
            socialInsuranceNumber: '000-000-002',
          },
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/applicant-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if personalInformation is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: 'yes',
          dateOfBirth: '1900-01-01',
          applicantInformation: {
            firstName: 'First Name',
            lastName: 'Last Name',
            maritalStatus: '1',
            socialInsuranceNumber: '000-000-001',
          },
          partnerInformation: {
            confirm: true,
            dateOfBirth: '1900-01-01',
            firstName: 'First Name',
            lastName: 'Last Name',
            socialInsuranceNumber: '000-000-002',
          },
          personalInformation: undefined,
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/personal-information, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if communicationPreferences is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: 'yes',
          dateOfBirth: '1900-01-01',
          applicantInformation: {
            firstName: 'First Name',
            lastName: 'Last Name',
            maritalStatus: '1',
            socialInsuranceNumber: '000-000-001',
          },
          partnerInformation: {
            confirm: true,
            dateOfBirth: '1900-01-01',
            firstName: 'First Name',
            lastName: 'Last Name',
            socialInsuranceNumber: '000-000-002',
          },
          personalInformation: {
            copyMailingAddress: true,
            mailingAddress: '123 rue Peuplier',
            mailingCity: 'City',
            mailingCountry: 'Country',
          },
          communicationPreferences: undefined,
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/communication-preference, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dentalInsurance is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: 'yes',
          dateOfBirth: '1900-01-01',
          applicantInformation: {
            firstName: 'First Name',
            lastName: 'Last Name',
            maritalStatus: '1',
            socialInsuranceNumber: '000-000-001',
          },
          partnerInformation: {
            confirm: true,
            dateOfBirth: '1900-01-01',
            firstName: 'First Name',
            lastName: 'Last Name',
            socialInsuranceNumber: '000-000-002',
          },
          personalInformation: {
            copyMailingAddress: true,
            mailingAddress: '123 rue Peuplier',
            mailingCity: 'City',
            mailingCountry: 'Country',
          },
          communicationPreferences: {
            preferredLanguage: 'en',
            preferredMethod: 'email',
          },
          dentalInsurance: undefined,
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/dental-insurance, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should redirect if dentalBenefits is undefined', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: false,
          taxFiling2023: 'yes',
          dateOfBirth: '1900-01-01',
          applicantInformation: {
            firstName: 'First Name',
            lastName: 'Last Name',
            maritalStatus: '1',
            socialInsuranceNumber: '000-000-001',
          },
          partnerInformation: {
            confirm: true,
            dateOfBirth: '1900-01-01',
            firstName: 'First Name',
            lastName: 'Last Name',
            socialInsuranceNumber: '000-000-002',
          },
          personalInformation: {
            copyMailingAddress: true,
            mailingAddress: '123 rue Peuplier',
            mailingCity: 'City',
            mailingCountry: 'Country',
          },
          communicationPreferences: {
            preferredLanguage: 'en',
            preferredMethod: 'email',
          },
          dentalInsurance: false,
          dentalBenefits: undefined,
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).toThrow('MockedRedirect(MockedPath($lang+/_public+/apply+/$id+/adult/federal-provincial-territorial-benefits, {"lang":"en","id":"00000000-0000-0000-0000-000000000000"}))');
    });

    it('should not redirect if state is completed', () => {
      const mockState = {
        ...baseState,
        typeOfApplication: 'adult',
        adultState: {
          editMode: true,
          taxFiling2023: 'yes',
          dateOfBirth: '1900-01-01',
          applicantInformation: {
            firstName: 'First Name',
            lastName: 'Last Name',
            maritalStatus: '1',
            socialInsuranceNumber: '000-000-001',
          },
          partnerInformation: {
            confirm: true,
            dateOfBirth: '1900-01-01',
            firstName: 'First Name',
            lastName: 'Last Name',
            socialInsuranceNumber: '000-000-002',
          },
          personalInformation: {
            copyMailingAddress: true,
            mailingAddress: '123 rue Peuplier',
            mailingCity: 'City',
            mailingCountry: 'Country',
          },
          communicationPreferences: {
            preferredLanguage: 'en',
            preferredMethod: 'email',
          },
          dentalInsurance: false,
          dentalBenefits: {
            hasFederalBenefits: false,
            hasProvincialTerritorialBenefits: false,
          },
        } satisfies ApplyAdultState,
      } satisfies ApplyState;

      expect(() => validateApplyAdultStateForReview({ params, state: mockState })).not.toThrow();
    });
  });
});
