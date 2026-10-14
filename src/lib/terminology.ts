import type { User } from '@/types';

type TermKey = 'bleeding' | 'self' | 'period' | 'body';

const defaults = {
  self: '',
  bleeding: 'period',
  anatomy: 'medical' as const,
};

export function getTerms(user: User | null) {
  const t = user?.terminology ?? defaults;
  return {
    bleeding: t.bleeding || 'period',
    self: t.self || '',
    anatomy: t.anatomy || 'medical',
  };
}

type TemplateVar = '{bleeding}' | '{Bleeding}' | '{self}' | '{Self}';

export function t(template: string, user: User | null): string {
  const terms = getTerms(user);
  let result = template;
  result = result.replaceAll('{bleeding}', terms.bleeding);
  result = result.replaceAll('{Bleeding}', capitalize(terms.bleeding));
  result = result.replaceAll('{self}', terms.self);
  result = result.replaceAll('{Self}', capitalize(terms.self));
  return result;
}

export function tPhrase(template: string, user: User | null, fallback: string): string {
  const terms = getTerms(user);
  const hasSelf = template.includes('{self}') || template.includes('{Self}');
  if (hasSelf && !terms.self) return fallback;
  return t(template, user);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function possessive(user: User | null): string {
  const terms = getTerms(user);
  if (terms.self) return `${terms.self}'s`;
  return 'your';
}