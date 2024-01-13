import { useMatches } from '@remix-run/react';

import { type Namespace } from 'i18next';
import { z } from 'zod';

/**
 * A reducer function that coalesces two values, returning the non-null (or non-undefined) value.
 */
export const coalesce = <T>(previousValue?: T, currentValue?: T) => currentValue ?? previousValue;

const breadcrumbs = z.object({
  breadcrumbs: z.array(
    z.object({
      label: z.string(),
      to: z.string().optional(),
    }),
  ),
});

const buildInfo = z.object({
  buildInfo: z.object({
    buildDate: z.string(),
    buildId: z.string(),
    buildRevision: z.string(),
    buildVersion: z.string(),
  }),
});

const i18nNamespaces = z.object({
  i18nNamespaces: z.custom<Namespace>(),
});

const pageIdentifier = z.object({
  pageIdentifier: z.string(),
});

const pageTitle = z.object({
  pageTitle: z.string(),
});

export type Breadcrumbs = z.infer<typeof breadcrumbs>;

export type BuildInfo = z.infer<typeof buildInfo>;

export type I18nNamespaces = z.infer<typeof i18nNamespaces>;

export type PageIdentifier = z.infer<typeof pageIdentifier>;

export type PageTitle = z.infer<typeof pageTitle>;

export function useBreadcrumbs() {
  return useMatches()
    .map(({ data }) => breadcrumbs.safeParse(data))
    .map((result) => (result.success ? result.data.breadcrumbs : undefined))
    .reduce(coalesce);
}

export function useBuildInfo() {
  return useMatches()
    .map(({ data }) => buildInfo.safeParse(data))
    .map((result) => (result.success ? result.data.buildInfo : undefined))
    .reduce(coalesce);
}

export function useI18nNamespaces() {
  return useMatches()
    .map(({ data }) => i18nNamespaces.safeParse(data))
    .flatMap((result) => (result.success ? result.data.i18nNamespaces : undefined))
    .filter((i18nNamespaces) => i18nNamespaces !== undefined);
}

export function usePageIdentifier() {
  return useMatches()
    .map(({ data }) => pageIdentifier.safeParse(data))
    .map((result) => (result.success ? result.data.pageIdentifier : undefined))
    .reduce(coalesce);
}

export function usePageTitle() {
  return useMatches()
    .map(({ data }) => pageTitle.safeParse(data))
    .map((result) => (result.success ? result.data.pageTitle : undefined))
    .reduce(coalesce);
}
