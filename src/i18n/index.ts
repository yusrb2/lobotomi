import { en } from './en';
import { id } from './id';
import type { Locale } from '../db/types';

export const dictionaries = { en, id } as const;

export function getDict(locale: Locale) {
  return dictionaries[locale] ?? en;
}
