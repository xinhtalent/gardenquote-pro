// Utility functions for dimension and unit parsing

/**
 * Parse dimension input accepting m/cm/mm units and comma/period as decimal separator
 * Returns value in meters, rounded to 2 decimal places
 */
export function parseDimensionToMeters(input: string): number | null {
  if (!input || input.trim() === '') return null;
  
  // Normalize decimal separator: replace , with .
  let normalized = input.trim().replace(',', '.');
  
  // Extract number and unit
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(m|cm|mm)?$/i);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'm').toLowerCase();
  
  let meters: number;
  switch (unit) {
    case 'cm':
      meters = value / 100;
      break;
    case 'mm':
      meters = value / 1000;
      break;
    case 'm':
    default:
      meters = value;
      break;
  }
  
  // Round to 2 decimal places
  return Math.round(meters * 100) / 100;
}

/**
 * Parse thickness input accepting cm/mm units
 * Returns value in cm, rounded to 2 decimal places
 */
export function parseThicknessToCm(input: string): number | null {
  if (!input || input.trim() === '') return null;
  
  // Normalize decimal separator
  let normalized = input.trim().replace(',', '.');
  
  // Extract number and unit
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(cm|mm)?$/i);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'cm').toLowerCase();
  
  let cm: number;
  switch (unit) {
    case 'mm':
      cm = value / 10;
      break;
    case 'cm':
    default:
      cm = value;
      break;
  }
  
  // Round to 2 decimal places
  return Math.round(cm * 100) / 100;
}

/**
 * Format dimension value with unit (m)
 */
export function formatDimension(value: number | null | undefined, showUnit = true): string {
  if (value === null || value === undefined) return '';
  // Only show decimals if needed
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '');
  return showUnit ? `${formatted} m` : formatted;
}

/**
 * Format thickness value with unit (cm)
 */
export function formatThickness(value: number | null | undefined, showUnit = true): string {
  if (value === null || value === undefined) return '';
  // Only show decimals if needed
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '');
  return showUnit ? `${formatted} cm` : formatted;
}

/**
 * Calculate area from two dimensions
 */
export function calculateArea(dim1: number | null, dim2: number | null): number | null {
  if (dim1 === null || dim2 === null || dim1 <= 0 || dim2 <= 0) return null;
  return Math.round(dim1 * dim2 * 100) / 100;
}

/**
 * Parse length input in centimeters (accepts numbers with optional 'cm').
 * Returns value in cm, rounded to 2 decimal places
 */
export function parseLengthToCm(input: string): number | null {
  if (!input || input.trim() === '') return null;
  const normalized = input.trim().replace(',', '.');
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(cm)?$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const cm = value;
  return Math.round(cm * 100) / 100;
}

/**
 * Parse thickness input in millimeters (accepts numbers with optional 'mm').
 * Returns value in mm, rounded to 2 decimal places
 */
export function parseThicknessToMm(input: string): number | null {
  if (!input || input.trim() === '') return null;
  const normalized = input.trim().replace(',', '.');
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(mm)?$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const mm = value;
  return Math.round(mm * 100) / 100;
}

/**
 * Convert centimeters to meters (rounded to 2 decimals)
 */
export function cmToMeters(value: number | null): number | null {
  if (value === null) return null;
  return Math.round((value / 100) * 100) / 100;
}
