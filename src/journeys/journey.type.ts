/* eslint-disable @typescript-eslint/no-magic-numbers -- these are header levels not magic numbers*/

export type HeaderLevel = 1 | 2 | 3 | 4;

export const characterLimt: Record<string, number> = {
  fiveHundred: 500,
} as const;

export const headerLevels: Record<"h1" | "h2" | "h3" | "h4", HeaderLevel> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
};
