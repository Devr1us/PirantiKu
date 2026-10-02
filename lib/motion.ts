/**
 * Unified motion constants, timing curves, and stagger presets
 * for PirantiKu application animations.
 */

// Master flag: when true, scroll animations replay on entering the screen from both directions.
// If set to false, all animations run once on initial view.
export const ANIMASI_ULANG = true;

// Easing presets
export const EASE = [0.22, 1, 0.36, 1] as const; // Smooth exponential ease-out
export const EASE_OUT = [0, 0, 0.2, 1] as const;

// Distance preset
export const Y_OFFSET = 16; // 16px slide distance

// Visibility thresholds for hysteresis (flicker prevention)
export const THRESHOLD_ENTER = 0.2; // Shown when at least 20% visible
export const THRESHOLD_RESET = 0; // Reset only when 0% visible (completely offscreen)

// Duration presets
export const DURATION_FAST = 0.2;
export const DURATION_SHORT = 0.25;
export const DURATION_BASE = 0.35;
export const DURATION_MEDIUM = 0.45;
export const DURATION_PARAGRAPH = 0.5;
export const DURATION_LONG = 0.6;
export const DURATION_COUNTUP = 0.85; // Max 900ms for CountUp

// Stagger presets
export const STAGGER_CHAR = 0.02; // 20ms per character
export const STAGGER_WORD = 0.06; // 60ms per word
export const STAGGER_LINE = 0.09; // 90ms per line
export const STAGGER_LIST_ITEM = 0.05; // 50ms per card/item

export const MAX_STAGGER_DELAY = 0.2; // Capped at 0.2s for long list items

/**
 * Calculates column-based delay for grid items to prevent long waits:
 * delay = (index % columnCount) * 0.05, max 0.2s
 */
export function getGridColumnDelay(index: number, columnCount: number = 3): number {
  if (columnCount <= 1) return 0;
  return Math.min((index % columnCount) * STAGGER_LIST_ITEM, MAX_STAGGER_DELAY);
}

/**
 * Backward compatible clamped stagger delay for list items
 */
export function getListStaggerDelay(index: number): number {
  return Math.min((index % 3) * STAGGER_LIST_ITEM, MAX_STAGGER_DELAY);
}
