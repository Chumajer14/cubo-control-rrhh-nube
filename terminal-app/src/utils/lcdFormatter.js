export const LCD_MODE = "20x4";
export const MAX_LCD_LINES = 4;
export const MAX_LCD_CHARS = 20;

function normalizeLcdText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Limits terminal copy to fixed-width LCD rows without resizing the text.
 */
export function formatLcdLine(value) {
  return normalizeLcdText(value).slice(0, MAX_LCD_CHARS).padEnd(MAX_LCD_CHARS, " ");
}

/**
 * Produces a stable 20x4 payload for the simulated alphanumeric display.
 */
export function formatLcdLines(lines) {
  const normalizedLines = Array.isArray(lines) ? lines : [lines];
  return normalizedLines
    .slice(0, MAX_LCD_LINES)
    .map(formatLcdLine)
    .concat(Array.from({ length: MAX_LCD_LINES }, () => " ".repeat(MAX_LCD_CHARS)))
    .slice(0, MAX_LCD_LINES);
}
