/**
 * Unified motion constants, timing curves, and stagger presets
 * for PirantiKu application animations.
 */

export const EASE = [0.22, 1, 0.36, 1] as const; // Smooth exponential ease-out
export const EASE_OUT = [0, 0, 0.2, 1] as const;

export const DURATION_FAST = 0.2;
export const DURATION_SHORT = 0.25;
export const DURATION_BASE = 0.35;
export const DURATION_MEDIUM = 0.45;
export const DURATION_PARAGRAPH = 0.5;
export const DURATION_LONG = 0.6;

export const STAGGER_CHAR = 0.02; // 20ms per character
export const STAGGER_WORD = 0.06; // 60ms per word
export const STAGGER_LINE = 0.09; // 90ms per line
export const STAGGER_LIST_ITEM = 0.05; // 50ms per card/item

export const MAX_STAGGER_DELAY = 0.6; // Cap for list items: Math.min(index * 0.05, 0.6)

/**
 * Calculates clamped stagger delay for list items
 */
export function getListStaggerDelay(index: number): number {
  return Math.min(index * STAGGER_LIST_ITEM, MAX_STAGGER_DELAY);
}
